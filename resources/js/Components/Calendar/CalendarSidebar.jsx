import React from 'react';
import MiniCalendar from './MiniCalendar';
import ResidentList from './ResidentList';

export default function CalendarSidebar({ 
    currentDate, 
    selectedDate, 
    onDateSelect, 
    onMonthChange 
}) {
    return (
        <div className="w-full flex flex-col min-h-full">
            <div className="flex-shrink-0">
                <MiniCalendar 
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    onDateSelect={onDateSelect}
                    onMonthChange={onMonthChange}
                />
            </div>
            <div className="flex-1 mt-4">
                <ResidentList />
            </div>
        </div>
    );
}