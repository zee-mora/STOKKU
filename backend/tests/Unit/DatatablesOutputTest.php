<?php

namespace Tests\Unit;

use App\Helpers\Datatables\Datatables;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\Request;
use Tests\TestCase;

class DatatablesOutputTest extends TestCase
{
    public function test_datatables_output_structure(): void
    {
        // Sample data: 5 users
        $rows = [
            (object) ['id' => 1, 'name' => 'Alice Johnson', 'email' => 'alice@example.com', 'created_at' => '2026-04-20 10:30:00'],
            (object) ['id' => 2, 'name' => 'Alicia Smith', 'email' => 'alicia@example.com', 'created_at' => '2026-04-21 14:15:00'],
            (object) ['id' => 3, 'name' => 'Bob Wilson', 'email' => 'bob@example.com', 'created_at' => '2026-04-22 09:45:00'],
            (object) ['id' => 4, 'name' => 'Charlie Brown', 'email' => 'charlie@example.com', 'created_at' => '2026-04-23 16:20:00'],
            (object) ['id' => 5, 'name' => 'Diana Prince', 'email' => 'diana@example.com', 'created_at' => '2026-04-24 11:00:00'],
        ];

        // Mock builder
        $builder = new class ($rows) extends QueryBuilder {
            public array $rows;
            public array $originalRows;

            public function __construct(array $rows) {
                $this->rows = $rows;
                $this->originalRows = $rows;
            }

            public function where($column, $operator = null, $value = null, $boolean = 'and') {
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

            public function orWhere($column, $operator = null, $value = null) {
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

            public function orderBy($column, $direction = 'asc') {
                usort($this->rows, function ($left, $right) use ($column, $direction): int {
                    $leftValue = data_get($left, $column);
                    $rightValue = data_get($right, $column);
                    return $direction === 'desc'
                        ? strcmp((string) $rightValue, (string) $leftValue)
                        : strcmp((string) $leftValue, (string) $rightValue);
                });
                return $this;
            }

            public function skip($value) {
                $this->rows = array_slice($this->rows, (int) $value);
                return $this;
            }

            public function take($value) {
                $this->rows = array_slice($this->rows, 0, (int) $value);
                return $this;
            }

            public function count($columns = '*') {
                return count($this->rows);
            }

            public function get($columns = ['*']) {
                return collect($this->rows);
            }
        };

        // Request: no search, no filter, just paginate first 2 rows
        $request = Request::create('/users', 'GET', [
            'draw' => 1,
            'start' => 0,
            'length' => 2,
            'search' => ['value' => ''],
            'order' => [['column' => 0, 'dir' => 'asc']],
            'columns' => [
                ['data' => 'name', 'name' => '', 'searchable' => 'true', 'orderable' => 'true'],
                ['data' => 'email', 'name' => '', 'searchable' => 'true', 'orderable' => 'true'],
                ['data' => 'created_at', 'name' => '', 'searchable' => 'false', 'orderable' => 'false'],
            ],
        ]);

        $response = Datatables::method(
            $builder,
            [
                'name' => 'name',
                'email' => 'email',
                'created_at' => 'created_at',
            ],
            $request,
        )->make();

        $payload = $response->getData(true);

        // Output struktur lengkap
        echo "\n\n=== DATATABLES OUTPUT ===\n";
        echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n\n";

        // Validasi struktur
        $this->assertArrayHasKey('draw', $payload);
        $this->assertArrayHasKey('recordsTotal', $payload);
        $this->assertArrayHasKey('recordsFiltered', $payload);
        $this->assertArrayHasKey('data', $payload);

        $this->assertSame(1, $payload['draw']);
        $this->assertSame(5, $payload['recordsTotal']);
        $this->assertSame(5, $payload['recordsFiltered']);
        $this->assertCount(2, $payload['data']);
    }

    public function test_datatables_with_search(): void
    {
        $rows = [
            (object) ['id' => 1, 'name' => 'Alice', 'email' => 'alice@example.com'],
            (object) ['id' => 2, 'name' => 'Bob', 'email' => 'bob@example.com'],
            (object) ['id' => 3, 'name' => 'Alicia', 'email' => 'alicia@example.com'],
        ];

        $builder = new class ($rows) extends QueryBuilder {
            public array $rows;
            public array $originalRows;

            public function __construct(array $rows) {
                $this->rows = $rows;
                $this->originalRows = $rows;
            }

            public function where($column, $operator = null, $value = null, $boolean = 'and') {
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

            public function orWhere($column, $operator = null, $value = null) {
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

            public function orderBy($column, $direction = 'asc') {
                usort($this->rows, function ($left, $right) use ($column, $direction): int {
                    $leftValue = data_get($left, $column);
                    $rightValue = data_get($right, $column);
                    return $direction === 'desc'
                        ? strcmp((string) $rightValue, (string) $leftValue)
                        : strcmp((string) $leftValue, (string) $rightValue);
                });
                return $this;
            }

            public function skip($value) {
                $this->rows = array_slice($this->rows, (int) $value);
                return $this;
            }

            public function take($value) {
                $this->rows = array_slice($this->rows, 0, (int) $value);
                return $this;
            }

            public function count($columns = '*') {
                return count($this->rows);
            }

            public function get($columns = ['*']) {
                return collect($this->rows);
            }
        };

        // Request dengan search "ali"
        $request = Request::create('/users', 'GET', [
            'draw' => 1,
            'start' => 0,
            'length' => 10,
            'search' => ['value' => 'ali'],
            'order' => [['column' => 0, 'dir' => 'asc']],
            'columns' => [
                ['data' => 'name', 'name' => '', 'searchable' => 'true', 'orderable' => 'true'],
                ['data' => 'email', 'name' => '', 'searchable' => 'true', 'orderable' => 'true'],
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

        echo "\n\n=== DATATABLES WITH SEARCH (search='ali') ===\n";
        echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n\n";

        // Hasil: Alice & Alicia (cocok dengan "ali")
        $this->assertSame(3, $payload['recordsTotal']);
        $this->assertSame(2, $payload['recordsFiltered']);
        $this->assertCount(2, $payload['data']);
    }
}
