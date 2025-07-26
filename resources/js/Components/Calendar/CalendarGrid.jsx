import React from 'react';
import { isSameMonth, isToday } from 'date-fns';
import CalendarDay from './CalendarDay';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function CalendarGrid({ 
    calendarDays, 
    currentDate, 
    selectedDate, 
    onDateSelect 
}) {
    return (
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
            {/* 曜日ヘッダー */}
            <div className="flex w-full border-b border-gray-600">
                {WEEKDAYS.map((weekday, index) => (
                    <div 
                        key={weekday}
                        className={`flex-1 p-4 text-center font-medium text-sm border-r border-gray-600 last:border-r-0 ${
                            index === 0 ? 'text-red-400' : 
                            index === 6 ? 'text-blue-400' : 
                            'text-gray-300'
                        }`}
                    >
                        {weekday}
                    </div>
                ))}
            </div>
            
            {/* カレンダーグリッド */}
            <div className="flex flex-wrap w-full">
                {calendarDays.map((day, index) => (
                    <CalendarDay
                        key={day.toISOString()}
                        date={day}
                        isCurrentMonth={isSameMonth(day, currentDate)}
                        isToday={isToday(day)}
                        isSelected={day.toDateString() === selectedDate.toDateString()}
                        onClick={() => onDateSelect(day)}
                        dayIndex={index}
                    />
                ))}
            </div>
        </div>
    );
}