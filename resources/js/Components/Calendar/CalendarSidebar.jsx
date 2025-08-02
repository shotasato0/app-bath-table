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
        <div className="w-60 flex-shrink-0 flex flex-col h-full">
            <MiniCalendar 
                currentDate={currentDate}
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
                onMonthChange={onMonthChange}
            />
            <div className="flex-1 mt-4">
                <ResidentList />
            </div>
        </div>
    );
}