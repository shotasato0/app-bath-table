<?php

namespace App\Http\Controllers;

use App\Models\Resident;
use App\Http\Requests\StoreResidentRequest;
use App\Http\Requests\UpdateResidentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ResidentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Resident::withRelations();
        
        // 検索機能
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }
        
        // アクティブな利用者のみ
        $query->active();
        
        $residents = $query->orderBy('name')->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $residents
        ]);
    }

    public function store(StoreResidentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        $resident = Resident::create($validated);
        $resident->load('schedules');
        
        return response()->json([
            'status' => 'success',
            'message' => '利用者が作成されました',
            'data' => $resident
        ], 201);
    }

    public function show(Resident $resident): JsonResponse
    {
        $resident->load('schedules.scheduleType', 'schedules.calendarDate');
        
        return response()->json([
            'status' => 'success',
            'data' => $resident
        ]);
    }

    public function update(UpdateResidentRequest $request, Resident $resident): JsonResponse
    {
        $validated = $request->validated();
        
        $resident->update($validated);
        $resident->load('schedules');
        
        return response()->json([
            'status' => 'success',
            'message' => '利用者情報が更新されました',
            'data' => $resident
        ]);
    }

    public function destroy(Resident $resident): JsonResponse
    {
        // スケジュール数を取得してN+1クエリ問題を回避
        $resident->loadCount('schedules');
        
        // スケジュールが関連付けられている場合は削除を防ぐ
        if ($resident->schedules_count > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'この利用者にはスケジュールが関連付けられているため削除できません'
            ], 400);
        }
        
        $resident->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => '利用者が削除されました'
        ]);
    }

    public function create()
    {
        return redirect('/calendar');
    }

    public function edit(Resident $resident)
    {
        return redirect('/calendar');
    }
}
