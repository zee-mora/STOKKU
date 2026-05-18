<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mhouse extends Model
{
	protected $table = 'Mhouses';

	protected $fillable = [
		'house_number',
		'address_detail',
		'is_occupied',
	];

	public function currentOccupancy()
	{
		return $this->hasOne(Trhouse_residents::class, 'house_id')->where('is_active', true)->whereNull('end_date');
	}

	public function occupancies()
	{
		return $this->hasMany(Trhouse_residents::class, 'house_id');
	}
}
