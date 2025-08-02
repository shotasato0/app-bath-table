import React, { useState, useRef, memo } from 'react';
import { format } from 'date-fns';
import ScheduleModal from './ScheduleModal';

const SAMPLE_EVENTS = {};

const CalendarDay = memo(function CalendarDay({ 
    date, 
    isCurrentMonth, 
    isToday, 
    isSelected, 
    onClick, 
    dayIndex,
    schedules = [],
    scheduleTypes = [],
    createSchedule,
    updateSchedule,
    deleteSchedule,
    loading = false,
    showNotification,
    showConfirmDialog
}) {
    const [dragOver, setDragOver] = useState(false);
    const dragCounter = useRef(0);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    /**
     * ユーティリティ関数: APIスケジュールかサンプルデータかを判定
     * @param {Object} schedule - 判定対象のスケジュールオブジェクト
     * @returns {boolean} APIスケジュールの場合true、サンプルデータの場合false
     */
    const isApiSchedule = (schedule) => {
        return schedule && schedule.schedule_type_id !== undefined;
    };
    
    
    // スケジュールを左右に分離するロジック
    const separateSchedules = (allSchedules) => {
        const generalSchedules = [];
        const bathingSchedules = [];
        
        allSchedules.forEach(schedule => {
            // 入浴タイプ（ID: 1）または住民IDがある場合は入浴側へ
            if (schedule.schedule_type_id === 1 || schedule.resident_id) {
                bathingSchedules.push(schedule);
            } else {
                generalSchedules.push(schedule);
            }
        });
        
        return { generalSchedules, bathingSchedules };
    };

    // APIデータを優先的に使用し、左右に分離
    const allSchedules = schedules.length > 0 ? schedules : [];
    const { generalSchedules, bathingSchedules } = separateSchedules(allSchedules);
    
    // サンプルデータと結合（後でAPI化するまでの暫定処理）
    // APIデータがない場合のみサンプルデータを使用
    const sampleData = schedules.length === 0 ? SAMPLE_EVENTS[dateKey] : null;
    const sampleSchedules = sampleData?.schedules || [];
    const sampleBathing = sampleData?.bathing || [];
    
    const dayEvents = {
        schedules: [...generalSchedules, ...sampleSchedules],
        bathing: [...bathingSchedules, ...sampleBathing]
    };
    


    // 次の利用可能な入浴時間を計算
    const getNextAvailableTime = () => {
        // APIスケジュールのみを対象とする（schedule_type_idが存在するもの）
        const bathingSchedules = dayEvents.bathing.filter(item => 
            isApiSchedule(item) && item.start_time && item.end_time
        );
        
        if (bathingSchedules.length === 0) {
            return { start_time: '10:00', end_time: '10:30' };
        }
        
        // 最後の入浴スケジュールの終了時間を取得
        const schedulesWithMinutes = bathingSchedules.map(schedule => ({
            ...schedule,
            end_time_minutes: timeToMinutes(schedule.end_time)
        }));
        
        const lastSchedule = schedulesWithMinutes
            .sort((a, b) => a.end_time_minutes - b.end_time_minutes)
            .pop();
        
        const nextStartMinutes = lastSchedule.end_time_minutes;
        const nextEndMinutes = nextStartMinutes + 30; // 30分後
        
        return {
            start_time: minutesToTime(nextStartMinutes),
            end_time: minutesToTime(nextEndMinutes)
        };
    };
    
    // 時間文字列を分に変換
    const timeToMinutes = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') {
            return 0;
        }
        const parts = timeStr.split(':');
        if (parts.length !== 2) {
            return 0;
        }
        const [hours, minutes] = parts.map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
            return 0;
        }
        return hours * 60 + minutes;
    };
    
    // 分を時間文字列に変換
    const minutesToTime = (minutes) => {
        if (typeof minutes !== 'number' || isNaN(minutes)) {
            return '10:00';
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        
        try {
            const jsonData = e.dataTransfer.getData('application/json');
            
            if (!jsonData) {
                showErrorMessage('ドラッグデータが見つかりませんでした');
                return;
            }
            
            const dragData = JSON.parse(jsonData);
            
            // ドラッグデータのタイプで処理を分岐
            if (dragData.type === 'schedule_move') {
                await handleScheduleMove(dragData);
            } else {
                await handleResidentDrop(dragData);
            }
        } catch (error) {
            showErrorMessage('ドロップしたデータの読み込みに失敗しました: ' + error.message);
        }
    };

    // 住民からの新規スケジュール作成
    const handleResidentDrop = async (residentData) => {
        // 入浴スケジュールデータを作成
        const bathingScheduleData = {
            title: residentData.name,
            schedule_type_id: 1, // 入浴タイプ
            resident_id: residentData.id
        };
        
        // 重複チェック
        const duplicateError = checkBathingScheduleDuplicate(bathingScheduleData);
        if (duplicateError) {
            showWarningMessage(duplicateError);
            return;
        }
        
        // 次の利用可能な時間を計算
        const { start_time, end_time } = getNextAvailableTime();
        
        // 住民の入浴スケジュールを自動作成
        const bathingSchedule = {
            title: `${residentData.name}`,
            description: `${residentData.room} ${residentData.name}さんの入浴時間`,
            date: dateKey,
            start_time,
            end_time,
            schedule_type_id: 1, // 入浴タイプ
            resident_id: residentData.id,
            all_day: false
        };
        
        try {
            // 楽観的更新: 即座に成功通知を表示
            showSuccessMessage(`${residentData.name}さんの入浴スケジュールを作成しました`);
            
            // バックグラウンドでAPI更新（エラー時のみ通知）
            await createSchedule(bathingSchedule);
        } catch (error) {
            showErrorMessage(`入浴スケジュールの作成に失敗しました: ${error.message || 'エラーが発生しました'}`);
        }
    };

    // スケジュール移動処理（楽観的更新対応）
    const handleScheduleMove = async (dragData) => {
        const { schedule, sourceDate } = dragData;
        
        // 同じ日への移動は無視
        if (sourceDate === dateKey) {
            return;
        }
        
        // 重複チェック
        const duplicateError = checkBathingScheduleDuplicate(schedule, schedule.id);
        if (duplicateError) {
            showWarningMessage(duplicateError);
            return;
        }
        
        // 移動先の時間を計算
        const { start_time, end_time } = getNextAvailableTime();
        
        // スケジュールを更新
        const updatedSchedule = {
            ...schedule,
            date: dateKey,
            start_time,
            end_time
        };
        
        try {
            // 楽観的更新: 即座に成功通知を表示
            showSuccessMessage(`${schedule.title}のスケジュールを${dateKey}に移動しました`);
            
            // バックグラウンドでAPI更新（エラー時のみ通知）
            await updateSchedule(schedule.id, updatedSchedule);
        } catch (error) {
            showErrorMessage(`スケジュールの移動に失敗しました: ${error.message || 'エラーが発生しました'}`);
        }
    };

    // 通知ユーティリティ関数
    const showSuccessMessage = (message) => {
        showNotification(message, 'success');
    };
    
    const showErrorMessage = (message) => {
        showNotification(message, 'error');
    };
    
    const showWarningMessage = (message) => {
        showNotification(message, 'warning');
    };

    // スケジュールのドラッグ開始処理
    const handleScheduleDragStart = (e, schedule) => {
        e.stopPropagation();
        
        // スケジュール移動データを設定
        const dragData = {
            type: 'schedule_move',
            schedule: schedule,
            sourceDate: dateKey
        };
        
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
        
    };

    // スケジュール作成モーダルを開く
    const handleCreateSchedule = (e) => {
        e.stopPropagation();
        setSelectedSchedule({
            isNewSchedule: true, // 新規作成フラグ
            isBathingSchedule: false // 一般スケジュール
        });
        setShowScheduleModal(true);
    };

    // 入浴スケジュール作成モーダルを開く
    const handleCreateBathingSchedule = (e) => {
        e.stopPropagation();
        setSelectedSchedule({
            isBathingSchedule: true, // 入浴スケジュール用フラグ
            schedule_type_id: 1, // 入浴タイプに初期設定
            isNewSchedule: true // 新規作成フラグ
        });
        setShowScheduleModal(true);
    };

    // スケジュール編集モーダルを開く
    const handleEditSchedule = (schedule, e) => {
        e.stopPropagation();
        setSelectedSchedule(schedule);
        setShowScheduleModal(true);
    };

    // スケジュール削除
    const handleDeleteSchedule = async (schedule, e) => {
        e.stopPropagation();
        
        // APIスケジュールかどうかをチェック
        if (!isApiSchedule(schedule)) {
            showWarningMessage('サンプル住民データは削除できません');
            return;
        }
        
        showConfirmDialog(
            'このスケジュールを削除しますか？',
            async () => {
                try {
                    await deleteSchedule(schedule.id);
                } catch (error) {
                    showErrorMessage('スケジュールの削除に失敗しました');
                }
            }
        );
    };

    // 入浴スケジュールの重複チェック関数
    const checkBathingScheduleDuplicate = (formData, excludeId = null) => {
        // 入浴スケジュール（schedule_type_id === 1）の場合のみチェック
        if (formData.schedule_type_id !== 1) {
            return null; // 入浴スケジュール以外は重複チェックしない
        }

        // resident_idがある場合は住民IDで重複チェック
        if (formData.resident_id) {
            const existingSchedule = dayEvents.bathing.find(item => 
                isApiSchedule(item) && // APIスケジュールのみ
                item.resident_id === formData.resident_id && // 同じ住民ID
                item.id !== excludeId // 除外対象のスケジュールは除く
            );
            
            if (existingSchedule) {
                // タイトル（利用者名）がある場合は利用者名を表示、なければIDを表示
                const displayName = formData.title || `住民ID:${formData.resident_id}`;
                return `${displayName}さんの入浴スケジュールは既にこの日に登録されています。`;
            }
        }

        // resident_idがない場合はタイトルで重複チェック（フォールバック）
        if (formData.title) {
            const existingSchedule = dayEvents.bathing.find(item => 
                isApiSchedule(item) && // APIスケジュールのみ
                item.title === formData.title && // 同じタイトル
                item.id !== excludeId // 除外対象のスケジュールは除く
            );
            
            if (existingSchedule) {
                return `${formData.title}さんの入浴スケジュールは既にこの日に登録されています。`;
            }
        }

        return null; // 重複なし
    };

    // スケジュール保存
    const handleSaveSchedule = async (formData) => {
        if (selectedSchedule && !selectedSchedule.isNewSchedule) {
            // 更新の場合の重複チェック
            const duplicateError = checkBathingScheduleDuplicate(formData, selectedSchedule.id);
            if (duplicateError) {
                showWarningMessage(duplicateError);
                return;
            }
            // 更新
            await updateSchedule(selectedSchedule.id, formData);
        } else {
            // 新規作成の場合の重複チェック
            const duplicateError = checkBathingScheduleDuplicate(formData);
            if (duplicateError) {
                showWarningMessage(duplicateError);
                return;
            }
            // 作成
            await createSchedule(formData);
        }
    };

    return (
        <div 
            className={`
                calendar-day flex flex-col p-1.5 min-h-[140px] border-r border-b border-gray-600 relative cursor-pointer layout-stable
                ${dayIndex % 7 === 6 ? 'border-r-0' : ''}
                ${!isCurrentMonth ? 'bg-gray-700' : 'bg-gray-800'}
                ${isToday ? 'bg-blue-900 bg-opacity-20 border-2 border-blue-600' : ''}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
            `}
            style={{ width: '14.2857%' }}
            onClick={onClick}
        >
            {/* 日付ヘッダー */}
            <div className="flex justify-between items-center mb-1.5 min-h-[18px]">
                <div className={`text-sm font-medium ${
                    !isCurrentMonth ? 'text-gray-500' : 
                    isToday ? 'text-blue-400' : 
                    'text-gray-100'
                }`}>
                    {format(date, 'd')}
                </div>
            </div>

            {/* 日の内容 */}
            <div className="flex flex-1 gap-1">
                {/* 予定側 */}
                <div className="flex-1 flex flex-col gap-0.5">
                    <div className="text-purple-300 text-[8px] text-center pb-0.5 border-b border-gray-600 font-medium flex justify-between items-center">
                        <span>予定</span>
                        <button
                            onClick={handleCreateSchedule}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                            title="スケジュール追加"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    {dayEvents.schedules.map((event) => {
                        const scheduleType = scheduleTypes.find(type => type.id === event.schedule_type_id);
                        const backgroundColor = scheduleType?.color_code || '#9B59B6';
                        const displayText = event.title || event.text || 'スケジュール';
                        
                        return (
                            <div
                                key={event.id}
                                className="text-[9px] px-1 py-0.5 rounded-sm border-l-2 text-white group relative schedule-item animate-fade-in"
                                style={{
                                    backgroundColor: backgroundColor + '40', // 透明度40%
                                    borderLeftColor: backgroundColor
                                }}
                            >
                                <div className="line-clamp-2 pr-1">{displayText}</div>
                                
                                {/* ホバー時の操作ボタン（APIスケジュールのみ表示） */}
                                {isApiSchedule(event) && (
                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 rounded-sm shadow-lg flex">
                                        <button
                                            onClick={(e) => handleEditSchedule(event, e)}
                                            className="p-0.5 text-blue-400 hover:text-blue-300"
                                            title="編集"
                                        >
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteSchedule(event, e)}
                                            className="p-0.5 text-red-400 hover:text-red-300"
                                            title="削除"
                                        >
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 入浴側 */}
                <div 
                    className={`flex-1 flex flex-col gap-0.5 border-l border-gray-600 pl-1 drag-over-zone ${
                        dragOver ? 'bg-blue-900 bg-opacity-20 dragover' : ''
                    }`}
                >
                    <div className="text-blue-300 text-[8px] text-center pb-0.5 border-b border-gray-600 font-medium flex justify-between items-center">
                        <span>🛁 入浴</span>
                        <button
                            onClick={handleCreateBathingSchedule}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="入浴スケジュール追加"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    {dayEvents.bathing.map((item) => {
                        // APIスケジュールの場合とサンプルデータの場合を判別
                        const isScheduleFromApi = isApiSchedule(item);
                        const displayName = isScheduleFromApi 
                            ? (item.title || `入浴スケジュール`)
                            : item.name;
                        const scheduleType = isScheduleFromApi && scheduleTypes.find(type => type.id === item.schedule_type_id);
                        const backgroundColor = scheduleType?.color_code || '#3B82F6';
                        
                        return (
                            <div
                                key={`${isScheduleFromApi ? 'schedule' : 'resident'}-${item.id}`}
                                draggable={isScheduleFromApi}
                                onDragStart={isScheduleFromApi ? (e) => handleScheduleDragStart(e, item) : undefined}
                                className={`text-[9px] px-1 py-0.5 rounded-sm text-white border-l-2 group relative schedule-item animate-fade-in ${
                                    isScheduleFromApi ? 'cursor-move' : 'cursor-pointer'
                                }`}
                                style={{
                                    backgroundColor: backgroundColor + '40',
                                    borderLeftColor: backgroundColor
                                }}
                            >
                                <div className="line-clamp-2 pr-1">{displayName}</div>
                                
                                {/* APIスケジュールの場合のみ操作ボタンを表示 */}
                                {isScheduleFromApi && (
                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 rounded-sm shadow-lg flex">
                                        <button
                                            onClick={(e) => handleEditSchedule(item, e)}
                                            className="p-0.5 text-blue-400 hover:text-blue-300"
                                            title="編集"
                                        >
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteSchedule(item, e)}
                                            className="p-0.5 text-red-400 hover:text-red-300"
                                            title="削除"
                                        >
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {/* ドロップゾーン */}
                    <div
                        style={{ minHeight: '20px' }}
                        className={`border border-dashed rounded-sm flex items-center justify-center text-[8px] transition-all ${
                            dragOver 
                                ? 'border-blue-400 bg-blue-900 bg-opacity-20 text-blue-400 border-solid' 
                                : 'border-gray-500 text-gray-500 hover:border-blue-400 hover:bg-blue-900 hover:bg-opacity-10'
                        }`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // dragOverはdragEnterで管理するため、ここでは設定しない
                        }}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // ドラッグカウンター方式でより正確な状態管理
                            dragCounter.current++;
                            if (dragCounter.current === 1) {
                                setDragOver(true);
                            }
                        }}
                        onDragLeave={(e) => {
                            e.stopPropagation();
                            // ドラッグカウンター方式で効率的な判定
                            dragCounter.current--;
                            if (dragCounter.current === 0) {
                                setDragOver(false);
                            }
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOver(false);
                            dragCounter.current = 0; // カウンターをリセット
                            handleDrop(e);
                        }}
                    >
                        {dragOver 
                            ? '住民を入浴予定に追加' 
                            : (dayEvents.bathing.length === 0 ? '住民をドロップ' : '+')
                        }
                    </div>
                </div>
            </div>
            
            {/* スケジュール作成・編集モーダル */}
            <ScheduleModal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                onSave={handleSaveSchedule}
                schedule={selectedSchedule}
                date={date}
                scheduleTypes={scheduleTypes}
                loading={loading}
            />
        </div>
    );
});

export default CalendarDay;