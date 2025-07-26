<?php

use App\Models\User;
use App\Models\CalendarDate;
use App\Models\ScheduleType;
use App\Models\Resident;
use App\Models\Schedule;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->calendarDate = CalendarDate::factory()->create([
        'calendar_date' => '2025-07-24',
    ]);
    $this->scheduleType = ScheduleType::factory()->create();
    $this->resident = Resident::factory()->create();
});

describe('時間重複チェックの詳細テスト', function () {
    it('新しいスケジュールが既存スケジュールを完全に包含する場合、エラーになる', function () {
        // 既存: 10:00-11:00
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'resident_id' => $this->resident->id,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 新規: 09:00-12:00 (既存を包含)
        $newSchedule = [
            'date_id' => $this->calendarDate->id,
            'title' => '包含スケジュール',
            'start_time' => '09:00',
            'end_time' => '12:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $newSchedule);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['time_conflict']);
    });

    it('既存スケジュールが新しいスケジュールを完全に包含する場合、エラーになる', function () {
        // 既存: 09:00-12:00
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'resident_id' => $this->resident->id,
            'start_time' => '09:00',
            'end_time' => '12:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 新規: 10:00-11:00 (既存に包含される)
        $newSchedule = [
            'date_id' => $this->calendarDate->id,
            'title' => '包含されるスケジュール',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $newSchedule);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['time_conflict']);
    });

    it('新しいスケジュールの開始時刻が既存スケジュールの時間内にある場合、エラーになる', function () {
        // 既存: 10:00-12:00
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'resident_id' => $this->resident->id,
            'start_time' => '10:00',
            'end_time' => '12:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 新規: 11:00-13:00 (開始時刻が既存の時間内)
        $newSchedule = [
            'date_id' => $this->calendarDate->id,
            'title' => '開始時刻重複スケジュール',
            'start_time' => '11:00',
            'end_time' => '13:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $newSchedule);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['time_conflict']);
    });

    it('新しいスケジュールの終了時刻が既存スケジュールの時間内にある場合、エラーになる', function () {
        // 既存: 10:00-12:00
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'resident_id' => $this->resident->id,
            'start_time' => '10:00',
            'end_time' => '12:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 新規: 08:00-11:00 (終了時刻が既存の時間内)
        $newSchedule = [
            'date_id' => $this->calendarDate->id,
            'title' => '終了時刻重複スケジュール',
            'start_time' => '08:00',
            'end_time' => '11:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $newSchedule);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['time_conflict']);
    });

    it('時間が隣接している場合は重複エラーにならない', function () {
        // 既存: 10:00-11:00
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'resident_id' => $this->resident->id,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 新規: 11:00-12:00 (隣接している)
        $newSchedule = [
            'date_id' => $this->calendarDate->id,
            'title' => '隣接スケジュール',
            'start_time' => '11:00',
            'end_time' => '12:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $newSchedule);

        $response->assertStatus(201);
    });

    it('完全に同じ時間帯の場合、エラーになる', function () {
        // 既存: 10:00-11:00
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'resident_id' => $this->resident->id,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 新規: 10:00-11:00 (完全に同じ)
        $newSchedule = [
            'date_id' => $this->calendarDate->id,
            'title' => '同じ時間帯スケジュール',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $newSchedule);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['time_conflict']);
    });
});