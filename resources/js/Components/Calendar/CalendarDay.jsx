import React, { useState, useRef, memo } from 'react';
import { format } from 'date-fns';
import ScheduleModal from './ScheduleModal';
import AllSchedulesModal from './AllSchedulesModal';

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
    const [showAllSchedulesModal, setShowAllSchedulesModal] = useState(false);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    // 表示数制限の設定
    const MAX_DISPLAY_SCHEDULES = 2; // 一般予定の最大表示数
    const MAX_DISPLAY_BATHING = 4;   // 入浴予定の最大表示数

    /**
     * ユーティリティ関数: APIスケジュールかサンプルデータかを判定
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
    const sampleData = schedules.length === 0 ? SAMPLE_EVENTS[dateKey] : null;
    const sampleSchedules = sampleData?.schedules || [];
    const sampleBathing = sampleData?.bathing || [];
    
    const dayEvents = {
        schedules: [...generalSchedules, ...sampleSchedules],
        bathing: [...bathingSchedules, ...sampleBathing]
    };

    // 次の利用可能な入浴時間を計算
    const getNextAvailableTime = () => {
        const bathingSchedules = dayEvents.bathing.filter(item => 
            isApiSchedule(item) && item.start_time && item.end_time
        );
        
        if (bathingSchedules.length === 0) {
            return { start_time: '10:00', end_time: '10:30' };
        }
        
        const schedulesWithMinutes = bathingSchedules.map(schedule => ({
            ...schedule,
            end_time_minutes: timeToMinutes(schedule.end_time)
        }));
        
        const lastSchedule = schedulesWithMinutes
            .sort((a, b) => a.end_time_minutes - b.end_time_minutes)
            .pop();
        
        const nextStartMinutes = lastSchedule.end_time_minutes;
        const nextEndMinutes = nextStartMinutes + 30;
        
        return {
            start_time: minutesToTime(nextStartMinutes),
            end_time: minutesToTime(nextEndMinutes)
        };
    };
    
    const timeToMinutes = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        const parts = timeStr.split(':');
        if (parts.length !== 2) return 0;
        const [hours, minutes] = parts.map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 0;
        return hours * 60 + minutes;
    };
    
    const minutesToTime = (minutes) => {
        if (typeof minutes !== 'number' || isNaN(minutes)) return '10:00';
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
                showNotification('ドラッグデータが見つかりませんでした', 'error');
                return;
            }
            
            const dragData = JSON.parse(jsonData);
            
            if (dragData.type === 'schedule_move') {
                await handleScheduleMove(dragData);
            } else {
                await handleResidentDrop(dragData);
            }
        } catch (error) {
            showNotification('ドロップしたデータの読み込みに失敗しました: ' + error.message, 'error');
        }
    };

    const handleResidentDrop = async (residentData) => {
        const bathingScheduleData = {
            title: residentData.name,
            schedule_type_id: 1,
            resident_id: residentData.id
        };
        
        const duplicateError = checkBathingScheduleDuplicate(bathingScheduleData);
        if (duplicateError) {
            showNotification(duplicateError, 'warning');
            return;
        }
        
        const { start_time, end_time } = getNextAvailableTime();
        
        const bathingSchedule = {
            title: `${residentData.name}`,
            description: `${residentData.room} ${residentData.name}さんの入浴時間`,
            date: dateKey,
            start_time,
            end_time,
            schedule_type_id: 1,
            resident_id: residentData.id,
            all_day: false
        };
        
        try {
            showNotification(`${residentData.name}さんの入浴スケジュールを作成しました`, 'success');
            await createSchedule(bathingSchedule);
        } catch (error) {
            showNotification(`入浴スケジュールの作成に失敗しました: ${error.message || 'エラーが発生しました'}`, 'error');
        }
    };

    const handleScheduleMove = async (dragData) => {
        const { schedule, sourceDate } = dragData;
        
        if (sourceDate === dateKey) return;
        
        const duplicateError = checkBathingScheduleDuplicate(schedule, schedule.id);
        if (duplicateError) {
            showNotification(duplicateError, 'warning');
            return;
        }
        
        const { start_time, end_time } = getNextAvailableTime();
        
        const updatedSchedule = {
            ...schedule,
            date: dateKey,
            start_time,
            end_time
        };
        
        try {
            showNotification(`${schedule.title}のスケジュールを${dateKey}に移動しました`, 'success');
            await updateSchedule(schedule.id, updatedSchedule);
        } catch (error) {
            showNotification(`スケジュールの移動に失敗しました: ${error.message || 'エラーが発生しました'}`, 'error');
        }
    };

    const handleScheduleDragStart = (e, schedule) => {
        e.stopPropagation();
        
        const dragData = {
            type: 'schedule_move',
            schedule: schedule,
            sourceDate: dateKey
        };
        
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleCreateSchedule = (e) => {
        e.stopPropagation();
        setSelectedSchedule({
            isNewSchedule: true,
            isBathingSchedule: false
        });
        setShowScheduleModal(true);
    };

    const handleCreateBathingSchedule = (e) => {
        e.stopPropagation();
        setSelectedSchedule({
            isBathingSchedule: true,
            schedule_type_id: 1,
            isNewSchedule: true
        });
        setShowScheduleModal(true);
    };

    const handleEditSchedule = (schedule, e) => {
        e.stopPropagation();
        setSelectedSchedule(schedule);
        setShowScheduleModal(true);
    };

    const handleDeleteSchedule = async (schedule, e) => {
        e.stopPropagation();
        
        if (!isApiSchedule(schedule)) {
            showNotification('サンプル住民データは削除できません', 'warning');
            return;
        }
        
        showConfirmDialog(
            'このスケジュールを削除しますか？',
            async () => {
                try {
                    await deleteSchedule(schedule.id);
                } catch (error) {
                    showNotification('スケジュールの削除に失敗しました', 'error');
                }
            }
        );
    };

    const checkBathingScheduleDuplicate = (formData, excludeId = null) => {
        if (formData.schedule_type_id !== 1) return null;

        if (formData.resident_id) {
            const existingSchedule = dayEvents.bathing.find(item => 
                isApiSchedule(item) &&
                item.resident_id === formData.resident_id &&
                item.id !== excludeId
            );
            
            if (existingSchedule) {
                const displayName = formData.title || `住民ID:${formData.resident_id}`;
                return `${displayName}さんの入浴スケジュールは既にこの日に登録されています。`;
            }
        }

        if (formData.title) {
            const existingSchedule = dayEvents.bathing.find(item => 
                isApiSchedule(item) &&
                item.title === formData.title &&
                item.id !== excludeId
            );
            
            if (existingSchedule) {
                return `${formData.title}さんの入浴スケジュールは既にこの日に登録されています。`;
            }
        }

        return null;
    };

    const handleSaveSchedule = async (formData) => {
        if (selectedSchedule && !selectedSchedule.isNewSchedule) {
            const duplicateError = checkBathingScheduleDuplicate(formData, selectedSchedule.id);
            if (duplicateError) {
                showNotification(duplicateError, 'warning');
                return;
            }
            await updateSchedule(selectedSchedule.id, formData);
        } else {
            const duplicateError = checkBathingScheduleDuplicate(formData);
            if (duplicateError) {
                showNotification(duplicateError, 'warning');
                return;
            }
            await createSchedule(formData);
        }
    };

    return (
        <div 
            className={`
                calendar-day flex flex-col p-3 min-h-[220px] border-r border-b border-gray-600 relative cursor-pointer layout-stable
                w-[calc(100%/7)] flex-shrink-0
                ${dayIndex % 7 === 6 ? 'border-r-0' : ''}
                ${!isCurrentMonth ? 'bg-gray-700' : 'bg-gray-800'}
                ${isToday ? 'bg-blue-900 bg-opacity-20 border-2 border-blue-600' : ''}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
            `}
            onClick={onClick}
            tabIndex={0}
            role="button"
            aria-label={`${format(date, 'M月d日')}のスケジュール`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            {/* 日付ヘッダー */}
            <div className="flex justify-between items-center mb-3 min-h-[24px] calendar-day-header">
                <div className={`text-lg font-semibold calendar-day-number ${
                    !isCurrentMonth ? 'text-gray-500' : 
                    isToday ? 'text-blue-400' : 
                    'text-gray-100'
                }`}>
                    {format(date, 'd')}
                </div>
            </div>

            {/* 日の内容 - 上下分割レイアウト */}
            <div className="flex flex-col flex-1 calendar-content">
                {/* 上部：予定セクション */}
                <div className="flex-1 flex flex-col calendar-section">
                    <div className="text-purple-300 text-xs text-center pb-1 border-b border-gray-600 font-semibold flex justify-between items-center calendar-section-header">
                        <span>📋 予定</span>
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
                    <div className="flex-1 pt-1 space-y-1">
                        {/* 表示制限された予定 */}
                        {dayEvents.schedules.slice(0, MAX_DISPLAY_SCHEDULES).map((event) => {
                            const scheduleType = scheduleTypes.find(type => type.id === event.schedule_type_id);
                            const backgroundColor = scheduleType?.color_code || '#9B59B6';
                            const displayText = event.title || event.text || 'スケジュール';
                            
                            return (
                                <div
                                    key={event.id}
                                    className="text-sm px-2 py-1 rounded-sm border-l-2 text-white group relative schedule-item animate-fade-in calendar-item"
                                    style={{
                                        backgroundColor: backgroundColor + '40',
                                        borderLeftColor: backgroundColor
                                    }}
                                >
                                    <div className="whitespace-nowrap overflow-hidden text-ellipsis pr-1" title={displayText}>{displayText}</div>
                                    
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
                        
                        {/* 「他何件」表示ボタン */}
                        {dayEvents.schedules.length > MAX_DISPLAY_SCHEDULES && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllSchedulesModal(true);
                                }}
                                className="w-full text-xs text-purple-400 hover:text-purple-300 transition-colors text-center py-1 bg-purple-900 bg-opacity-30 rounded-sm border border-purple-600 border-opacity-50"
                            >
                                他{dayEvents.schedules.length - MAX_DISPLAY_SCHEDULES}件
                            </button>
                        )}
                    </div>
                </div>

                {/* 下部：入浴セクション */}
                <div 
                    className={`flex-1 flex flex-col border-t border-gray-600 pt-1 mt-1 drag-over-zone calendar-section ${
                        dragOver ? 'bg-blue-900 bg-opacity-20 dragover' : ''
                    }`}
                >
                    <div className="text-blue-300 text-xs text-center pb-1 border-b border-gray-600 font-semibold flex justify-between items-center calendar-section-header">
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
                    <div className="flex-1 pt-1 space-y-1">
                        {/* 表示制限された入浴予定 */}
                        {dayEvents.bathing.slice(0, MAX_DISPLAY_BATHING).map((item) => {
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
                                    className={`text-sm px-2 py-1 rounded-sm text-white border-l-2 group relative schedule-item animate-fade-in calendar-item ${
                                        isScheduleFromApi ? 'cursor-move' : 'cursor-pointer'
                                    }`}
                                    style={{
                                        backgroundColor: backgroundColor + '40',
                                        borderLeftColor: backgroundColor
                                    }}
                                >
                                    <div className="whitespace-nowrap overflow-hidden text-ellipsis pr-1" title={displayName}>{displayName}</div>
                                    
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
                        
                        {/* 「他何件」表示ボタン（入浴） */}
                        {dayEvents.bathing.length > MAX_DISPLAY_BATHING && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllSchedulesModal(true);
                                }}
                                className="w-full text-xs text-blue-400 hover:text-blue-300 transition-colors text-center py-1 bg-blue-900 bg-opacity-30 rounded-sm border border-blue-600 border-opacity-50"
                            >
                                他{dayEvents.bathing.length - MAX_DISPLAY_BATHING}件
                            </button>
                        )}
                        
                        {/* ドロップゾーン */}
                        <div
                            style={{ minHeight: '20px' }}
                            className={`border border-dashed rounded-sm flex items-center justify-center text-xs transition-all mt-auto ${
                                dragOver 
                                    ? 'border-blue-400 bg-blue-900 bg-opacity-20 text-blue-400 border-solid' 
                                    : 'border-gray-500 text-gray-500 hover:border-blue-400 hover:bg-blue-900 hover:bg-opacity-10'
                            }`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onDragEnter={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                dragCounter.current++;
                                if (dragCounter.current === 1) {
                                    setDragOver(true);
                                }
                            }}
                            onDragLeave={(e) => {
                                e.stopPropagation();
                                dragCounter.current--;
                                if (dragCounter.current === 0) {
                                    setDragOver(false);
                                }
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOver(false);
                                dragCounter.current = 0;
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

            {/* 全スケジュール表示モーダル */}
            <AllSchedulesModal
                isOpen={showAllSchedulesModal}
                onClose={() => setShowAllSchedulesModal(false)}
                date={date}
                schedules={dayEvents.schedules}
                bathingSchedules={dayEvents.bathing}
                scheduleTypes={scheduleTypes}
                onEditSchedule={handleEditSchedule}
                onDeleteSchedule={deleteSchedule}
                showConfirmDialog={showConfirmDialog}
            />
        </div>
    );
});

export default CalendarDay;