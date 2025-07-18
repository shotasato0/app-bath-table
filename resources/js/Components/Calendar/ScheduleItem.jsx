import React from 'react';
import { ClockIcon, UserIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useDragDrop } from './DragDropProvider';
import { usePermissions } from '@/Utils/PermissionHelper';

export default function ScheduleItem({ 
    schedule, 
    onEdit, 
    onDelete, 
    canEdit = true, 
    type = 'general' 
}) {
    const { makeDraggable, getDragStyles } = useDragDrop();
    const { canEditSchedule, canDeleteSchedule } = usePermissions();

    // 権限チェック
    const canUserEdit = canEdit && canEditSchedule(schedule);
    const canUserDelete = canDeleteSchedule(schedule);

    // 時間の表示フォーマット
    const formatTime = (time) => {
        if (!time) return '';
        return time.slice(0, 5); // HH:MM形式
    };

    // 予定のタイプに応じたスタイル
    const getScheduleStyle = () => {
        const baseStyle = 'rounded-lg p-3 mb-2 border-l-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-move';
        
        switch (type) {
            case 'bathing':
                return `${baseStyle} border-l-blue-500 bg-blue-50`;
            case 'meal':
                return `${baseStyle} border-l-green-500 bg-green-50`;
            case 'medical':
                return `${baseStyle} border-l-red-500 bg-red-50`;
            case 'activity':
                return `${baseStyle} border-l-purple-500 bg-purple-50`;
            default:
                return `${baseStyle} border-l-gray-500 bg-gray-50`;
        }
    };

    // 予定タイプのアイコン
    const getTypeIcon = () => {
        switch (type) {
            case 'bathing':
                return '🛁';
            case 'meal':
                return '🍽️';
            case 'medical':
                return '💊';
            case 'activity':
                return '🎯';
            default:
                return '📅';
        }
    };

    // ドラッグ可能な属性を取得
    const draggableProps = makeDraggable(schedule, 'schedule');
    const dragStyles = getDragStyles(schedule, 'schedule');

    return (
        <div
            className={getScheduleStyle()}
            style={dragStyles}
            {...draggableProps}
        >
            {/* ヘッダー部分 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon()}</span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4" />
                        <span>
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </span>
                    </div>
                </div>
                
                {/* 操作ボタン */}
                <div className="flex items-center space-x-1">
                    {canUserEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(schedule);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                            title="編集"
                        >
                            <PencilIcon className="h-4 w-4" />
                        </button>
                    )}
                    
                    {canUserDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('この予定を削除しますか？')) {
                                    onDelete(schedule);
                                }
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded"
                            title="削除"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* タイトル */}
            <div className="mb-2">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {schedule.title}
                </h4>
            </div>

            {/* 利用者情報 */}
            {schedule.resident && (
                <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                        {schedule.resident.name}
                    </span>
                    {schedule.resident.room_number && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            {schedule.resident.room_number}号室
                        </span>
                    )}
                </div>
            )}

            {/* 詳細情報 */}
            {schedule.description && (
                <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {schedule.description}
                </div>
            )}

            {/* 担当者情報 */}
            {schedule.staff && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>担当: {schedule.staff.name}</span>
                    {schedule.priority && (
                        <span className={`px-2 py-1 rounded text-xs ${
                            schedule.priority === 'high' 
                                ? 'bg-red-100 text-red-800' 
                                : schedule.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                        }`}>
                            {schedule.priority === 'high' ? '重要' : 
                             schedule.priority === 'medium' ? '中' : '低'}
                        </span>
                    )}
                </div>
            )}

            {/* ステータス表示 */}
            {schedule.status && (
                <div className="mt-2 flex justify-end">
                    <span className={`px-2 py-1 rounded text-xs ${
                        schedule.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : schedule.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : schedule.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}>
                        {schedule.status === 'completed' ? '完了' : 
                         schedule.status === 'in_progress' ? '実施中' :
                         schedule.status === 'cancelled' ? 'キャンセル' : '予定'}
                    </span>
                </div>
            )}
        </div>
    );
}