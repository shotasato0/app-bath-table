<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\CalendarDate;
use App\Http\Requests\StoreScheduleRequest;
use App\Http\Requests\UpdateScheduleRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Schedule::withRelations();

        if ($request->has('date')) {
            $query->forDate($request->date);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->forDateRange($request->start_date, $request->end_date);
        }

        $schedules = $query->orderBy('start_time')->get();

        return response()->json([
            'status' => 'success',
            'data' => $schedules
        ]);
    }

    public function getMonthlySchedules(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $calendarDates = CalendarDate::forMonth($year, $month)
            ->withSchedules()
            ->orderBy('calendar_date')
            ->get();

        // フロントエンドが期待する形式に変換
        $monthlyData = $calendarDates->map(function ($calendarDate) {
            // 日付を文字列として直接使用（タイムゾーンの影響を回避）
            $formattedDate = $calendarDate->calendar_date instanceof \DateTime 
                ? $calendarDate->calendar_date->format('Y-m-d')
                : (string) $calendarDate->calendar_date;
            
            return [
                'date' => $formattedDate,
                'schedules' => $calendarDate->schedules->map(function ($schedule) use ($formattedDate) {
                    return [
                        'id' => $schedule->id,
                        'title' => $schedule->title,
                        'description' => $schedule->description,
                        'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time,
                        'all_day' => $schedule->all_day,
                        'schedule_type_id' => $schedule->schedule_type_id,
                        'resident_id' => $schedule->resident_id,
                        'date' => $formattedDate,
                        'schedule_type' => $schedule->scheduleType
                    ];
                })
            ];
        })->filter(function ($item) {
            // スケジュールがある日付のみ返す
            return $item['schedules']->isNotEmpty();
        });

        return response()->json([
            'status' => 'success',
            'data' => $monthlyData->values()
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'date' => ['required', 'date'],
            'start_time' => ['required_if:all_day,false', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'schedule_type_id' => ['required', 'exists:schedule_types,id'],
            'resident_id' => ['nullable', 'exists:residents,id'],
            'all_day' => ['boolean']
        ]);

        // CalendarDateを作成または取得
        $timezone = config('app.timezone');
        if (is_null($timezone)) {
            throw new \RuntimeException('アプリケーションのタイムゾーンが設定で構成されていません。');
        }
        $dateInstance = Carbon::createFromFormat('Y-m-d', $validated['date'], $timezone);
        $calendarDate = CalendarDate::firstOrCreate([
            'calendar_date' => $validated['date']
        ], [
            'day_of_week' => $dateInstance->dayOfWeek,
            'is_holiday' => false
        ]);

        // スケジュールデータを準備
        $scheduleData = [
            'date_id' => $calendarDate->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'start_time' => $validated['all_day'] ? null : $validated['start_time'],
            'end_time' => $validated['all_day'] ? null : ($validated['end_time'] ?? null),
            'all_day' => $validated['all_day'] ?? false,
            'schedule_type_id' => $validated['schedule_type_id'],
            'resident_id' => $validated['resident_id'] ?? null
        ];

        $schedule = Schedule::create($scheduleData);
        $schedule->load(['calendarDate', 'scheduleType', 'resident']);

        return response()->json([
            'status' => 'success',
            'message' => 'スケジュールが作成されました',
            'data' => $schedule
        ], 201);
    }

    public function show(Schedule $schedule): JsonResponse
    {
        $schedule->load(['calendarDate', 'scheduleType', 'resident']);

        return response()->json([
            'status' => 'success',
            'data' => $schedule
        ]);
    }

    public function update(Request $request, Schedule $schedule): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'date' => ['required', 'date'],
            'start_time' => ['required_if:all_day,false', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'schedule_type_id' => ['required', 'exists:schedule_types,id'],
            'resident_id' => ['nullable', 'exists:residents,id'],
            'all_day' => ['boolean']
        ]);

        // CalendarDateを作成または取得
        $timezone = config('app.timezone');
        if (is_null($timezone)) {
            throw new \RuntimeException('アプリケーションのタイムゾーンが設定で構成されていません。');
        }
        $dateInstance = Carbon::createFromFormat('Y-m-d', $validated['date'], $timezone);
        $calendarDate = CalendarDate::firstOrCreate([
            'calendar_date' => $validated['date']
        ], [
            'day_of_week' => $dateInstance->dayOfWeek,
            'is_holiday' => false
        ]);

        // スケジュールデータを準備
        $scheduleData = [
            'date_id' => $calendarDate->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'start_time' => $validated['all_day'] ? null : $validated['start_time'],
            'end_time' => $validated['all_day'] ? null : ($validated['end_time'] ?? null),
            'all_day' => $validated['all_day'] ?? false,
            'schedule_type_id' => $validated['schedule_type_id'],
            'resident_id' => $validated['resident_id'] ?? null
        ];

        $schedule->update($scheduleData);
        $schedule->load(['calendarDate', 'scheduleType', 'resident']);

        return response()->json([
            'status' => 'success',
            'message' => 'スケジュールが更新されました',
            'data' => $schedule
        ]);
    }

    public function destroy(Schedule $schedule): JsonResponse
    {
        $schedule->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'スケジュールが削除されました'
        ]);
    }

    public function create()
    {
        return redirect('/calendar');
    }

    public function edit(Schedule $schedule)
    {
        return redirect('/calendar');
    }
}
