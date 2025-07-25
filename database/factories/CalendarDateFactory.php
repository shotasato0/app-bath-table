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
            'calendar_date' => $this->faker->date(),
            'day_of_week' => $this->faker->numberBetween(0, 6),
            'is_holiday' => $this->faker->boolean(20),
            'holiday_name' => $this->faker->optional()->words(2, true),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
