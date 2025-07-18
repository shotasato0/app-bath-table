import React from 'react';
import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import ScheduleItem from './ScheduleItem';
import { useDragDrop } from './DragDropProvider';
import { usePermissions } from '@/Utils/PermissionHelper';

export default function BathingColumn({ 
    title = '入浴スケジュール',
    bathingSchedules = [],
    date,
    onAddBathingSchedule,
    onEditSchedule,
    onDeleteSchedule,
    className = ''
}) {
    const { makeDroppable, getDropTargetStyles } = useDragDrop();
    const { hasPermission } = usePermissions();

    // ドロップ可能な属性を取得
    const dropTargetInfo = {
        date,
        columnType: 'bathing',
        suggestedTime: getBathingTimeSlot(),
        suggestedEndTime: getBathingEndTime()
    };
    
    const droppableProps = makeDroppable(dropTargetInfo);
    const dropStyles = getDropTargetStyles(dropTargetInfo);

    // 入浴時間帯の計算
    function getBathingTimeSlot() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // 入浴時間帯（午前・午後）
        if (currentHour < 12) return '10:00'; // 午前の入浴
        return '14:00'; // 午後の入浴
    }

    function getBathingEndTime() {
        const startTime = getBathingTimeSlot();
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHour = hours + 1; // 入浴は1時間程度
        return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // 入浴スケジュールを時間順にソート
    const sortedBathingSchedules = [...bathingSchedules].sort((a, b) => {
        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
    });

    // 時間帯別にグループ化
    const groupByTimeSlot = (schedules) => {
        const morning = [];
        const afternoon = [];
        const evening = [];
        
        schedules.forEach(schedule => {
            const hour = parseInt(schedule.start_time?.split(':')[0] || '0');
            if (hour < 12) {
                morning.push(schedule);
            } else if (hour < 17) {
                afternoon.push(schedule);
            } else {
                evening.push(schedule);
            }
        });
        
        return { morning, afternoon, evening };
    };

    const { morning, afternoon, evening } = groupByTimeSlot(sortedBathingSchedules);

    // 入浴予定作成権限チェック
    const canCreateBathingSchedule = hasPermission('BATHING_SCHEDULE');

    // 時間帯コンポーネント
    const TimeSlotSection = ({ title, schedules, timeSlot, icon }) => (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>{icon}</span>
                    <span>{title}</span>
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                        {schedules.length}
                    </span>
                </h4>
                <span className="text-xs text-gray-500">{timeSlot}</span>
            </div>
            
            <div className="space-y-2">
                {schedules.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <UserIcon className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-xs">入浴予定なし</p>
                    </div>
                ) : (
                    schedules.map((schedule) => (
                        <ScheduleItem
                            key={schedule.id}
                            schedule={schedule}
                            onEdit={onEditSchedule}
                            onDelete={onDeleteSchedule}
                            type="bathing"
                        />
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* カラムヘッダー */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border-b border-blue-200 sticky top-0 z-10">
                <div className="flex items-center space-x-2">
                    <span className="text-blue-600 text-xl">🛁</span>
                    <h3 className="text-lg font-semibold text-blue-900">
                        {title}
                    </h3>
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm">
                        {bathingSchedules.length}
                    </span>
                </div>
                
                {canCreateBathingSchedule && (
                    <button
                        onClick={() => onAddBathingSchedule(date)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="入浴予定を追加"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <span className="text-sm">入浴予定</span>
                    </button>
                )}
            </div>

            {/* ドロップゾーン */}
            <div
                className="flex-1 p-4 overflow-y-auto"
                style={dropStyles}
                {...droppableProps}
            >
                {bathingSchedules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-blue-300 mb-2">
                            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-sm">入浴予定がありません</p>
                        <p className="text-xs text-gray-400 mt-1">
                            利用者をドラッグして入浴予定を作成できます
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* 午前の入浴 */}
                        <TimeSlotSection
                            title="午前の入浴"
                            schedules={morning}
                            timeSlot="10:00 - 12:00"
                            icon="🌅"
                        />
                        
                        {/* 午後の入浴 */}
                        <TimeSlotSection
                            title="午後の入浴"
                            schedules={afternoon}
                            timeSlot="14:00 - 17:00"
                            icon="☀️"
                        />
                        
                        {/* 夕方の入浴 */}
                        {evening.length > 0 && (
                            <TimeSlotSection
                                title="夕方の入浴"
                                schedules={evening}
                                timeSlot="17:00 - 19:00"
                                icon="🌇"
                            />
                        )}
                    </div>
                )}

                {/* 入浴設備情報 */}
                <div className="mt-6 pt-4 border-t border-blue-100">
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <h5 className="text-sm font-medium text-blue-900 mb-2">入浴設備情報</h5>
                        <div className="text-xs text-blue-700 space-y-1">
                            <div className="flex justify-between">
                                <span>一般浴槽</span>
                                <span className="text-green-600">利用可能</span>
                            </div>
                            <div className="flex justify-between">
                                <span>機械浴槽</span>
                                <span className="text-green-600">利用可能</span>
                            </div>
                            <div className="flex justify-between">
                                <span>個浴室</span>
                                <span className="text-green-600">利用可能</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 入浴時の注意事項 */}
                <div className="mt-4">
                    <div className="bg-yellow-50 p-3 rounded-lg">
                        <h5 className="text-sm font-medium text-yellow-900 mb-2">入浴時の注意事項</h5>
                        <ul className="text-xs text-yellow-700 space-y-1">
                            <li>• 血圧・体温測定後に入浴</li>
                            <li>• 水分補給を忘れずに</li>
                            <li>• 入浴時間は30分以内</li>
                            <li>• 体調不良時は中止</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}