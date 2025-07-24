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
    
    $this->schedule = Schedule::factory()->create([
        'date_id' => $this->calendarDate->id,
        'title' => '元のタイトル',
        'description' => '元の説明',
        'start_time' => '09:00',
        'end_time' => '10:00',
        'schedule_type_id' => $this->scheduleType->id,
        'resident_id' => $this->resident->id,
    ]);
});

describe('UpdateScheduleRequest バリデーション', function () {
    it('有効な部分更新データでスケジュールを更新できる', function () {
        $updateData = [
            'title' => '更新されたタイトル',
            'description' => '更新された説明',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$this->schedule->id}", $updateData);

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('schedules', [
            'id' => $this->schedule->id,
            'title' => '更新されたタイトル',
            'description' => '更新された説明',
        ]);
    });

    it('全フィールドを更新できる', function () {
        $newCalendarDate = CalendarDate::factory()->create([
            'calendar_date' => '2025-07-25',
        ]);
        $newScheduleType = ScheduleType::factory()->create();
        $newResident = Resident::factory()->create();

        $updateData = [
            'date_id' => $newCalendarDate->id,
            'title' => '完全に更新されたタイトル',
            'description' => '完全に更新された説明',
            'start_time' => '14:00',
            'end_time' => '15:00',
            'schedule_type_id' => $newScheduleType->id,
            'resident_id' => $newResident->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$this->schedule->id}", $updateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('schedules', [
            'id' => $this->schedule->id,
            'date_id' => $newCalendarDate->id,
            'title' => '完全に更新されたタイトル',
            'description' => '完全に更新された説明',
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'schedule_type_id' => $newScheduleType->id,
            'resident_id' => $newResident->id,
        ]);
    });

    it('存在しないdate_idの場合、バリデーションエラーになる', function () {
        $invalidData = [
            'date_id' => 999999,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$this->schedule->id}", $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date_id'])
            ->assertJsonFragment(['date_id' => ['有効な日付を選択してください。']]);
    });

    it('titleが255文字を超える場合、バリデーションエラーになる', function () {
        $invalidData = [
            'title' => str_repeat('あ', 256),
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$this->schedule->id}", $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title'])
            ->assertJsonFragment(['title' => ['タイトルは255文字以内で入力してください。']]);
    });

    it('無効な時間形式の場合、バリデーションエラーになる', function () {
        $invalidData = [
            'start_time' => '25:00',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$this->schedule->id}", $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_time'])
            ->assertJsonFragment(['start_time' => ['開始時刻は時:00の形式で入力してください。']]);
    });

    it('終了時刻が開始時刻より前の場合、バリデーションエラーになる', function () {
        $invalidData = [
            'start_time' => '10:00',
            'end_time' => '09:00',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$this->schedule->id}", $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['end_time'])
            ->assertJsonFragment(['end_time' => ['終了時刻は開始時刻より後に設定してください。']]);
    });

    it('他のスケジュールと時間が重複する場合、バリデーションエラーになる', function () {
        // 別のスケジュールを作成
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'resident_id' => $this->resident->id,
            'start_time' => '11:00',
            'end_time' => '12:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 既存スケジュールを重複する時間に更新しようとする
        $conflictData = [
            'start_time' => '11:30',
            'end_time' => '12:30',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$this->schedule->id}", $conflictData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['time_conflict'])
            ->assertJsonFragment(['time_conflict' => ['指定された時間帯に既にスケジュールが存在します。']]);
    });

    it('自分自身との重複はエラーにならない', function () {
        $updateData = [
            'title' => '更新されたタイトル',
            // 時間は変更しない（自分自身と同じ時間帯）
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$this->schedule->id}", $updateData);

        $response->assertStatus(200);
    });

    it('異なる入居者なら同じ時間帯でも更新できる', function () {
        $anotherResident = Resident::factory()->create();

        // 別の入居者のスケジュールを作成
        Schedule::factory()->create([
            'date_id' => $this->calendarDate->id,
            'resident_id' => $anotherResident->id,
            'start_time' => '14:00',
            'end_time' => '15:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 元のスケジュールを同じ時間帯に更新（異なる入居者なのでOK）
        $updateData = [
            'start_time' => '14:00',
            'end_time' => '15:00',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$this->schedule->id}", $updateData);

        $response->assertStatus(200);
    });

    it('異なる日付なら同じ入居者で同じ時間帯でも更新できる', function () {
        $anotherDate = CalendarDate::factory()->create([
            'calendar_date' => '2025-07-25',
        ]);

        // 同じ入居者の別日のスケジュールを作成
        Schedule::factory()->create([
            'date_id' => $anotherDate->id,
            'resident_id' => $this->resident->id,
            'start_time' => '14:00',
            'end_time' => '15:00',
            'schedule_type_id' => $this->scheduleType->id,
        ]);

        // 元のスケジュールを同じ時間帯に更新（異なる日付なのでOK）
        $updateData = [
            'start_time' => '14:00',
            'end_time' => '15:00',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/schedules/{$this->schedule->id}", $updateData);

        $response->assertStatus(200);
    });
});