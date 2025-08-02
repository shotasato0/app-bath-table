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
    const currentDateRef = useRef(currentDate);
    
    // refを最新の値に同期
    useEffect(() => {
        currentDateRef.current = currentDate;
    }, [currentDate]);
    
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
            onConfirm: async () => {
                try {
                    await onConfirm();
                } finally {
                    setConfirmDialog(null);
                }
            },
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
    const refreshCalendarData = useCallback(async () => {
        const currentDateValue = currentDateRef.current;
        const monthStart = startOfMonth(currentDateValue);
        const monthEnd = endOfMonth(currentDateValue);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
        
        const startDate = format(calendarStart, 'yyyy-MM-dd');
        const endDate = format(calendarEnd, 'yyyy-MM-dd');
        
        return await fetchSchedulesByDateRange(startDate, endDate, true); // 強制更新フラグを追加
    }, []);

    // 初期データ取得とcurrentDate変更時のデータ取得
    useEffect(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
        
        const startDate = format(calendarStart, 'yyyy-MM-dd');
        const endDate = format(calendarEnd, 'yyyy-MM-dd');
        
        fetchSchedulesByDateRange(startDate, endDate);
    }, [currentDate]);

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
                <div className="flex gap-3 h-[calc(100vh-100px)]">
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
            
            {/* 確認ダイアログ */}
            {confirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
                        <div className="text-gray-900 mb-4">
                            {confirmDialog.message}
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={confirmDialog.onCancel}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={confirmDialog.onConfirm}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                削除
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Toast通知 */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-sm transform transition-all duration-300 ease-in-out ${
                            notification.type === 'success' 
                                ? 'bg-green-600' 
                                : notification.type === 'error'
                                ? 'bg-red-600'
                                : notification.type === 'warning'
                                ? 'bg-yellow-600'
                                : 'bg-blue-600'
                        } animate-slide-in`}
                    >
                        <div className="flex items-center gap-2">
                            {notification.type === 'success' && (
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                            {notification.type === 'error' && (
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            {notification.type === 'warning' && (
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            )}
                            <span className="break-words flex-1">{notification.message}</span>
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="ml-2 text-white hover:text-gray-200 focus:outline-none focus:text-gray-200 transition-colors"
                                aria-label="通知を閉じる"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}