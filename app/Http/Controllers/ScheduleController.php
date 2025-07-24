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

        return response()->json([
            'status' => 'success',
            'data' => $calendarDates
        ]);
    }

    public function store(StoreScheduleRequest $request): JsonResponse
    {
        $schedule = Schedule::create($request->validated());
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

    public function update(UpdateScheduleRequest $request, Schedule $schedule): JsonResponse
    {
        $schedule->update($request->validated());
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
