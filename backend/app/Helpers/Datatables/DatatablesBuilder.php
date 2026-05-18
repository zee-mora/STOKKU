<?php

namespace App\Helpers\Datatables;

use Closure;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class DatatablesBuilder
{
    /** @var Closure|EloquentBuilder|QueryBuilder */
    protected Closure|EloquentBuilder|QueryBuilder $source;

    /** @var array<int, DatatablesColumn> */
    protected array $columns = [];

    protected Request $request;

    /** @var callable|null */
    protected $transformer = null;

    /** @var array<int, array<string, mixed>> */
    protected array $prependRows = [];

    /** @var array<int, array<string, mixed>> */
    protected array $appendRows = [];

    /** @var array<string, mixed> */
    protected array $extra = [];

    /**
     * @param  Closure|EloquentBuilder|QueryBuilder  $source
     */
    public function __construct(Closure|EloquentBuilder|QueryBuilder $source, array $columns = [], ?Request $request = null)
    {
        $this->source = $source;
        $this->request = $request ?? request();
        $this->setColumns($columns);
    }

    public function setColumns(array $columns): self
    {
        $normalized = [];

        foreach ($columns as $key => $definition) {
            $normalized[] = DatatablesColumn::fromDefinition($key, $definition);
        }

        $this->columns = $normalized;

        return $this;
    }

    public function transform(callable $transformer): self
    {
        $this->transformer = $transformer;

        return $this;
    }

    public function prepend(array|Arrayable $row): self
    {
        array_unshift($this->prependRows, $this->normalizeRow($row));

        return $this;
    }

    public function append(array|Arrayable $row): self
    {
        $this->appendRows[] = $this->normalizeRow($row);

        return $this;
    }

    public function with(array $extra): self
    {
        $this->extra = array_merge($this->extra, $extra);

        return $this;
    }

    public function make(): JsonResponse
    {
        return $this->json();
    }

    public function json(array $extra = []): JsonResponse
    {
        return response()->json($this->toArray($extra));
    }

    public function toArray(array $extra = []): array
    {
        $baseQuery = $this->resolveQuery();
        $total = $this->count(clone $baseQuery);

        $filteredQuery = clone $baseQuery;
        $this->applySearch($filteredQuery);
        $filtered = $this->count(clone $filteredQuery);

        $this->applyOrdering($filteredQuery);
        $this->applyPaging($filteredQuery);

        $rows = $this->hydrateRows($filteredQuery->get()->all());

        if ($this->transformer !== null) {
            $rows = array_map($this->transformer, $rows, array_keys($rows));
        }

        $rows = array_values(array_merge($this->prependRows, $rows, $this->appendRows));
        $rows = $this->applyIndexing($rows);

        return array_merge([
            'draw' => (int) $this->request->input('draw', 0),
            'recordsTotal' => $total,
            'recordsFiltered' => $filtered,
            'data' => $rows,
        ], $this->extra, $extra);
    }

    protected function resolveQuery(): EloquentBuilder|QueryBuilder
    {
        $query = $this->source instanceof Closure
            ? ($this->source)()
            : $this->source;

        if (! $query instanceof EloquentBuilder && ! $query instanceof QueryBuilder) {
            throw new InvalidArgumentException('Datatables source must resolve to an Eloquent or query builder.');
        }

        return $query;
    }

    /**
     * Add an "index" column to each row based on the request start offset.
     *
     * @param array<int, array<string,mixed>> $rows
     * @return array<int, array<string,mixed>>
     */
    protected function applyIndexing(array $rows): array
    {
        $start = max(0, (int) $this->request->input('start', 0));

        // Ensure columns contain an index column at the front
        $hasIndex = collect($this->columns)->contains(fn (DatatablesColumn $column) => $column->data === 'index');

        if (! $hasIndex) {
            array_unshift($this->columns, new DatatablesColumn('index', 'index', searchable: false, orderable: false));
        }

        foreach (array_values($rows) as $i => $row) {
            $rows[$i]['index'] = $start + $i + 1;
        }

        return $rows;
    }

    protected function applySearch(EloquentBuilder|QueryBuilder $query): void
    {
        $search = trim((string) data_get($this->request->all(), 'search.value', ''));

        if ($search === '') {
            return;
        }

        $searchColumns = array_values(array_filter($this->columns, static fn (DatatablesColumn $column): bool => $column->isSearchable()));

        if ($searchColumns === []) {
            return;
        }

        $query->where(function ($builder) use ($search, $searchColumns): void {
            foreach ($searchColumns as $index => $column) {
                $this->applySearchForColumn($builder, $column, $search, $index === 0);
            }
        });
    }

    protected function applySearchForColumn(EloquentBuilder|QueryBuilder $query, DatatablesColumn $column, string $search, bool $first): void
    {
        if ($column->searchCallback !== null) {
            ($column->searchCallback)($query, $search, $column, $this->request);

            return;
        }

        $field = $column->getSearchField();

        if ($field === null || $field === '') {
            return;
        }

        $method = $first ? 'where' : 'orWhere';
        $query->{$method}($field, 'like', '%' . $search . '%');
    }

    protected function applyOrdering(EloquentBuilder|QueryBuilder $query): void
    {
        $orders = (array) $this->request->input('order', []);
        $requestColumns = (array) $this->request->input('columns', []);

        foreach ($orders as $order) {
            $index = (int) data_get($order, 'column', 0);
            $direction = strtolower((string) data_get($order, 'dir', 'asc')) === 'desc' ? 'desc' : 'asc';
            $requestColumn = $requestColumns[$index] ?? [];
            $column = $this->resolveColumn($index, $requestColumn);

            if ($column === null || ! $column->isOrderable()) {
                continue;
            }

            if ($column->orderCallback !== null) {
                ($column->orderCallback)($query, $direction, $column, $this->request);

                continue;
            }

            $field = $column->getOrderField();

            if ($field !== null && $field !== '') {
                $query->orderBy($field, $direction);
            }
        }
    }

    protected function applyPaging(EloquentBuilder|QueryBuilder $query): void
    {
        $length = (int) $this->request->input('length', 10);
        $start = max(0, (int) $this->request->input('start', 0));

        if ($length > -1) {
            $query->skip($start)->take($length);
        }
    }

    /**
     * @param  array<int, mixed>  $rows
     * @return array<int, array<string, mixed>>
     */
    protected function hydrateRows(array $rows): array
    {
        return array_map(function ($row): array {
            $row = $this->normalizeRow($row);

            if ($this->columns === []) {
                return $row;
            }

            $result = [];

            foreach ($this->columns as $column) {
                if ($column->data !== '') {
                    $result[$column->data] = data_get($row, $column->data);
                }
            }

            return $result !== [] ? $result : $row;
        }, $rows);
    }

    /**
     * @param  mixed  $row
     * @return array<string, mixed>
     */
    protected function normalizeRow(mixed $row): array
    {
        if (is_array($row)) {
            return $row;
        }

        if ($row instanceof Arrayable) {
            return $row->toArray();
        }

        if (is_object($row)) {
            return json_decode(json_encode($row), true) ?: [];
        }

        return [];
    }

    protected function resolveColumn(int $index, array $requestColumn): ?DatatablesColumn
    {
        $requestData = (string) data_get($requestColumn, 'data', '');
        $requestName = (string) data_get($requestColumn, 'name', '');

        foreach ($this->columns as $position => $column) {
            if ($position === $index) {
                return $column;
            }

            if ($requestData !== '' && $column->data === $requestData) {
                return $column;
            }

            if ($requestName !== '' && ($column->data === $requestName || $column->column === $requestName)) {
                return $column;
            }
        }

        return null;
    }

    protected function count(EloquentBuilder|QueryBuilder $query): int
    {
        return (int) $query->count();
    }
}