import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import CalendarHeader from './CalendarHeader';
import CalendarSidebar from './CalendarSidebar';
import CalendarGrid from './CalendarGrid';
import { useSchedules } from '../../hooks/useSchedules';
import { useScheduleTypes } from '../../hooks/useScheduleTypes';

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // API連携フック
    const {
        monthlyCalendarData,
        loading: schedulesLoading,
        error: schedulesError,
        fetchMonthlySchedules,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        currentYear,
        currentMonth
    } = useSchedules({ autoFetch: true });
    
    const {
        scheduleTypes,
        loading: typesLoading,
        error: typesError
    } = useScheduleTypes();

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
        
        // API連携：月が変わったらスケジュールデータを取得
        const year = newDate.getFullYear();
        const month = newDate.getMonth() + 1;
        fetchMonthlySchedules(year, month);
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
        
        // API連携：今日に戻る時もスケジュールデータを取得
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        fetchMonthlySchedules(year, month);
    };

    // 初期データ取得: currentDateが変更されたときにAPI呼び出し
    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        // 現在表示中の月と異なる場合のみ取得
        if (year !== currentYear || month !== currentMonth) {
            fetchMonthlySchedules(year, month);
        }
    }, [currentDate, currentYear, currentMonth, fetchMonthlySchedules]);

    // ローディング状態の表示
    if (schedulesLoading || typesLoading) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="text-white text-lg">読み込み中...</div>
            </div>
        );
    }

    // エラー状態の表示
    if (schedulesError || typesError) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="text-red-400 text-lg">
                    エラーが発生しました: {schedulesError || typesError}
                </div>
            </div>
        );
    }

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
                            monthlyCalendarData={monthlyCalendarData}
                        />
                    </div>
                    <div className="flex-1">
                        <CalendarGrid 
                            calendarDays={calendarDays}
                            currentDate={currentDate}
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            monthlyCalendarData={monthlyCalendarData}
                            scheduleTypes={scheduleTypes}
                            onCreateSchedule={createSchedule}
                            onUpdateSchedule={updateSchedule}
                            onDeleteSchedule={deleteSchedule}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}