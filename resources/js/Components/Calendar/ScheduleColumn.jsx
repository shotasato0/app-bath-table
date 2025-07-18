import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ScheduleItem from './ScheduleItem';
import { useDragDrop } from './DragDropProvider';
import { usePermissions } from '@/Utils/PermissionHelper';

export default function ScheduleColumn({ 
    title, 
    schedules = [], 
    date, 
    columnType = 'general',
    onAddSchedule,
    onEditSchedule,
    onDeleteSchedule,
    className = ''
}) {
    const { makeDroppable, getDropTargetStyles } = useDragDrop();
    const { hasPermission } = usePermissions();

    // ドロップ可能な属性を取得
    const dropTargetInfo = {
        date,
        columnType,
        suggestedTime: getSuggestedTime(),
        suggestedEndTime: getSuggestedEndTime()
    };
    
    const droppableProps = makeDroppable(dropTargetInfo);
    const dropStyles = getDropTargetStyles(dropTargetInfo);

    // 推奨時間の計算
    function getSuggestedTime() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // 時間帯に応じた推奨時間
        if (currentHour < 9) return '09:00';
        if (currentHour < 12) return '10:00';
        if (currentHour < 15) return '13:00';
        if (currentHour < 18) return '15:00';
        return '09:00'; // 翌日の朝
    }

    function getSuggestedEndTime() {
        const startTime = getSuggestedTime();
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHour = hours + 1; // 1時間後
        return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // 予定を時間順にソート
    const sortedSchedules = [...schedules].sort((a, b) => {
        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
    });

    // 新規予定作成権限チェック
    const canCreateSchedule = hasPermission('SCHEDULE_CREATE');

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* カラムヘッダー */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                        {schedules.length}
                    </span>
                </div>
                
                {canCreateSchedule && (
                    <button
                        onClick={() => onAddSchedule(columnType, date)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="新規予定を追加"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <span className="text-sm">予定追加</span>
                    </button>
                )}
            </div>

            {/* ドロップゾーン */}
            <div
                className="flex-1 p-4 overflow-y-auto"
                style={dropStyles}
                {...droppableProps}
            >
                {sortedSchedules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-gray-400 mb-2">
                            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-sm">予定がありません</p>
                        <p className="text-xs text-gray-400 mt-1">
                            利用者をドラッグして予定を作成できます
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedSchedules.map((schedule) => (
                            <ScheduleItem
                                key={schedule.id}
                                schedule={schedule}
                                onEdit={onEditSchedule}
                                onDelete={onDeleteSchedule}
                                type={getScheduleType(schedule)}
                            />
                        ))}
                    </div>
                )}

                {/* 時間帯ガイドライン */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-400 space-y-1">
                        <div className="flex justify-between">
                            <span>朝</span>
                            <span>06:00 - 10:00</span>
                        </div>
                        <div className="flex justify-between">
                            <span>昼</span>
                            <span>10:00 - 15:00</span>
                        </div>
                        <div className="flex justify-between">
                            <span>夕</span>
                            <span>15:00 - 19:00</span>
                        </div>
                        <div className="flex justify-between">
                            <span>夜</span>
                            <span>19:00 - 22:00</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 予定タイプの判定
function getScheduleType(schedule) {
    if (schedule.type) {
        return schedule.type;
    }
    
    // タイトルから推測
    const title = schedule.title?.toLowerCase() || '';
    if (title.includes('入浴') || title.includes('バス')) return 'bathing';
    if (title.includes('食事') || title.includes('昼食') || title.includes('夕食')) return 'meal';
    if (title.includes('薬') || title.includes('医療') || title.includes('診察')) return 'medical';
    if (title.includes('レク') || title.includes('活動') || title.includes('運動')) return 'activity';
    
    return 'general';
}