<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Resident>
 */
class ResidentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'gender' => $this->faker->randomElement(['M', 'F']),
            'birth_date' => $this->faker->dateTimeBetween('-100 years', '-65 years')->format('Y-m-d'),
            'medical_notes' => $this->faker->optional()->paragraph(),
        ];
    }
}
