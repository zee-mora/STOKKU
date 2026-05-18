<?php

namespace App\Helpers\Datatables;

use Closure;

class DatatablesColumn
{
    public function __construct(
        public readonly string $data,
        public readonly ?string $column = null,
        public readonly bool $searchable = true,
        public readonly bool $orderable = true,
        public readonly ?Closure $searchCallback = null,
        public readonly ?Closure $orderCallback = null,
    ) {
    }

    /**
     * @param  int|string  $key
     * @param  mixed  $definition
     */
    public static function fromDefinition(int|string $key, mixed $definition): self
    {
        if (is_string($definition)) {
            return new self(
                data: is_string($key) ? $key : $definition,
                column: $definition,
            );
        }

        if (! is_array($definition)) {
            return new self(data: is_string($key) ? $key : (string) $key);
        }

        $data = (string) ($definition['data'] ?? (is_string($key) ? $key : ($definition['column'] ?? $definition['name'] ?? $key)));
        $column = $definition['column'] ?? $definition['name'] ?? null;
        $searchable = (bool) ($definition['searchable'] ?? true);
        $orderable = (bool) ($definition['orderable'] ?? true);
        $searchCallback = isset($definition['search']) && is_callable($definition['search'])
            ? $definition['search']
            : null;
        $orderCallback = isset($definition['order']) && is_callable($definition['order'])
            ? $definition['order']
            : null;

        return new self(
            data: $data,
            column: is_string($column) && $column !== '' ? $column : null,
            searchable: $searchable,
            orderable: $orderable,
            searchCallback: $searchCallback,
            orderCallback: $orderCallback,
        );
    }

    public function isSearchable(): bool
    {
        return $this->searchable;
    }

    public function isOrderable(): bool
    {
        return $this->orderable;
    }

    public function getSearchField(): ?string
    {
        return $this->column ?? $this->data;
    }

    public function getOrderField(): ?string
    {
        return $this->column ?? $this->data;
    }
}