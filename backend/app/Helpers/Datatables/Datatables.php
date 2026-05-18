<?php

namespace App\Helpers\Datatables;

use Closure;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\Request;

class Datatables
{
    /**
     * Create a DataTables builder for an Eloquent/query builder or a resolver closure.
     *
     * @param  Closure|EloquentBuilder|QueryBuilder  $source
     */
    public static function method(Closure|EloquentBuilder|QueryBuilder $source, array $columns = [], ?Request $request = null): DatatablesBuilder
    {
        return new DatatablesBuilder($source, $columns, $request);
    }
}
