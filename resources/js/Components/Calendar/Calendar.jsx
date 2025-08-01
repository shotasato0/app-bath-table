import React, { useState, useEffect, useCallback, useRef } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { router } from '@inertiajs/react';
import CalendarHeader from './CalendarHeader';
import CalendarSidebar from './CalendarSidebar';
import CalendarGrid from './CalendarGrid';
import { useSchedules } from '../../hooks/useSchedules';
import { useScheduleTypes } from '../../hooks/useScheduleTypes';

export default function Calendar() {
    // URLパラメータから初期日付を取得
    const getInitialDate = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const year = urlParams.get('year');
        const month = urlParams.get('month');
        
        if (year && month) {
            const date = new Date(parseInt(year), parseInt(month) - 1);
            // 有効な日付かチェック
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        return new Date();
    };

    const [currentDate, setCurrentDate] = useState(getInitialDate);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [notifications, setNotifications] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const notificationTimeouts = useRef(new Map());
    
    // 通知システム（メモリリーク対策付き）
    const showNotification = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        const notification = { id, message, type };
        
        setNotifications(prev => [...prev, notification]);
        
        const timeoutId = setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
            notificationTimeouts.current.delete(id);
        }, type === 'error' ? 5000 : 3000);
        
        notificationTimeouts.current.set(id, timeoutId);
    }, []);
    
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        const timeoutId = notificationTimeouts.current.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            notificationTimeouts.current.delete(id);
        }
    }, []);
    
    // 確認ダイアログ表示
    const showConfirmDialog = useCallback((message, onConfirm) => {
        setConfirmDialog({
            message,
            onConfirm,
            onCancel: () => setConfirmDialog(null)
        });
    }, []);
    
    // コンポーネントアンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            // 全ての通知タイマーをクリアしてメモリリークを防止
            notificationTimeouts.current.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            notificationTimeouts.current.clear();
        };
    }, []);
    
    const {
        monthlyCalendarData,
        loading: schedulesLoading,
        error: schedulesError,
        fetchMonthlySchedules,
        fetchSchedulesByDateRange,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        currentYear,
        currentMonth
    } = useSchedules({ 
        autoFetch: false, // 手動でfetchするため無効化
        initialYear: currentDate.getFullYear(),
        initialMonth: currentDate.getMonth() + 1
    });
    
    const {
        scheduleTypes,
        loading: typesLoading,
        error: typesError
    } = useScheduleTypes();

    // ブラウザのバック・フォワード機能に対応
    useEffect(() => {
        const handlePopState = () => {
            const newDate = getInitialDate();
            setCurrentDate(newDate);
            
            // データを再取得
            if (fetchMonthlySchedules) {
                fetchMonthlySchedules(newDate.getFullYear(), newDate.getMonth() + 1);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [fetchMonthlySchedules]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    });

    // カレンダー表示範囲のスケジュールデータを取得
    const refreshCalendarData = useCallback(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
        
        const startDate = format(calendarStart, 'yyyy-MM-dd');
        const endDate = format(calendarEnd, 'yyyy-MM-dd');
        
        return fetchSchedulesByDateRange(startDate, endDate);
    }, [currentDate, fetchSchedulesByDateRange]);

    useEffect(() => {
        refreshCalendarData();
    }, [refreshCalendarData]);

    // URLを更新する関数
    const updateURL = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        router.get('/calendar', 
            { year, month }, 
            { 
                preserveState: true,
                preserveScroll: true,
                replace: true
            }
        );
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
        
        // URLを更新
        updateURL(newDate);
        
        // 月が変更される際はuseEffectでfetchCalendarDataが自動実行される
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
        
        // URLを更新
        updateURL(today);
        
        // 今日のデータを取得
        if (fetchMonthlySchedules) {
            fetchMonthlySchedules(today.getFullYear(), today.getMonth() + 1);
        }
    };

    // カレンダー表示データと同期したスケジュール操作を行うラッパー関数
    const handleCreateSchedule = useCallback(async (scheduleData) => {
        return await createSchedule(scheduleData, refreshCalendarData);
    }, [createSchedule, refreshCalendarData]);

    const handleUpdateSchedule = useCallback(async (scheduleId, scheduleData) => {
        return await updateSchedule(scheduleId, scheduleData, refreshCalendarData);
    }, [updateSchedule, refreshCalendarData]);

    const handleDeleteSchedule = useCallback(async (scheduleId) => {
        return await deleteSchedule(scheduleId, refreshCalendarData);
    }, [deleteSchedule, refreshCalendarData]);

    return (
        <div className="bg-gray-900">
            <CalendarHeader 
                currentDate={currentDate}
                onPreviousMonth={() => navigateMonth(-1)}
                onNextMonth={() => navigateMonth(1)}
                onToday={goToToday}
            />
            
            {/* エラー表示 */}
            {(schedulesError || typesError) && (
                <div className="mx-auto max-w-full p-2">
                    <div className="bg-red-900 bg-opacity-20 border border-red-600 text-red-300 px-4 py-2 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">データの読み込みに失敗しました:</span>
                        </div>
                        <div className="mt-1 text-sm">
                            {schedulesError && <div>• スケジュール: {schedulesError}</div>}
                            {typesError && <div>• スケジュールタイプ: {typesError}</div>}
                        </div>
                    </div>
                </div>
            )}
            
            {/* ローディングオーバーレイ */}
            {(schedulesLoading || typesLoading) && (
                <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40 pointer-events-none loading-overlay">
                    <div className="bg-blue-900 bg-opacity-90 border border-blue-600 text-blue-300 px-6 py-3 rounded-lg shadow-lg animate-fade-in">
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            データを読み込み中...
                        </div>
                    </div>
                </div>
            )}
            
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
                            monthlyCalendarData={monthlyCalendarData}
                            scheduleTypes={scheduleTypes}
                            createSchedule={handleCreateSchedule}
                            updateSchedule={handleUpdateSchedule}
                            deleteSchedule={handleDeleteSchedule}
                            loading={schedulesLoading || typesLoading}
                            error={schedulesError || typesError}
                            showNotification={showNotification}
                            showConfirmDialog={showConfirmDialog}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}