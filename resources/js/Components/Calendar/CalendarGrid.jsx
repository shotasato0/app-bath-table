import React, { memo } from 'react';
import { isSameMonth, isToday, format } from 'date-fns';
import CalendarDay from './CalendarDay';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const CalendarGrid = memo(function CalendarGrid({ 
    calendarDays, 
    currentDate, 
    selectedDate, 
    onDateSelect,
    monthlyCalendarData = [],
    scheduleTypes = [],
    createSchedule,
    updateSchedule,
    deleteSchedule,
    loading = false,
    error = null,
    showNotification,
    showConfirmDialog
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
                {calendarDays.map((day, index) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayData = monthlyCalendarData.find(data => data.date === dateKey);
                    
                    return (
                        <CalendarDay
                            key={format(day, 'yyyy-MM-dd')}
                            date={day}
                            isCurrentMonth={isSameMonth(day, currentDate)}
                            isToday={isToday(day)}
                            isSelected={day.toDateString() === selectedDate.toDateString()}
                            onClick={() => onDateSelect(day)}
                            dayIndex={index}
                            schedules={dayData?.schedules || []}
                            scheduleTypes={scheduleTypes}
                            createSchedule={createSchedule}
                            updateSchedule={updateSchedule}
                            deleteSchedule={deleteSchedule}
                            loading={loading}
                            error={error}
                        />
                    );
                })}
            </div>
        </div>
    );
});

export default CalendarGrid;