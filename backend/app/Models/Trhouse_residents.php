<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trhouse_residents extends Model
{
    protected $table = 'trhouse_residents';

    protected $fillable = [
        'house_id',
        'resident_id',
        'start_date',
        'end_date',
        'is_active'
    ];

    public function house()
    {
        return $this->belongsTo(Mhouse::class, 'house_id');
    }

    public function resident()
    {
        return $this->belongsTo(Mresidents::class, 'resident_id');
    }

    public function payments()
    {
        return $this->hasMany(Payments::class, 'trhouse_resident_id');
    }
}
