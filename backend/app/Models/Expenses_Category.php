<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expenses_Category extends Model
{
    protected $table = 'expense_categories';

    protected $fillable = ['name'];

    public function expenses()
    {
        return $this->hasMany(Expenses::class, 'expense_category_id');
    }
    
}
