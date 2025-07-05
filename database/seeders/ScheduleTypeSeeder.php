<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ScheduleType;

class ScheduleTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $scheduleTypes = [
            [
                'type_name' => '入浴',
                'color_code' => '#FF5733',
                'is_active' => true
            ],
            [
                'type_name' => '会議',
                'color_code' => '#3498DB',
                'is_active' => true
            ],
            [
                'type_name' => 'イベント',
                'color_code' => '#9B59B6',
                'is_active' => true
            ],
            [
                'type_name' => 'レクリエーション',
                'color_code' => '#E74C3C',
                'is_active' => true
            ],
            [
                'type_name' => '個別対応',
                'color_code' => '#F39C12',
                'is_active' => true
            ],
            [
                'type_name' => '送迎',
                'color_code' => '#27AE60',
                'is_active' => true
            ],
            [
                'type_name' => '食事',
                'color_code' => '#E67E22',
                'is_active' => true
            ],
            [
                'type_name' => 'その他',
                'color_code' => '#95A5A6',
                'is_active' => true
            ],
        ];

        foreach ($scheduleTypes as $scheduleType) {
            ScheduleType::create($scheduleType);
        }
    }
}
