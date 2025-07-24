<?php

namespace App\Http\Controllers;

use App\Models\ScheduleType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ScheduleTypeController extends Controller
{
    public function index(): JsonResponse
    {
        $scheduleTypes = ScheduleType::all();

        return response()->json([
            'status' => 'success',
            'data' => $scheduleTypes
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type_name' => 'required|string|max:255|unique:schedule_types',
            'color_code' => 'required|string|size:7|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $scheduleType = ScheduleType::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'スケジュールタイプが作成されました',
            'data' => $scheduleType
        ], 201);
    }

    public function show(ScheduleType $scheduleType): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $scheduleType
        ]);
    }

    public function update(Request $request, ScheduleType $scheduleType): JsonResponse
    {
        $validated = $request->validate([
            'type_name' => 'sometimes|string|max:255|unique:schedule_types,type_name,' . $scheduleType->id,
            'color_code' => 'sometimes|string|size:7|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $scheduleType->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'スケジュールタイプが更新されました',
            'data' => $scheduleType
        ]);
    }

    public function destroy(ScheduleType $scheduleType): JsonResponse
    {
        if ($scheduleType->schedules()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'このスケジュールタイプは使用中のため削除できません'
            ], 422);
        }

        $scheduleType->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'スケジュールタイプが削除されました'
        ]);
    }

    public function create()
    {
        return redirect('/calendar');
    }

    public function edit(ScheduleType $scheduleType)
    {
        return redirect('/calendar');
    }
}
