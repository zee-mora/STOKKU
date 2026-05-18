<?php

namespace Database\Factories;

use App\Models\Mresidents;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Mresidents>
 */
class MresidentsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'fullname' => fake()->name(),
            'resident_status' => 'Tetap',
            'phone_number' => fake()->phoneNumber(),
            'marital_status' => 'Belum Menikah',
        ];
    }
}
