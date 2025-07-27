<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ScheduleTypeController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// TODO: 開発時のみ認証を無効化。本番環境では認証を有効にする必要がある
// Route::middleware(['auth:sanctum'])->group(function () {
    // スケジュール関連のルート
    Route::get('schedules/monthly', [ScheduleController::class, 'getMonthlySchedules']);
    Route::apiResource('schedules', ScheduleController::class);
    
    // スケジュールタイプ関連のルート
    Route::apiResource('schedule-types', ScheduleTypeController::class);
// });