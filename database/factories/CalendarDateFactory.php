<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CalendarDate>
 */
class CalendarDateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'calendar_date' => fake()->dateTimeBetween('now', '+1 year')->format('Y-m-d'),
            'day_of_week' => fake()->numberBetween(0, 6),
            'is_holiday' => fake()->boolean(20),
            'holiday_name' => fake()->optional()->words(2, true),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
