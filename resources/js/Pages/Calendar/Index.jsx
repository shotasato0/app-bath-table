import React from 'react';
import CalendarLayout from '@/Components/Calendar/CalendarLayout';

export default function Index({ auth, schedules, residents, currentDate }) {
    return (
        <CalendarLayout
            auth={auth}
            schedules={schedules}
            residents={residents}
            currentDate={currentDate}
        />
    );
}