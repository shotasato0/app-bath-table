import React, { useState } from 'react';
import { format } from 'date-fns';
import ScheduleModal from './ScheduleModal';

const SAMPLE_EVENTS = {
    '2025-08-01': {
        schedules: [
            { id: 1, type: 'general', text: '夜勤' },
            { id: 2, type: 'meal', text: '午前11時 運動局' },
            { id: 3, type: 'activity', text: '午後2時 みかんチトレー' },
        ],
        bathing: [
            { id: 1, name: '田中太郎' },
            { id: 2, name: '佐藤花子' },
        ]
    },
    '2025-08-02': {
        schedules: [
            { id: 4, type: 'general', text: '休み' },
            { id: 5, type: 'activity', text: '午前5時 英文朝開定意定ホ' },
        ],
        bathing: [
            { id: 3, name: '山田次郎' },
        ]
    },
    '2025-08-04': {
        schedules: [
            { id: 6, type: 'general', text: 'みかやみ' },
        ],
        bathing: [
            { id: 4, name: '鈴木一郎' },
        ]
    },
    '2025-08-08': {
        schedules: [
            { id: 7, type: 'general', text: '先見くる' },
        ],
        bathing: []
    },
    '2025-08-12': {
        schedules: [
            { id: 8, type: 'general', text: 'リラクゼーションチュール' },
        ],
        bathing: []
    },
    '2025-08-18': {
        schedules: [
            { id: 9, type: 'meal', text: '午前8時 【WHS関定特典】' },
        ],
        bathing: []
    },
    '2025-08-20': {
        schedules: [
            { id: 10, type: 'activity', text: '実査課生日' },
        ],
        bathing: []
    },
    '2025-08-24': {
        schedules: [
            { id: 11, type: 'general', text: 'みかと麻痺' },
        ],
        bathing: []
    },
};

const EVENT_STYLES = {
    general: 'bg-purple-900 bg-opacity-40 text-purple-300 border-l-purple-500',
    meal: 'bg-green-900 bg-opacity-40 text-green-300 border-l-green-500',
    activity: 'bg-yellow-900 bg-opacity-40 text-yellow-300 border-l-yellow-500',
    medical: 'bg-red-900 bg-opacity-40 text-red-300 border-l-red-500',
};

export default function CalendarDay({ 
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
    error = null
}) {
    const [dragOver, setDragOver] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const dateKey = format(date, 'yyyy-MM-dd');
    
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
    

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // デフォルトでcopyエフェクトを設定
        e.dataTransfer.dropEffect = 'copy';
        
        setDragOver(true);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        // 子要素から親要素へのleaveイベントを無視
        if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
            setDragOver(false);
        }
    };

    // 次の利用可能な入浴時間を計算
    const getNextAvailableTime = () => {
        console.log('=== getNextAvailableTime Debug ===');
        console.log('dayEvents.bathing:', dayEvents.bathing);
        
        // APIスケジュールのみを対象とする（schedule_type_idが存在するもの）
        const bathingSchedules = dayEvents.bathing.filter(item => 
            item.schedule_type_id !== undefined && item.start_time && item.end_time
        );
        
        console.log('Filtered bathingSchedules:', bathingSchedules);
        
        if (bathingSchedules.length === 0) {
            console.log('No bathing schedules found, returning default time');
            return { start_time: '10:00', end_time: '10:30' };
        }
        
        // 最後の入浴スケジュールの終了時間を取得
        const schedulesWithMinutes = bathingSchedules.map(schedule => ({
            ...schedule,
            end_time_minutes: timeToMinutes(schedule.end_time)
        }));
        
        console.log('Schedules with minutes:', schedulesWithMinutes);
        
        const lastSchedule = schedulesWithMinutes
            .sort((a, b) => a.end_time_minutes - b.end_time_minutes)
            .pop();
        
        console.log('Last schedule:', lastSchedule);
        
        const nextStartMinutes = lastSchedule.end_time_minutes;
        const nextEndMinutes = nextStartMinutes + 30; // 30分後
        
        const result = {
            start_time: minutesToTime(nextStartMinutes),
            end_time: minutesToTime(nextEndMinutes)
        };
        
        console.log('Calculated next time:', result);
        return result;
    };
    
    // 時間文字列を分に変換
    const timeToMinutes = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') {
            console.warn('Invalid time string:', timeStr);
            return 0;
        }
        const parts = timeStr.split(':');
        if (parts.length !== 2) {
            console.warn('Invalid time format:', timeStr);
            return 0;
        }
        const [hours, minutes] = parts.map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
            console.warn('Invalid time values:', timeStr);
            return 0;
        }
        return hours * 60 + minutes;
    };
    
    // 分を時間文字列に変換
    const minutesToTime = (minutes) => {
        if (typeof minutes !== 'number' || isNaN(minutes)) {
            console.warn('Invalid minutes value:', minutes);
            return '10:00';
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
            
            // ドラッグデータのタイプで処理を分岐
            if (dragData.type === 'schedule_move') {
                // スケジュール移動処理
                await handleScheduleMove(dragData);
            } else {
                // 住民からの新規スケジュール作成処理
                await handleResidentDrop(dragData);
            }
        } catch (error) {
            console.error('ドロップデータの解析エラー:', error);
            alert('ドロップしたデータの読み込みに失敗しました');
        }
    };

    // 住民からの新規スケジュール作成
    const handleResidentDrop = async (residentData) => {
        // 既にその住民の入浴スケジュールが存在するかチェック
        const existingSchedule = dayEvents.bathing.find(item => 
            item.resident_id === residentData.id && item.schedule_type_id !== undefined
        );
        
        if (existingSchedule) {
            alert(`${residentData.name}さんの入浴スケジュールは既に登録されています。`);
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
            await createSchedule(bathingSchedule);
            console.log(`入浴スケジュールを作成しました: ${residentData.name} (${start_time}-${end_time})`);
            showSuccessMessage(`${residentData.name}さんの入浴スケジュールを作成しました`);
        } catch (error) {
            console.error('入浴スケジュール作成エラー:', error);
            alert(`入浴スケジュールの作成に失敗しました: ${error.message || 'エラーが発生しました'}`);
        }
    };

    // スケジュール移動処理
    const handleScheduleMove = async (dragData) => {
        const { schedule, sourceDate } = dragData;
        
        // 同じ日への移動は無視
        if (sourceDate === dateKey) {
            console.log('同じ日への移動のためスキップ');
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
            await updateSchedule(schedule.id, updatedSchedule);
            console.log(`スケジュールを移動しました: ${schedule.title} ${sourceDate} → ${dateKey}`);
            showSuccessMessage(`${schedule.title}のスケジュールを${dateKey}に移動しました`);
        } catch (error) {
            console.error('スケジュール移動エラー:', error);
            alert(`スケジュールの移動に失敗しました: ${error.message || 'エラーが発生しました'}`);
        }
    };

    // 成功メッセージ表示
    const showSuccessMessage = (message) => {
        const successMessage = document.createElement('div');
        successMessage.textContent = message;
        successMessage.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
            if (document.body.contains(successMessage)) {
                document.body.removeChild(successMessage);
            }
        }, 3000);
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
        
        console.log('スケジュールドラッグ開始:', schedule.title, 'from', dateKey);
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
        const isApiSchedule = schedule.schedule_type_id !== undefined;
        if (!isApiSchedule) {
            alert('サンプル住民データは削除できません');
            return;
        }
        
        if (window.confirm('このスケジュールを削除しますか？')) {
            try {
                await deleteSchedule(schedule.id);
            } catch (error) {
                console.error('スケジュール削除エラー:', error);
                alert('スケジュールの削除に失敗しました');
            }
        }
    };

    // スケジュール保存
    const handleSaveSchedule = async (formData) => {
        if (selectedSchedule && !selectedSchedule.isNewSchedule) {
            // 更新
            await updateSchedule(selectedSchedule.id, formData);
        } else {
            // 作成
            await createSchedule(formData);
        }
    };

    return (
        <div 
            className={`
                calendar-day flex flex-col p-1.5 min-h-[140px] border-r border-b border-gray-600 relative cursor-pointer
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
                                className="text-[9px] px-1 py-0.5 rounded-sm border-l-2 transition-all hover:-translate-y-px hover:brightness-110 text-white group relative"
                                style={{
                                    backgroundColor: backgroundColor + '40', // 透明度40%
                                    borderLeftColor: backgroundColor
                                }}
                            >
                                <div className="line-clamp-2 pr-1">{displayText}</div>
                                
                                {/* ホバー時の操作ボタン（APIスケジュールのみ表示） */}
                                {event.schedule_type_id !== undefined && (
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
                <div className="flex-1 flex flex-col gap-0.5 border-l border-gray-600 pl-1">
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
                        const isApiSchedule = item.schedule_type_id !== undefined;
                        const displayName = isApiSchedule 
                            ? (item.title || `入浴スケジュール`)
                            : item.name;
                        const scheduleType = isApiSchedule && scheduleTypes.find(type => type.id === item.schedule_type_id);
                        const backgroundColor = scheduleType?.color_code || '#3B82F6';
                        
                        return (
                            <div
                                key={`${isApiSchedule ? 'schedule' : 'resident'}-${item.id}`}
                                draggable={isApiSchedule}
                                onDragStart={isApiSchedule ? (e) => handleScheduleDragStart(e, item) : undefined}
                                className={`text-[9px] px-1 py-0.5 rounded-sm text-white border-l-2 transition-all hover:-translate-y-px hover:brightness-110 group relative ${
                                    isApiSchedule ? 'cursor-move' : 'cursor-pointer'
                                }`}
                                style={{
                                    backgroundColor: backgroundColor + '40',
                                    borderLeftColor: backgroundColor
                                }}
                            >
                                <div className="line-clamp-2 pr-1">{displayName}</div>
                                
                                {/* APIスケジュールの場合のみ操作ボタンを表示 */}
                                {isApiSchedule && (
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
                        className={`border border-dashed rounded-sm min-h-[14px] m-0.5 flex items-center justify-center text-[8px] transition-all ${
                            dragOver 
                                ? 'border-blue-400 bg-blue-900 bg-opacity-20 text-blue-400 border-solid' 
                                : 'border-gray-500 text-gray-500 hover:border-blue-400 hover:bg-blue-900 hover:bg-opacity-10'
                        }`}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
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
}