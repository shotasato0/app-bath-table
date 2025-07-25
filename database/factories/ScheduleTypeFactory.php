<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ScheduleType>
 */
class ScheduleTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type_name' => fake()->randomElement(['入浴', '食事', 'レクリエーション', '医療', 'その他']),
            'color_code' => fake()->hexColor(),
        ];
    }
}
