import React from 'react';
import { createPortal } from 'react-dom';
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

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-600"
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
                            <svg
                                className="mr-2 w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <title>クリップボード</title>
                                <rect x="9" y="2" width="6" height="4" rx="1" />
                                <path d="M4 7v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" />
                                <path d="M9 2h6" />
                            </svg>
                            予定 ({schedules.length}件)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {schedules.map((event) => {
                                const scheduleType = scheduleTypes.find(type => type.id === event.schedule_type_id);
                                const backgroundColor = scheduleType?.color_code || '#9B59B6';
                                const displayText = event.title || event.text || 'スケジュール';
                                
                                return (
                                    <div
                                        key={event.id}
                                        className="p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors group relative"
                                        style={{
                                            backgroundColor: backgroundColor + '15',
                                            borderLeftColor: backgroundColor,
                                            borderLeftWidth: '4px'
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium text-sm mb-1 truncate" title={displayText}>
                                                    {displayText}
                                                </div>
                                                {event.description && (
                                                    <div className="text-gray-300 text-xs mb-2 line-clamp-2" title={event.description}>
                                                        {event.description}
                                                    </div>
                                                )}
                                                {event.start_time && event.end_time && (
                                                    <div className="text-gray-400 text-xs flex items-center">
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {event.start_time} - {event.end_time}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* 操作ボタン（APIスケジュールのみ） */}
                                            {isApiSchedule(event) && (
                                                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleEditSchedule(event, e)}
                                                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                                                        title="編集"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteSchedule(event, e)}
                                                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                                                        title="削除"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <svg
                                className="mr-2 w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <title>入浴</title>
                                <path d="M8 3a5 5 0 015 5 5 5 0 015-5 5 5 0 00-5 5 5 5 0 00-5-5zM3 21v-6a3 3 0 113 3H3z" />
                            </svg>
                            入浴 ({bathingSchedules.length}件)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                        className="p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors group relative"
                                        style={{
                                            backgroundColor: backgroundColor + '15',
                                            borderLeftColor: backgroundColor,
                                            borderLeftWidth: '4px'
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium text-sm mb-1 truncate" title={displayName}>
                                                    {displayName}
                                                </div>
                                                {item.description && (
                                                    <div className="text-gray-300 text-xs mb-2 line-clamp-2" title={item.description}>
                                                        {item.description}
                                                    </div>
                                                )}
                                                {item.start_time && item.end_time && (
                                                    <div className="text-gray-400 text-xs flex items-center">
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {item.start_time} - {item.end_time}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* 操作ボタン（APIスケジュールのみ） */}
                                            {isScheduleFromApi && (
                                                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleEditSchedule(item, e)}
                                                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                                                        title="編集"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteSchedule(item, e)}
                                                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                                                        title="削除"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <svg
                            className="mx-auto w-8 h-8 text-gray-400 mb-2"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <title>カレンダー</title>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <div className="text-gray-400">この日にはスケジュールがありません</div>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}