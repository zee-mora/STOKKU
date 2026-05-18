<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expenses extends Model
{
    protected $table = 'expenses';

    protected $fillable = [
        'expense_category_id',
        'expense_date',
        'title',
        'amount',
        'description',
        'category_id'
    ];

    public function category()
    {
        return $this->belongsTo(Expenses_Category::class, 'expense_category_id');
    }
}
