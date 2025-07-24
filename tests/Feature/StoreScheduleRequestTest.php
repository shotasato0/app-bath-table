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

describe('StoreScheduleRequest バリデーション', function () {
    it('全ての必須項目が提供された場合、バリデーションが通る', function () {
        $validData = [
            'date_id' => $this->calendarDate->id,
            'title' => 'テストスケジュール',
            'description' => 'テスト用の説明',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $validData);

        $response->assertStatus(201);
    });

    it('date_idが未入力の場合、バリデーションエラーになる', function () {
        $invalidData = [
            'title' => 'テストスケジュール',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date_id'])
            ->assertJsonFragment(['date_id' => ['日付を選択してください。']]);
    });

    it('存在しないdate_idの場合、バリデーションエラーになる', function () {
        $invalidData = [
            'date_id' => 999999,
            'title' => 'テストスケジュール',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date_id'])
            ->assertJsonFragment(['date_id' => ['有効な日付を選択してください。']]);
    });

    it('titleが未入力の場合、バリデーションエラーになる', function () {
        $invalidData = [
            'date_id' => $this->calendarDate->id,
            'title' => '',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title'])
            ->assertJsonFragment(['title' => ['タイトルを入力してください。']]);
    });

    it('titleが255文字を超える場合、バリデーションエラーになる', function () {
        $invalidData = [
            'date_id' => $this->calendarDate->id,
            'title' => str_repeat('あ', 256),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title'])
            ->assertJsonFragment(['title' => ['タイトルは255文字以内で入力してください。']]);
    });

    it('無効な時間形式の場合、バリデーションエラーになる', function () {
        $invalidData = [
            'date_id' => $this->calendarDate->id,
            'title' => 'テストスケジュール',
            'start_time' => '25:00',
            'end_time' => '10:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_time'])
            ->assertJsonFragment(['start_time' => ['開始時刻は時:00の形式で入力してください。']]);
    });

    it('終了時刻が開始時刻より前の場合、バリデーションエラーになる', function () {
        $invalidData = [
            'date_id' => $this->calendarDate->id,
            'title' => 'テストスケジュール',
            'start_time' => '10:00',
            'end_time' => '09:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['end_time'])
            ->assertJsonFragment(['end_time' => ['終了時刻は開始時刻より後に設定してください。']]);
    });

    it('時間が重複する場合、バリデーションエラーになる', function () {
        // 既存のスケジュールを作成
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'resident_id' => $this->resident->id,
            'start_time' => '09:00',
            'end_time' => '10:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 重複する時間帯のスケジュールを作成しようとする
        $conflictData = [
            'date_id' => $this->calendarDate->id,
            'title' => '重複スケジュール',
            'start_time' => '09:30',
            'end_time' => '10:30',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $this->resident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $conflictData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['time_conflict'])
            ->assertJsonFragment(['time_conflict' => ['指定された時間帯に既にスケジュールが存在します。']]);
    });

    it('異なる入居者なら同じ時間帯でもスケジュール作成できる', function () {
        $anotherResident = Resident::factory()->create();

        // 既存のスケジュールを作成
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'resident_id' => $this->resident->id,
            'start_time' => '09:00',
            'end_time' => '10:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 異なる入居者で同じ時間帯のスケジュール
        $validData = [
            'date_id' => $this->calendarDate->id,
            'title' => '別入居者のスケジュール',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'schedule_type_id' => $this->scheduleType->id,
            'resident_id' => $anotherResident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/schedules', $validData);

        $response->assertStatus(201);
    });
});