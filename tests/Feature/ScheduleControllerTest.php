<?php

use App\Models\User;
use App\Models\Schedule;
use App\Models\CalendarDate;
use App\Models\ScheduleType;
use App\Models\Resident;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->calendarDate = CalendarDate::factory()->create([
        'calendar_date' => '2025-07-24',
        'day_of_week' => 4,
        'is_holiday' => false,
    ]);
    $this->scheduleType = ScheduleType::factory()->create([
        'type_name' => '入浴',
        'color_code' => '#007bff',
    ]);
    $this->resident = Resident::factory()->create([
        'name' => 'テスト太郎',
        'gender' => '男性',
        'birth_date' => '1950-01-01',
    ]);
});

describe('GET /api/schedules', function () {
    it('認証済みユーザーがスケジュール一覧を取得できる', function () {
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'title' => 'テストスケジュール',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/schedules');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'description',
                        'start_time',
                        'end_time',
                        'calendarDate',
                        'scheduleType',
                        'resident',
                    ]
                ]
            ]);
    });

    it('未認証ユーザーはアクセスできない', function () {
        $response = $this->getJson('/api/schedules');
        $response->assertStatus(401);
    });
});

describe('GET /api/schedules/monthly', function () {
    it('月別スケジュールを取得できる', function () {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/schedules/monthly?year=2025&month=7');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    '*' => [
                        'id',
                        'calendar_date',
                        'day_of_week',
                        'is_holiday',
                        'schedules',
                    ]
                ]
            ]);
    });
});

describe('POST /api/schedules', function () {
    it('有効なデータでスケジュールを作成できる', function () {
        $scheduleData = [
            'date_id' => $this->calendarDate->id,
            'title' => '新しいスケジュール',
            'description' => 'テスト用の説明',
            'start_time' => '14:00',
            'end_time' => '15:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $scheduleData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'title',
                    'description',
                    'start_time',
                    'end_time',
                    'calendarDate',
                    'scheduleType',
                    'resident',
                ]
            ]);

        $this->assertDatabaseHas('schedules', [
            'title' => '新しいスケジュール',
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
        ]);
    });

    it('無効なデータではバリデーションエラーが発生する', function () {
        $invalidData = [
            'title' => '', // 必須項目が空
            'start_time' => '25:00', // 無効な時間形式
            'end_time' => '08:00', // 開始時刻より前
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'start_time', 'date_id', 'schedule_type_id', 'resident_id']);
    });
});

describe('GET /api/schedules/{schedule}', function () {
    it('指定したスケジュールの詳細を取得できる', function () {
        $schedule = Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'title' => 'テストスケジュール',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/schedules/{$schedule->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'id',
                    'title',
                    'calendarDate',
                    'scheduleType',
                    'resident',
                ]
            ]);
    });
});

describe('PUT /api/schedules/{schedule}', function () {
    it('スケジュールを更新できる', function () {
        $schedule = Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'title' => '元のタイトル',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ]);

        $updateData = [
            'title' => '更新されたタイトル',
            'description' => '更新された説明',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$schedule->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data'
            ]);

        $this->assertDatabaseHas('schedules', [
            'id' => $schedule->id,
            'title' => '更新されたタイトル',
            'description' => '更新された説明',
        ]);
    });
});

describe('DELETE /api/schedules/{schedule}', function () {
    it('スケジュールを削除できる', function () {
        $schedule = Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/schedules/{$schedule->id}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'スケジュールが削除されました'
            ]);

        $this->assertDatabaseMissing('schedules', [
            'id' => $schedule->id,
        ]);
    });
});