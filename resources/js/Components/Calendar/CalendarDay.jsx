import React, { useState } from 'react';
import { format } from 'date-fns';

const EVENT_STYLES = {
    入浴: 'bg-blue-900 bg-opacity-40 text-blue-300 border-l-blue-500',
    食事: 'bg-green-900 bg-opacity-40 text-green-300 border-l-green-500',
    レクリエーション: 'bg-yellow-900 bg-opacity-40 text-yellow-300 border-l-yellow-500',
    医療: 'bg-red-900 bg-opacity-40 text-red-300 border-l-red-500',
    その他: 'bg-purple-900 bg-opacity-40 text-purple-300 border-l-purple-500',
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
    onCreateSchedule,
    onUpdateSchedule,
    onDeleteSchedule
}) {
    const [dragOver, setDragOver] = useState(false);
    const dateKey = format(date, 'yyyy-MM-dd');

    // スケジュールタイプIDから名前を取得
    const getScheduleTypeName = (typeId) => {
        const type = scheduleTypes.find(t => t.id === typeId);
        return type?.type_name || 'その他';
    };

    // スケジュールを入浴とその他に分類
    const bathingSchedules = schedules.filter(schedule => {
        const typeName = getScheduleTypeName(schedule.schedule_type_id);
        return typeName === '入浴';
    });

    const otherSchedules = schedules.filter(schedule => {
        const typeName = getScheduleTypeName(schedule.schedule_type_id);
        return typeName !== '入浴';
    });

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        
        try {
            const residentData = JSON.parse(e.dataTransfer.getData('application/json'));
            console.log('Dropped resident:', residentData, 'on date:', dateKey);
            
            // 入浴スケジュールを作成
            if (onCreateSchedule) {
                // 入浴タイプのIDを取得
                const bathingType = scheduleTypes.find(type => type.type_name === '入浴');
                if (bathingType) {
                    await onCreateSchedule({
                        date_id: dateKey, // 実際はcalendar_dates.idが必要
                        title: `${residentData.name}の入浴`,
                        description: '入浴スケジュール',
                        start_time: '10:00',
                        end_time: '11:00',
                        schedule_type_id: bathingType.id,
                        resident_id: residentData.id,
                    });
                }
            }
        } catch (error) {
            console.error('Invalid drop data:', error);
        }
    };

    const handleScheduleClick = (schedule, event) => {
        event.stopPropagation();
        console.log('Schedule clicked:', schedule);
        // モーダルやフォームを開く処理をここに追加
    };

    const handleScheduleDoubleClick = async (schedule, event) => {
        event.stopPropagation();
        if (onDeleteSchedule && confirm('このスケジュールを削除しますか？')) {
            try {
                await onDeleteSchedule(schedule.id);
            } catch (error) {
                alert('削除に失敗しました: ' + (error.response?.data?.message || error.message));
            }
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
                {schedules.length > 0 && (
                    <div className="text-xs text-gray-400">
                        {schedules.length}
                    </div>
                )}
            </div>

            {/* 日の内容 */}
            <div className="flex flex-1 gap-1">
                {/* 予定側 */}
                <div className="flex-1 flex flex-col gap-0.5">
                    <div className="text-purple-300 text-[8px] text-center pb-0.5 border-b border-gray-600 font-medium">
                        予定
                    </div>
                    {otherSchedules.map((schedule) => {
                        const typeName = getScheduleTypeName(schedule.schedule_type_id);
                        const styleClass = EVENT_STYLES[typeName] || EVENT_STYLES['その他'];
                        
                        return (
                            <div
                                key={schedule.id}
                                className={`text-[9px] px-1 py-0.5 rounded-sm cursor-pointer border-l-2 transition-all hover:-translate-y-px hover:brightness-110 line-clamp-2 ${styleClass}`}
                                onClick={(e) => handleScheduleClick(schedule, e)}
                                onDoubleClick={(e) => handleScheduleDoubleClick(schedule, e)}
                                title={`${schedule.title}\n${schedule.start_time} - ${schedule.end_time}\n${schedule.description || ''}`}
                            >
                                <div className="font-medium">{schedule.title}</div>
                                {schedule.start_time && (
                                    <div className="text-[8px] opacity-75">
                                        {schedule.start_time.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 入浴側 */}
                <div className="flex-1 flex flex-col gap-0.5 border-l border-gray-600 pl-1">
                    <div className="text-blue-300 text-[8px] text-center pb-0.5 border-b border-gray-600 font-medium">
                        🛁 入浴
                    </div>
                    {bathingSchedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className="text-[9px] px-1 py-0.5 rounded-sm bg-blue-900 bg-opacity-40 text-blue-300 border-l-2 border-l-blue-500 cursor-pointer transition-all hover:-translate-y-px hover:brightness-110"
                            onClick={(e) => handleScheduleClick(schedule, e)}
                            onDoubleClick={(e) => handleScheduleDoubleClick(schedule, e)}
                            title={`${schedule.resident?.name || ''}\n${schedule.start_time} - ${schedule.end_time}\n${schedule.description || ''}`}
                        >
                            <div className="font-medium">{schedule.resident?.name || schedule.title}</div>
                            {schedule.start_time && (
                                <div className="text-[8px] opacity-75">
                                    {schedule.start_time.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {/* ドロップゾーン */}
                    <div
                        className={`border border-dashed rounded-sm min-h-[14px] m-0.5 flex items-center justify-center text-[8px] transition-all ${
                            dragOver 
                                ? 'border-blue-400 bg-blue-900 bg-opacity-20 text-blue-400 border-solid' 
                                : 'border-gray-500 text-gray-500 hover:border-blue-400 hover:bg-blue-900 hover:bg-opacity-10'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {dragOver ? 'ここにドロップ' : bathingSchedules.length === 0 ? 'ドロップで追加' : ''}
                    </div>
                </div>
            </div>
        </div>
    );
}