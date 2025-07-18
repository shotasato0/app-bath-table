<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Schedule;
use App\Models\Resident;
use App\Models\User;
use App\Models\CalendarDate;
use App\Models\ScheduleType;
use Carbon\Carbon;

class ScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 管理者ユーザーを取得（存在しない場合は作成）
        $adminUser = User::firstOrCreate([
            'username' => 'admin',
        ], [
            'name' => '管理者',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // テスト利用者を作成
        $residents = [
            [
                'name' => '田中 太郎',
                'room_number' => '101',
                'age' => 75,
                'gender' => 'male',
                'care_level' => '要介護2',
                'status' => 'active',
                'birth_date' => '1948-05-15',
                'medical_notes' => '高血圧の管理が必要',
                'primary_staff_id' => $adminUser->id,
            ],
            [
                'name' => '佐藤 花子',
                'room_number' => '102',
                'age' => 82,
                'gender' => 'female',
                'care_level' => '要介護3',
                'status' => 'active',
                'birth_date' => '1941-11-22',
                'medical_notes' => '認知症の症状あり',
                'primary_staff_id' => $adminUser->id,
            ],
            [
                'name' => '鈴木 次郎',
                'room_number' => '103',
                'age' => 69,
                'gender' => 'male',
                'care_level' => '要介護1',
                'status' => 'active',
                'birth_date' => '1954-03-10',
                'medical_notes' => '糖尿病の管理中',
                'primary_staff_id' => $adminUser->id,
            ],
        ];

        foreach ($residents as $residentData) {
            Resident::firstOrCreate([
                'name' => $residentData['name'],
                'room_number' => $residentData['room_number'],
            ], $residentData);
        }

        // テスト予定を作成
        $today = Carbon::today();
        $residents = Resident::all();

        $schedules = [
            [
                'title' => '田中さんの入浴',
                'description' => '午前の入浴予定',
                'resident_id' => $residents[0]->id,
                'date' => $today->format('Y-m-d'),
                'start_time' => '10:00',
                'end_time' => '11:00',
                'type' => 'bathing',
                'column_type' => 'bathing',
                'priority' => 'medium',
                'status' => 'scheduled',
                'location' => '一般浴室',
                'created_by' => $adminUser->id,
                'staff_id' => $adminUser->id,
            ],
            [
                'title' => '佐藤さんの医療チェック',
                'description' => '血圧測定と薬の服用確認',
                'resident_id' => $residents[1]->id,
                'date' => $today->format('Y-m-d'),
                'start_time' => '09:30',
                'end_time' => '10:00',
                'type' => 'medical',
                'column_type' => 'medical',
                'priority' => 'high',
                'status' => 'scheduled',
                'location' => '医務室',
                'created_by' => $adminUser->id,
                'staff_id' => $adminUser->id,
            ],
            [
                'title' => '鈴木さんのリハビリ',
                'description' => '午後のリハビリテーション',
                'resident_id' => $residents[2]->id,
                'date' => $today->format('Y-m-d'),
                'start_time' => '14:00',
                'end_time' => '15:00',
                'type' => 'activity',
                'column_type' => 'medical',
                'priority' => 'medium',
                'status' => 'scheduled',
                'location' => 'リハビリ室',
                'created_by' => $adminUser->id,
                'staff_id' => $adminUser->id,
            ],
        ];

        foreach ($schedules as $scheduleData) {
            Schedule::firstOrCreate([
                'title' => $scheduleData['title'],
                'resident_id' => $scheduleData['resident_id'],
                'date' => $scheduleData['date'],
                'start_time' => $scheduleData['start_time'],
            ], $scheduleData);
        }
    }
}