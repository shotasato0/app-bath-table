<?php

use App\Models\Schedule;
use App\Models\CalendarDate;
use App\Models\ScheduleType;
use App\Models\Resident;

describe('Schedule Model', function () {
    beforeEach(function () {
        $this->calendarDate = CalendarDate::factory()->create([
            'calendar_date' => '2025-07-24',
        ]);
        $this->scheduleType = ScheduleType::factory()->create();
        $this->resident = Resident::factory()->create();
    });

    describe('リレーション', function () {
        it('CalendarDateとのリレーションが正しく動作する', function () {
            $schedule = Schedule::factory()->create([
                'date_id' => $this->calendarDate->id,
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ]);

            expect($schedule->calendarDate)->toBeInstanceOf(CalendarDate::class);
            expect($schedule->calendarDate->id)->toBe($this->calendarDate->id);
        });

        it('ScheduleTypeとのリレーションが正しく動作する', function () {
            $schedule = Schedule::factory()->create([
                'date_id' => $this->calendarDate->id,
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ]);

            expect($schedule->scheduleType)->toBeInstanceOf(ScheduleType::class);
            expect($schedule->scheduleType->id)->toBe($this->scheduleType->id);
        });

        it('Residentとのリレーションが正しく動作する', function () {
            $schedule = Schedule::factory()->create([
                'date_id' => $this->calendarDate->id,
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ]);

            expect($schedule->resident)->toBeInstanceOf(Resident::class);
            expect($schedule->resident->id)->toBe($this->resident->id);
        });
    });

    describe('スコープ', function () {
        it('forDateスコープが指定日のスケジュールを取得する', function () {
            $targetDate = '2025-07-24';
            $otherDate = '2025-07-25';

            $targetCalendarDate = CalendarDate::factory()->create([
                'calendar_date' => $targetDate,
            ]);
            $otherCalendarDate = CalendarDate::factory()->create([
                'calendar_date' => $otherDate,
            ]);

            $targetSchedule = Schedule::factory()->create([
                'date_id' => $targetCalendarDate->id,
                'title' => '対象スケジュール',
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ]);

            Schedule::factory()->create([
                'date_id' => $otherCalendarDate->id,
                'title' => '別日スケジュール',
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ]);

            $result = Schedule::forDate($targetDate)->get();

            expect($result)->toHaveCount(1);
            expect($result->first()->title)->toBe('対象スケジュール');
        });

        it('forDateRangeスコープが期間内のスケジュールを取得する', function () {
            $startDate = '2025-07-20';
            $endDate = '2025-07-25';

            $inRangeDate1 = CalendarDate::factory()->create(['calendar_date' => '2025-07-22']);
            $inRangeDate2 = CalendarDate::factory()->create(['calendar_date' => '2025-07-24']);
            $outOfRangeDate = CalendarDate::factory()->create(['calendar_date' => '2025-07-30']);

            Schedule::factory()->create([
                'date_id' => $inRangeDate1->id,
                'title' => '期間内1',
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ]);

            Schedule::factory()->create([
                'date_id' => $inRangeDate2->id,
                'title' => '期間内2',
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ]);

            Schedule::factory()->create([
                'date_id' => $outOfRangeDate->id,
                'title' => '期間外',
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ]);

            $result = Schedule::forDateRange($startDate, $endDate)->get();

            expect($result)->toHaveCount(2);
            expect($result->pluck('title')->toArray())->toContain('期間内1', '期間内2');
        });

        it('withRelationsスコープがリレーションを読み込む', function () {
            $schedule = Schedule::factory()->create([
                'date_id' => $this->calendarDate->id,
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ]);

            $result = Schedule::withRelations()->find($schedule->id);

            expect($result->relationLoaded('calendarDate'))->toBeTrue();
            expect($result->relationLoaded('scheduleType'))->toBeTrue();
            expect($result->relationLoaded('resident'))->toBeTrue();
        });
    });

    describe('キャスト', function () {
        it('start_timeとend_timeが正しくキャストされる', function () {
            $schedule = Schedule::factory()->create([
                'date_id' => $this->calendarDate->id,
                'start_time' => '09:30',
                'end_time' => '10:45',
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ]);

            // データベースから再取得
            $schedule = Schedule::find($schedule->id);

            expect($schedule->start_time)->toBeInstanceOf(\Carbon\Carbon::class);
            expect($schedule->end_time)->toBeInstanceOf(\Carbon\Carbon::class);
            expect($schedule->start_time->format('H:i'))->toBe('09:30');
            expect($schedule->end_time->format('H:i'))->toBe('10:45');
        });
    });

    describe('fillable属性', function () {
        it('fillable属性が正しく設定されている', function () {
            $expectedFillable = [
                'date_id',
                'title',
                'description',
                'start_time',
                'end_time',
                'schedule_type_id',
                'resident_id',
            ];

            $schedule = new Schedule();
            expect($schedule->getFillable())->toBe($expectedFillable);
        });

        it('fillable属性を使用してマスアサインメントができる', function () {
            $data = [
                'date_id' => $this->calendarDate->id,
                'title' => 'テストスケジュール',
                'description' => 'テスト用の説明',
                'start_time' => '09:00',
                'end_time' => '10:00',
                'schedule_type_id' => $this->scheduleType->id,
                'resident_id' => $this->resident->id,
            ];

            $schedule = Schedule::create($data);

            expect($schedule->title)->toBe('テストスケジュール');
            expect($schedule->description)->toBe('テスト用の説明');
            expect($schedule->date_id)->toBe($this->calendarDate->id);
        });
    });
});