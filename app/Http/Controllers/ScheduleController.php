<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\CalendarDate;
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

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date_id' => 'required|exists:calendar_dates,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'schedule_type_id' => 'required|exists:schedule_types,id',
            'resident_id' => 'nullable|exists:residents,id',
        ]);

        $schedule = Schedule::create($validated);
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
            'date_id' => 'sometimes|exists:calendar_dates,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'schedule_type_id' => 'sometimes|exists:schedule_types,id',
            'resident_id' => 'nullable|exists:residents,id',
        ]);

        $schedule->update($validated);
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
