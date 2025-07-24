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
        <div className="w-60 flex-shrink-0">
            <MiniCalendar 
                currentDate={currentDate}
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
                onMonthChange={onMonthChange}
            />
            <ResidentList />
        </div>
    );
}