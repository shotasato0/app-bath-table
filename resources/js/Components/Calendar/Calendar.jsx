import React, { useState } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import CalendarHeader from './CalendarHeader';
import CalendarSidebar from './CalendarSidebar';
import CalendarGrid from './CalendarGrid';

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

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
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    return (
        <div className="bg-gray-900">
            <CalendarHeader 
                currentDate={currentDate}
                onPreviousMonth={() => navigateMonth(-1)}
                onNextMonth={() => navigateMonth(1)}
                onToday={goToToday}
            />
            <div className="container max-w-full mx-auto p-2">
                <div className="flex gap-3">
                    <div className="hidden md:block">
                        <CalendarSidebar 
                            currentDate={currentDate}
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            onMonthChange={setCurrentDate}
                        />
                    </div>
                    <div className="flex-1">
                        <CalendarGrid 
                            calendarDays={calendarDays}
                            currentDate={currentDate}
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}