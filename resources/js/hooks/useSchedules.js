import { useState, useEffect, useCallback, useRef } from 'react';
import scheduleService from '../services/scheduleService';

/**
 * 一意な一時IDを生成する関数
 * @returns {string} 衝突を回避した一時ID
 */
const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 11);
    const performanceTime = performance.now().toString().replace('.', '');
    const counter = Math.floor(Math.random() * 1000);
    return `temp_${timestamp}_${randomStr}_${performanceTime}_${counter}`;
};

/**
 * スケジュール管理用カスタムフック
 * @param {Object} options - オプション設定
 * @returns {Object} スケジュール状態と操作関数
 */
export const useSchedules = (options = {}) => {
    const { 
        autoFetch = false,
        initialYear = new Date().getFullYear(),
        initialMonth = new Date().getMonth() + 1
    } = options;

    const [schedules, setSchedules] = useState([]);
    const [monthlyCalendarData, setMonthlyCalendarData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentYear, setCurrentYear] = useState(initialYear);
    const [currentMonth, setCurrentMonth] = useState(initialMonth);
    const [lastFetchedRange, setLastFetchedRange] = useState(null);
    const [loadingTimeout, setLoadingTimeout] = useState(null);
    
    // 無限ループを防ぐためのref
    const loadingRef = useRef(loading);
    const monthlyCalendarDataRef = useRef(monthlyCalendarData);
    const lastFetchedRangeRef = useRef(lastFetchedRange);
    
    // refを最新の値に同期
    useEffect(() => {
        loadingRef.current = loading;
        monthlyCalendarDataRef.current = monthlyCalendarData;
        lastFetchedRangeRef.current = lastFetchedRange;
    }, [loading, monthlyCalendarData, lastFetchedRange]);

    /**
     * エラーハンドリング
     */
    const handleError = useCallback((error) => {
        console.error('Schedule operation error:', error);
        setError(error.response?.data?.message || 'エラーが発生しました');
    }, []);

    /**
     * スマートローディング制御 - 短時間の処理ではローディングを表示しない
     */
    const setSmartLoading = useCallback((isLoading) => {
        if (isLoading) {
            // 200ms後にローディングを表示
            const timeout = setTimeout(() => {
                setLoading(true);
                setLoadingTimeout(null);
            }, 200);
            setLoadingTimeout(timeout);
        } else {
            // ローディング停止
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                setLoadingTimeout(null);
            }
            setLoading(false);
        }
    }, [loadingTimeout]);

    /**
     * 月別スケジュールデータ取得
     */
    const fetchMonthlySchedules = useCallback(async (year = currentYear, month = currentMonth) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleService.getMonthlySchedules(year, month);
            setMonthlyCalendarData(response.data || []);
            setCurrentYear(year);
            setCurrentMonth(month);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    /**
     * スケジュール一覧取得
     */
    const fetchSchedules = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleService.getSchedules(filters);
            setSchedules(response.data || []);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    /**
     * スケジュール作成（楽観的更新対応）
     */
    const createSchedule = useCallback(async (scheduleData, refreshCallback) => {
        setError(null);
        
        // 楽観的更新: 仮IDでスケジュールを即座に追加
        // 衝突を回避した一意なIDを生成
        const tempId = generateUniqueId();
        const optimisticSchedule = { ...scheduleData, id: tempId };
        
        const optimisticUpdate = () => {
            setMonthlyCalendarData(prevData => {
                const targetDate = scheduleData.date;
                const existingDay = prevData.find(dayData => dayData.date === targetDate);
                
                if (existingDay) {
                    // 既存の日にスケジュールを追加
                    return prevData.map(dayData => 
                        dayData.date === targetDate 
                            ? { ...dayData, schedules: [...dayData.schedules, optimisticSchedule] }
                            : dayData
                    );
                } else {
                    // 新しい日のデータを作成
                    return [...prevData, { date: targetDate, schedules: [optimisticSchedule] }];
                }
            });
        };
        
        // 楽観的更新を実行
        optimisticUpdate();
        
        try {
            setSmartLoading(true);
            const response = await scheduleService.createSchedule(scheduleData);
            
            // データが変更されたためキャッシュをリセット
            setLastFetchedRange(null);
            
            // カスタムリフレッシュコールバックがあれば使用、なければ月別データを再取得
            if (refreshCallback) {
                await refreshCallback();
            } else {
                await fetchMonthlySchedules();
            }
            
            return response;
        } catch (error) {
            // エラー時は楽観的更新を元に戻す
            setMonthlyCalendarData(prevData => {
                return prevData.map(dayData => ({
                    ...dayData,
                    schedules: dayData.schedules.filter(schedule => schedule.id !== tempId)
                }));
            });
            handleError(error);
            throw error;
        } finally {
            setSmartLoading(false);
        }
    }, [fetchMonthlySchedules, handleError, setSmartLoading]);

    /**
     * スケジュール更新（楽観的更新対応）
     */
    const updateSchedule = useCallback(async (scheduleId, scheduleData, refreshCallback) => {
        setError(null);
        
        // 楽観的更新: 即座に状態を更新
        const optimisticUpdate = () => {
            setMonthlyCalendarData(prevData => {
                return prevData.map(dayData => ({
                    ...dayData,
                    schedules: dayData.schedules.map(schedule => 
                        schedule.id === scheduleId 
                            ? { ...schedule, ...scheduleData }
                            : schedule
                    )
                }));
            });
        };
        
        // 楽観的更新を実行
        optimisticUpdate();
        
        try {
            setSmartLoading(true);
            const response = await scheduleService.updateSchedule(scheduleId, scheduleData);
            
            // データが変更されたためキャッシュをリセット
            setLastFetchedRange(null);
            
            // カスタムリフレッシュコールバックがあれば使用、なければ月別データを再取得
            if (refreshCallback) {
                await refreshCallback();
            } else {
                await fetchMonthlySchedules();
            }
            
            return response;
        } catch (error) {
            // エラー時は楽観的更新を元に戻すためにデータを再取得
            if (refreshCallback) {
                await refreshCallback();
            } else {
                await fetchMonthlySchedules();
            }
            handleError(error);
            throw error;
        } finally {
            setSmartLoading(false);
        }
    }, [fetchMonthlySchedules, handleError, setSmartLoading]);

    /**
     * スケジュール削除（楽観的更新対応）
     */
    const deleteSchedule = useCallback(async (scheduleId, refreshCallback) => {
        setError(null);
        
        // 楽観的更新: 即座にスケジュールを削除
        let deletedSchedule = null;
        const optimisticUpdate = () => {
            setMonthlyCalendarData(prevData => {
                return prevData.map(dayData => {
                    const scheduleToDelete = dayData.schedules.find(s => s.id === scheduleId);
                    if (scheduleToDelete) {
                        deletedSchedule = scheduleToDelete;
                    }
                    return {
                        ...dayData,
                        schedules: dayData.schedules.filter(schedule => schedule.id !== scheduleId)
                    };
                });
            });
        };
        
        // 楽観的更新を実行
        optimisticUpdate();
        
        try {
            setSmartLoading(true);
            const response = await scheduleService.deleteSchedule(scheduleId);
            
            // データが変更されたためキャッシュをリセット
            setLastFetchedRange(null);
            
            // カスタムリフレッシュコールバックがあれば使用、なければ月別データを再取得
            if (refreshCallback) {
                await refreshCallback();
            } else {
                await fetchMonthlySchedules();
            }
            
            return response;
        } catch (error) {
            // エラー時は楽観的更新を元に戻す
            if (deletedSchedule) {
                setMonthlyCalendarData(prevData => {
                    return prevData.map(dayData => 
                        dayData.date === deletedSchedule.date 
                            ? { ...dayData, schedules: [...dayData.schedules, deletedSchedule] }
                            : dayData
                    );
                });
            }
            handleError(error);
            throw error;
        } finally {
            setSmartLoading(false);
        }
    }, [fetchMonthlySchedules, handleError, setSmartLoading]);

    /**
     * 指定日のスケジュール取得
     */
    const getSchedulesByDate = useCallback(async (date) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleService.getSchedulesByDate(date);
            return response.data || [];
        } catch (error) {
            handleError(error);
            return [];
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    /**
     * 期間指定スケジュール取得（カレンダー表示用）
     */
    const fetchSchedulesByDateRange = useCallback(async (startDate, endDate, forceRefresh = false) => {
        // refから最新の値を取得
        const currentLoading = loadingRef.current;
        const currentMonthlyCalendarData = monthlyCalendarDataRef.current;
        const currentLastFetchedRange = lastFetchedRangeRef.current;
        
        // ローディング中は重複リクエストを防ぐ
        if (currentLoading) {
            return currentMonthlyCalendarData;
        }
        
        // 同じ期間での重複取得を防ぐ（強制更新が指定されていない場合のみ）
        const rangeKey = `${startDate}-${endDate}`;
        if (!forceRefresh && currentLastFetchedRange === rangeKey && currentMonthlyCalendarData.length > 0) {
            return currentMonthlyCalendarData;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleService.getSchedulesByDateRange(startDate, endDate);
            
            // 日付別にグループ化してmonthlyCalendarDataの形式に変換
            const schedulesByDate = {};
            (response.data || []).forEach(schedule => {
                const dateKey = schedule.date || schedule.calendar_date?.calendar_date;
                if (dateKey) {
                    if (!schedulesByDate[dateKey]) {
                        schedulesByDate[dateKey] = [];
                    }
                    schedulesByDate[dateKey].push(schedule);
                }
            });
            
            // monthlyCalendarDataの形式に変換
            const calendarData = Object.keys(schedulesByDate).map(date => ({
                date,
                schedules: schedulesByDate[date]
            }));
            
            setMonthlyCalendarData(calendarData);
            setLastFetchedRange(rangeKey);
            
            return calendarData;
        } catch (error) {
            handleError(error);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * 月変更
     */
    const changeMonth = useCallback((year, month) => {
        fetchMonthlySchedules(year, month);
    }, [fetchMonthlySchedules]);

    /**
     * 初期データ取得
     */
    useEffect(() => {
        if (autoFetch) {
            fetchMonthlySchedules();
        }
    }, [autoFetch, fetchMonthlySchedules]);

    return {
        // State
        schedules,
        monthlyCalendarData,
        loading,
        error,
        currentYear,
        currentMonth,
        
        // Actions
        fetchMonthlySchedules,
        fetchSchedules,
        fetchSchedulesByDateRange,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        getSchedulesByDate,
        changeMonth,
        
        // Utils
        setError: (error) => setError(error),
        clearError: () => setError(null)
    };
};