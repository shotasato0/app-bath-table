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
            'gender' => $this->faker->randomElement(['male', 'female', 'other']),
            'birth_date' => $this->faker->dateTimeBetween('-100 years', '-65 years')->format('Y-m-d'),
            'age' => $this->faker->numberBetween(60, 100),
            'room_number' => $this->faker->optional()->regexify('[A-Z][0-9]{3}'),
            'care_level' => $this->faker->optional()->randomElement(['軽度', '中度', '重度']),
            'status' => $this->faker->randomElement(['active', 'inactive', 'medical_care', 'temporary_leave']),
            'medical_notes' => $this->faker->optional()->paragraph(),
            'special_requirements' => $this->faker->optional()->sentence(),
            'primary_staff_id' => null,
        ];
    }
}
