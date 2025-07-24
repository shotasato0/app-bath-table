import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function MiniCalendar({ 
    currentDate, 
    selectedDate, 
    onDateSelect, 
    onMonthChange 
}) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    });

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        onMonthChange(newDate);
    };

    return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
                <button 
                    onClick={() => navigateMonth(-1)}
                    className="p-1 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                >
                    ←
                </button>
                <span className="text-sm font-medium text-gray-100">
                    {format(currentDate, 'yyyy年M月', { locale: ja })}
                </span>
                <button 
                    onClick={() => navigateMonth(1)}
                    className="p-1 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                >
                    →
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {/* 曜日ヘッダー */}
                {['日', '月', '火', '水', '木', '金', '土'].map((weekday, index) => (
                    <div 
                        key={weekday}
                        className={`p-1 ${
                            index === 0 ? 'text-red-400' : 
                            index === 6 ? 'text-blue-400' : 
                            'text-gray-400'
                        }`}
                    >
                        {weekday}
                    </div>
                ))}
                
                {/* 日付グリッド */}
                {calendarDays.map((day) => (
                    <button
                        key={day.toISOString()}
                        onClick={() => onDateSelect(day)}
                        className={`p-1 rounded-sm text-xs cursor-pointer transition-colors ${
                            isToday(day) 
                                ? 'bg-blue-600 text-white' 
                                : isSameDay(day, selectedDate)
                                ? 'bg-gray-600 text-white'
                                : isSameMonth(day, currentDate)
                                ? 'text-gray-200 hover:bg-gray-700'
                                : 'text-gray-500 hover:bg-gray-700'
                        }`}
                    >
                        {format(day, 'd')}
                    </button>
                ))}
            </div>
        </div>
    );
}