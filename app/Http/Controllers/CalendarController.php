<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CalendarController extends Controller
{
    /**
     * カレンダー画面の表示
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $currentDate = $request->get('date', now()->format('Y-m-d'));
        
        // 権限チェック（無効化 - 誰でもアクセス可能）
        // if (!$this->hasPermission($user, 'CALENDAR_VIEW')) {
        //     return Inertia::render('Error', [
        //         'status' => 403,
        //         'message' => 'カレンダーを閲覧する権限がありません'
        //     ]);
        // }
        
        // 予定を取得（当日および前後1週間）
        $startDate = Carbon::parse($currentDate)->subDays(7);
        $endDate = Carbon::parse($currentDate)->addDays(7);
        
        $schedules = Schedule::with(['resident', 'staff'])
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'title' => $schedule->title,
                    'description' => $schedule->description,
                    'date' => $schedule->date,
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'type' => $schedule->type,
                    'column_type' => $schedule->column_type,
                    'priority' => $schedule->priority,
                    'status' => $schedule->status,
                    'location' => $schedule->location,
                    'notes' => $schedule->notes,
                    'created_by' => $schedule->created_by,
                    'staff_id' => $schedule->staff_id,
                    'resident_id' => $schedule->resident_id,
                    'resident' => $schedule->resident ? [
                        'id' => $schedule->resident->id,
                        'name' => $schedule->resident->name,
                        'room_number' => $schedule->resident->room_number,
                        'care_level' => $schedule->resident->care_level,
                    ] : null,
                    'staff' => $schedule->staff ? [
                        'id' => $schedule->staff->id,
                        'name' => $schedule->staff->name,
                    ] : null,
                ];
            });
        
        // 利用者を取得
        $residents = $this->getResidents($user);
        
        return Inertia::render('Calendar/Index', [
            'schedules' => $schedules,
            'residents' => $residents,
            'currentDate' => $currentDate,
        ]);
    }
    
    /**
     * 新規予定の作成
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // 権限チェック
        if (!$this->hasPermission($user, 'SCHEDULE_CREATE')) {
            return response()->json([
                'message' => '予定を作成する権限がありません'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'resident_id' => 'required|exists:residents,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'type' => 'required|in:general,bathing,medical,activity,meal',
            'column_type' => 'required|in:general,bathing,medical,activity',
            'priority' => 'in:low,medium,high',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ], [
            'title.required' => 'タイトルは必須です',
            'resident_id.required' => '利用者を選択してください',
            'resident_id.exists' => '存在しない利用者が選択されています',
            'date.required' => '日付は必須です',
            'start_time.required' => '開始時間は必須です',
            'end_time.required' => '終了時間は必須です',
            'end_time.after' => '終了時間は開始時間より後にしてください',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $schedule = Schedule::create([
            'title' => $request->title,
            'description' => $request->description,
            'resident_id' => $request->resident_id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'type' => $request->type,
            'column_type' => $request->column_type,
            'priority' => $request->priority ?? 'medium',
            'status' => 'scheduled',
            'location' => $request->location,
            'notes' => $request->notes,
            'created_by' => $user->id,
            'staff_id' => $request->staff_id ?? $user->id,
        ]);
        
        return response()->json([
            'message' => '予定を作成しました',
            'schedule' => $schedule->load(['resident', 'staff'])
        ], 201);
    }
    
    /**
     * 予定の更新
     */
    public function update(Request $request, Schedule $schedule)
    {
        $user = Auth::user();
        
        // 権限チェック
        if (!$this->canEditSchedule($user, $schedule)) {
            return response()->json([
                'message' => 'この予定を編集する権限がありません'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'resident_id' => 'required|exists:residents,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'type' => 'required|in:general,bathing,medical,activity,meal',
            'column_type' => 'required|in:general,bathing,medical,activity',
            'priority' => 'in:low,medium,high',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $schedule->update([
            'title' => $request->title,
            'description' => $request->description,
            'resident_id' => $request->resident_id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'type' => $request->type,
            'column_type' => $request->column_type,
            'priority' => $request->priority ?? 'medium',
            'location' => $request->location,
            'notes' => $request->notes,
            'updated_by' => $user->id,
        ]);
        
        return response()->json([
            'message' => '予定を更新しました',
            'schedule' => $schedule->load(['resident', 'staff'])
        ]);
    }
    
    /**
     * 予定の削除
     */
    public function destroy(Schedule $schedule)
    {
        $user = Auth::user();
        
        // 権限チェック
        if (!$this->canDeleteSchedule($user, $schedule)) {
            return response()->json([
                'message' => 'この予定を削除する権限がありません'
            ], 403);
        }
        
        $schedule->delete();
        
        return response()->json([
            'message' => '予定を削除しました'
        ]);
    }
    
    /**
     * 利用者リストの取得
     */
    private function getResidents($user)
    {
        // 権限チェック（無効化 - 誰でもアクセス可能）
        // if (!$this->hasPermission($user, 'RESIDENT_VIEW')) {
        //     return [];
        // }
        
        return Resident::where('status', 'active')
            ->orderBy('room_number')
            ->get()
            ->map(function ($resident) {
                return [
                    'id' => $resident->id,
                    'name' => $resident->name,
                    'room_number' => $resident->room_number,
                    'age' => $resident->age,
                    'gender' => $resident->gender,
                    'care_level' => $resident->care_level,
                    'status' => $resident->status,
                    'medical_notes' => $resident->medical_notes,
                    'special_requirements' => $resident->special_requirements,
                    'primary_staff' => $resident->primaryStaff ? [
                        'id' => $resident->primaryStaff->id,
                        'name' => $resident->primaryStaff->name,
                    ] : null,
                ];
            });
    }
    
    /**
     * 権限チェック
     */
    private function hasPermission($user, $permission)
    {
        $roleHierarchy = [
            'admin' => 100,
            'manager' => 90,
            'care_manager' => 80,
            'nurse' => 70,
            'care_worker' => 60,
            'nutritionist' => 50,
            'staff' => 40
        ];
        
        $permissions = [
            'CALENDAR_VIEW' => 40,
            'SCHEDULE_CREATE' => 60,
            'SCHEDULE_EDIT_OWN' => 60,
            'SCHEDULE_EDIT_ALL' => 80,
            'SCHEDULE_DELETE' => 80,
            'RESIDENT_VIEW' => 40,
        ];
        
        $userLevel = $roleHierarchy[$user->role] ?? 0;
        $requiredLevel = $permissions[$permission] ?? 100;
        
        return $userLevel >= $requiredLevel;
    }
    
    /**
     * 予定編集権限チェック
     */
    private function canEditSchedule($user, $schedule)
    {
        // 全ての予定を編集できる権限
        if ($this->hasPermission($user, 'SCHEDULE_EDIT_ALL')) {
            return true;
        }
        
        // 自分の予定のみ編集できる権限
        if ($this->hasPermission($user, 'SCHEDULE_EDIT_OWN')) {
            return $schedule->created_by === $user->id;
        }
        
        return false;
    }
    
    /**
     * 予定削除権限チェック
     */
    private function canDeleteSchedule($user, $schedule)
    {
        if (!$this->hasPermission($user, 'SCHEDULE_DELETE')) {
            return false;
        }
        
        // 管理者レベルなら全て削除可能
        $roleHierarchy = [
            'admin' => 100,
            'manager' => 90,
            'care_manager' => 80,
            'nurse' => 70,
            'care_worker' => 60,
            'nutritionist' => 50,
            'staff' => 40
        ];
        
        $userLevel = $roleHierarchy[$user->role] ?? 0;
        
        if ($userLevel >= 90) { // manager以上
            return true;
        }
        
        // それ以外は自分が作成した予定のみ削除可能
        return $schedule->created_by === $user->id;
    }
}
