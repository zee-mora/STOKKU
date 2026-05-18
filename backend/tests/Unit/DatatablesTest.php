<?php

namespace Tests\Unit;

use App\Helpers\Datatables\Datatables;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\Request;
use Tests\TestCase;

class DatatablesTest extends TestCase
{
    public function test_datatables_filters_orders_and_paginates_results(): void
    {
        $rows = [
            (object) ['name' => 'Alice', 'email' => 'alice@example.com'],
            (object) ['name' => 'Alicia', 'email' => 'alicia@example.com'],
            (object) ['name' => 'Bob', 'email' => 'bob@example.com'],
        ];

        $builder = new class ($rows) extends QueryBuilder {
            /** @var array<int, object> */
            public array $rows;

            /** @var array<int, object> */
            public array $originalRows;

            public function __construct(array $rows)
            {
                $this->rows = $rows;
                $this->originalRows = $rows;
            }

            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if ($column instanceof \Closure) {
                    $column($this);

                    return $this;
                }

                if ($operator === 'like') {
                    $this->rows = array_values(array_filter($this->rows, function ($row) use ($column, $value): bool {
                        $needle = strtolower(trim(str_replace('%', '', (string) $value)));
                        $haystack = strtolower((string) data_get($row, $column));

                        return str_contains($haystack, $needle);
                    }));
                }

                return $this;
            }

            public function orWhere($column, $operator = null, $value = null)
            {
                if ($operator === 'like') {
                    $matches = array_values(array_filter($this->originalRows, function ($row) use ($column, $value): bool {
                        $needle = strtolower(trim(str_replace('%', '', (string) $value)));
                        $haystack = strtolower((string) data_get($row, $column));

                        return str_contains($haystack, $needle);
                    }));

                    $this->rows = array_values(array_unique(array_merge($this->rows, $matches), SORT_REGULAR));
                }

                return $this;
            }

            public function orderBy($column, $direction = 'asc')
            {
                usort($this->rows, function ($left, $right) use ($column, $direction): int {
                    $leftValue = data_get($left, $column);
                    $rightValue = data_get($right, $column);

                    return $direction === 'desc'
                        ? strcmp((string) $rightValue, (string) $leftValue)
                        : strcmp((string) $leftValue, (string) $rightValue);
                });

                return $this;
            }

            public function skip($value)
            {
                $this->rows = array_slice($this->rows, (int) $value);

                return $this;
            }

            public function take($value)
            {
                $this->rows = array_slice($this->rows, 0, (int) $value);

                return $this;
            }

            public function count($columns = '*')
            {
                return count($this->rows);
            }

            public function get($columns = ['*'])
            {
                return collect($this->rows);
            }
        };

        $request = Request::create('/users', 'GET', [
            'draw' => 7,
            'start' => 0,
            'length' => 10,
            'search' => ['value' => 'ali'],
            'order' => [
                ['column' => 0, 'dir' => 'asc'],
            ],
            'columns' => [
                ['data' => 'name', 'name' => 'users.name', 'searchable' => 'true', 'orderable' => 'true'],
                ['data' => 'email', 'name' => 'users.email', 'searchable' => 'true', 'orderable' => 'true'],
            ],
        ]);

        $response = Datatables::method(
            $builder,
            [
                'name' => 'name',
                'email' => 'email',
            ],
            $request,
        )->make();

        $payload = $response->getData(true);

        $this->assertSame(7, $payload['draw']);
        $this->assertSame(3, $payload['recordsTotal']);
        $this->assertSame(2, $payload['recordsFiltered']);
        $this->assertCount(2, $payload['data']);
        $this->assertSame('Alice', $payload['data'][0]['name']);
        $this->assertSame('Alicia', $payload['data'][1]['name']);
    }
}