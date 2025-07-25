<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\CalendarDate;
use App\Models\ScheduleType;
use App\Models\Resident;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Schedule>
 */
class ScheduleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startHour = $this->faker->numberBetween(6, 20);
        $endHour = $startHour + $this->faker->numberBetween(1, 3);
        
        return [
            'date_id' => CalendarDate::factory(),
            'title' => $this->faker->randomElement(['入浴サービス', 'ランチタイム', 'レクリエーション', '医療ケア', 'リハビリ']),
            'description' => $this->faker->optional()->sentence(),
            'start_time' => sprintf('%02d:00', $startHour),
            'end_time' => sprintf('%02d:00', min($endHour, 23)),
            'schedule_type_id' => ScheduleType::factory(),
            'resident_id' => Resident::factory(),
        ];
    }
}
