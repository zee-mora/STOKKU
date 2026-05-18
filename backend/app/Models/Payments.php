<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payments extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'trhouse_resident_id',
        'month',
        'period',
        'amount',
        'type',
        'year',
        'status',
        'paid_at',
    ];

    public function resident()
    {
        return $this->belongsTo(Trhouse_residents::class, 'trhouse_resident_id');
    }
}
