import { useState, useEffect, useCallback } from 'react';
import scheduleService from '../services/scheduleService';

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

    /**
     * エラーハンドリング
     */
    const handleError = useCallback((error) => {
        console.error('Schedule operation error:', error);
        setError(error.response?.data?.message || 'エラーが発生しました');
    }, []);

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
     * スケジュール作成
     */
    const createSchedule = useCallback(async (scheduleData) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleService.createSchedule(scheduleData);
            
            // 成功時は月別データを再取得
            await fetchMonthlySchedules();
            
            return response;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchMonthlySchedules, handleError]);

    /**
     * スケジュール更新
     */
    const updateSchedule = useCallback(async (scheduleId, scheduleData) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleService.updateSchedule(scheduleId, scheduleData);
            
            // 成功時は月別データを再取得
            await fetchMonthlySchedules();
            
            return response;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchMonthlySchedules, handleError]);

    /**
     * スケジュール削除
     */
    const deleteSchedule = useCallback(async (scheduleId) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleService.deleteSchedule(scheduleId);
            
            // 成功時は月別データを再取得
            await fetchMonthlySchedules();
            
            return response;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchMonthlySchedules, handleError]);

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