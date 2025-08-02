import React from 'react';
import { format } from 'date-fns';

export default function AllSchedulesModal({ 
    isOpen, 
    onClose, 
    date, 
    schedules, 
    bathingSchedules, 
    scheduleTypes,
    onEditSchedule,
    onDeleteSchedule,
    showConfirmDialog
}) {
    if (!isOpen) return null;

    const isApiSchedule = (schedule) => {
        return schedule && schedule.schedule_type_id !== undefined;
    };

    const handleEditSchedule = (schedule, e) => {
        e.stopPropagation();
        onEditSchedule(schedule);
        onClose();
    };

    const handleDeleteSchedule = (schedule, e) => {
        e.stopPropagation();
        
        if (!isApiSchedule(schedule)) {
            return;
        }
        
        showConfirmDialog(
            'このスケジュールを削除しますか？',
            async () => {
                try {
                    await onDeleteSchedule(schedule.id);
                    onClose();
                } catch (error) {
                    console.error('スケジュールの削除に失敗しました');
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-100">
                        {format(date, 'M月d日')} の全スケジュール
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                        aria-label="閉じる"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 予定セクション */}
                {schedules.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-purple-300 mb-3 flex items-center">
                            <span className="mr-2">📋</span>
                            予定 ({schedules.length}件)
                        </h3>
                        <div className="space-y-2">
                            {schedules.map((event) => {
                                const scheduleType = scheduleTypes.find(type => type.id === event.schedule_type_id);
                                const backgroundColor = scheduleType?.color_code || '#9B59B6';
                                const displayText = event.title || event.text || 'スケジュール';
                                
                                return (
                                    <div
                                        key={event.id}
                                        className="p-3 rounded-lg border border-gray-600 group relative"
                                        style={{
                                            backgroundColor: backgroundColor + '20',
                                            borderLeftColor: backgroundColor,
                                            borderLeftWidth: '4px'
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="text-white font-medium">{displayText}</div>
                                                {event.description && (
                                                    <div className="text-gray-300 text-sm mt-1">{event.description}</div>
                                                )}
                                                {event.start_time && event.end_time && (
                                                    <div className="text-gray-400 text-sm mt-1">
                                                        {event.start_time} - {event.end_time}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* 操作ボタン（APIスケジュールのみ） */}
                                            {isApiSchedule(event) && (
                                                <div className="flex gap-1 ml-2">
                                                    <button
                                                        onClick={(e) => handleEditSchedule(event, e)}
                                                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                                        title="編集"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteSchedule(event, e)}
                                                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                        title="削除"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 入浴セクション */}
                {bathingSchedules.length > 0 && (
                    <div>
                        <h3 className="text-lg font-medium text-blue-300 mb-3 flex items-center">
                            <span className="mr-2">🛁</span>
                            入浴 ({bathingSchedules.length}件)
                        </h3>
                        <div className="space-y-2">
                            {bathingSchedules.map((item) => {
                                const isScheduleFromApi = isApiSchedule(item);
                                const displayName = isScheduleFromApi 
                                    ? (item.title || `入浴スケジュール`)
                                    : item.name;
                                const scheduleType = isScheduleFromApi && scheduleTypes.find(type => type.id === item.schedule_type_id);
                                const backgroundColor = scheduleType?.color_code || '#3B82F6';
                                
                                return (
                                    <div
                                        key={`${isScheduleFromApi ? 'schedule' : 'resident'}-${item.id}`}
                                        className="p-3 rounded-lg border border-gray-600 group relative"
                                        style={{
                                            backgroundColor: backgroundColor + '20',
                                            borderLeftColor: backgroundColor,
                                            borderLeftWidth: '4px'
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="text-white font-medium">{displayName}</div>
                                                {item.description && (
                                                    <div className="text-gray-300 text-sm mt-1">{item.description}</div>
                                                )}
                                                {item.start_time && item.end_time && (
                                                    <div className="text-gray-400 text-sm mt-1">
                                                        {item.start_time} - {item.end_time}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* 操作ボタン（APIスケジュールのみ） */}
                                            {isScheduleFromApi && (
                                                <div className="flex gap-1 ml-2">
                                                    <button
                                                        onClick={(e) => handleEditSchedule(item, e)}
                                                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                                        title="編集"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteSchedule(item, e)}
                                                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                        title="削除"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* スケジュールがない場合 */}
                {schedules.length === 0 && bathingSchedules.length === 0 && (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-lg mb-2">📅</div>
                        <div className="text-gray-400">この日にはスケジュールがありません</div>
                    </div>
                )}
            </div>
        </div>
    );
}