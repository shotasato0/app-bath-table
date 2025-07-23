<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Schedule;
use App\Models\User;
use App\Models\Resident;
use App\Models\ScheduleType;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        // 必要なデータが存在するかチェック
        $users = User::all();
        $residents = Resident::all();
        $scheduleTypes = ScheduleType::all();
        if ($users->isEmpty() || $scheduleTypes->isEmpty()) {
            $this->command->warn('必要なマスターデータが不足しています。先にUserSeederとScheduleTypeSeederを実行してください。');
            return;
        }

        // 既存のスケジュールをクリア（開発用）
        Schedule::truncate();

        // 今日から2週間分のサンプルデータを作成
        $startDate = Carbon::today();
        
        for ($i = 0; $i < 14; $i++) {
            $date = $startDate->copy()->addDays($i);
            
            // calendar_datesテーブルに日付レコードを作成または取得
            $calendarDate = DB::table('calendar_dates')
                ->where('calendar_date', $date->format('Y-m-d'))
                ->first();
                
            if (!$calendarDate) {
                $dateId = DB::table('calendar_dates')->insertGetId([
                    'calendar_date' => $date->format('Y-m-d'),
                    'day_of_week' => $date->dayOfWeek,
                    'is_holiday' => false,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $dateId = $calendarDate->id;
            }
            
            // 毎日の基本スケジュール
            $dailySchedules = [
                [
                    'title' => '朝の申し送り',
                    'description' => '夜勤から日勤への申し送り',
                    'start_time' => '08:00',
                    'end_time' => '08:30',
                    'type' => 'general',
                    'priority' => 'high'
                ],
                [
                    'title' => '昼食準備',
                    'description' => '昼食の準備と配膳',
                    'start_time' => '11:30',
                    'end_time' => '12:30',
                    'type' => 'general',
                    'priority' => 'medium'
                ],
                [
                    'title' => '夕方の申し送り',
                    'description' => '日勤から夜勤への申し送り',
                    'start_time' => '17:00',
                    'end_time' => '17:30',
                    'type' => 'general',
                    'priority' => 'high'
                ]
            ];

            // 一般スケジュールを作成
            foreach ($dailySchedules as $scheduleData) {
                Schedule::create([
                    'title' => $scheduleData['title'],
                    'description' => $scheduleData['description'],
                    'schedule_type_id' => $scheduleTypes->random()->id,
                    'resident_id' => null,
                    'created_by' => $users->random()->id,
                    'date_id' => $dateId,
                    'date' => $date->format('Y-m-d'),
                    'start_time' => $scheduleData['start_time'],
                    'end_time' => $scheduleData['end_time'],
                    'type' => $scheduleData['type'],
                    'column_type' => 'general',
                    'priority' => $scheduleData['priority'],
                    'status' => 'scheduled'
                ]);
            }

            // 入浴スケジュール（平日のみ、3-5名）
            if ($date->isWeekday() && $residents->isNotEmpty()) {
                $bathingCount = rand(3, min(5, $residents->count()));
                $selectedResidents = $residents->random($bathingCount);
                
                $bathingTimes = [
                    '09:00' => '09:30',
                    '09:30' => '10:00', 
                    '10:00' => '10:30',
                    '10:30' => '11:00',
                    '14:00' => '14:30'
                ];
                
                $timeIndex = 0;
                foreach ($selectedResidents as $resident) {
                    $times = array_keys($bathingTimes);
                    if ($timeIndex < count($times)) {
                        $startTime = $times[$timeIndex];
                        $endTime = $bathingTimes[$startTime];
                        
                        Schedule::create([
                            'title' => $resident->name . 'さん 入浴',
                            'description' => '入浴介助',
                            'schedule_type_id' => $scheduleTypes->random()->id,
                            'resident_id' => $resident->id,
                            'created_by' => $users->random()->id,
                            'date_id' => $dateId,
                            'date' => $date->format('Y-m-d'),
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'type' => 'bathing',
                            'column_type' => 'bathing',
                            'priority' => 'medium',
                            'status' => 'scheduled'
                        ]);
                        
                        $timeIndex++;
                    }
                }
            }

            // 週末の特別なスケジュール
            if ($date->isWeekend()) {
                Schedule::create([
                    'title' => 'レクリエーション活動',
                    'description' => '週末の特別活動',
                    'schedule_type_id' => $scheduleTypes->random()->id,
                    'resident_id' => null,
                    'created_by' => $users->random()->id,
                    'date_id' => $dateId,
                    'date' => $date->format('Y-m-d'),
                    'start_time' => '14:00',
                    'end_time' => '15:30',
                    'type' => 'activity',
                    'column_type' => 'general',
                    'priority' => 'low',
                    'status' => 'scheduled'
                ]);
            }
        }

        $totalSchedules = Schedule::count();
        $bathingSchedules = Schedule::where('type', 'bathing')->count();
        
        $this->command->info("スケジュールサンプルデータを作成しました");
        $this->command->info("- 総スケジュール数: {$totalSchedules}");
        $this->command->info("- 入浴スケジュール数: {$bathingSchedules}");
    }
}