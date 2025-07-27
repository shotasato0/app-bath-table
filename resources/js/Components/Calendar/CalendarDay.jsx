import React, { useState } from 'react';
import { format } from 'date-fns';

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
    const dateKey = format(date, 'yyyy-MM-dd');
    
    // APIデータを優先的に使用し、フォールバックとしてサンプルデータを使用
    const dayEvents = {
        schedules: schedules.length > 0 ? schedules : (SAMPLE_EVENTS[dateKey]?.schedules || []),
        bathing: SAMPLE_EVENTS[dateKey]?.bathing || [] // 入浴データは現在サンプルのままで
    };
    
    // スケジュールタイプに基づいてスタイルを決定
    const getScheduleStyle = (schedule) => {
        const scheduleType = scheduleTypes.find(type => type.id === schedule.schedule_type_id);
        if (scheduleType) {
            return `bg-opacity-40 text-white border-l-2`;
        }
        // フォールバック用の古いスタイリング
        return EVENT_STYLES[schedule.type] || EVENT_STYLES.general;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        
        try {
            const residentData = JSON.parse(e.dataTransfer.getData('application/json'));
            console.log('Dropped resident:', residentData, 'on date:', dateKey);
        } catch (error) {
            console.error('Invalid drop data:', error);
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
                    <div className="text-purple-300 text-[8px] text-center pb-0.5 border-b border-gray-600 font-medium">
                        予定
                    </div>
                    {dayEvents.schedules.map((event) => (
                        <div
                            key={event.id}
                            className={`text-[9px] px-1 py-0.5 rounded-sm cursor-pointer border-l-2 transition-all hover:-translate-y-px hover:brightness-110 line-clamp-2 ${EVENT_STYLES[event.type]}`}
                        >
                            {event.text}
                        </div>
                    ))}
                </div>

                {/* 入浴側 */}
                <div className="flex-1 flex flex-col gap-0.5 border-l border-gray-600 pl-1">
                    <div className="text-blue-300 text-[8px] text-center pb-0.5 border-b border-gray-600 font-medium">
                        🛁 入浴
                    </div>
                    {dayEvents.bathing.map((resident) => (
                        <div
                            key={resident.id}
                            className="text-[9px] px-1 py-0.5 rounded-sm bg-blue-900 bg-opacity-40 text-blue-300 border-l-2 border-l-blue-500 cursor-pointer transition-all hover:-translate-y-px hover:brightness-110"
                        >
                            {resident.name}
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
                        {dragOver ? 'ここにドロップ' : dayEvents.bathing.length === 0 ? 'ドロップで追加' : ''}
                    </div>
                </div>
            </div>
        </div>
    );
}