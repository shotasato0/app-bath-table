import { useState, useEffect, useCallback } from 'react';
import scheduleTypeService from '../services/scheduleTypeService';

/**
 * スケジュールタイプ管理用カスタムフック
 * @param {Object} options - オプション設定
 * @returns {Object} スケジュールタイプ状態と操作関数
 */
export const useScheduleTypes = (options = {}) => {
    const { autoFetch = true } = options;

    const [scheduleTypes, setScheduleTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * エラーハンドリング
     */
    const handleError = useCallback((error) => {
        console.error('Schedule type operation error:', error);
        setError(error.response?.data?.message || 'エラーが発生しました');
    }, []);

    /**
     * スケジュールタイプ一覧取得
     */
    const fetchScheduleTypes = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleTypeService.getScheduleTypes();
            setScheduleTypes(response.data || []);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    /**
     * スケジュールタイプ作成
     */
    const createScheduleType = useCallback(async (typeData) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleTypeService.createScheduleType(typeData);
            
            // 成功時は一覧を再取得
            await fetchScheduleTypes();
            
            return response;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchScheduleTypes, handleError]);

    /**
     * スケジュールタイプ更新
     */
    const updateScheduleType = useCallback(async (typeId, typeData) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleTypeService.updateScheduleType(typeId, typeData);
            
            // 成功時は一覧を再取得
            await fetchScheduleTypes();
            
            return response;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchScheduleTypes, handleError]);

    /**
     * スケジュールタイプ削除
     */
    const deleteScheduleType = useCallback(async (typeId) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await scheduleTypeService.deleteScheduleType(typeId);
            
            // 成功時は一覧を再取得
            await fetchScheduleTypes();
            
            return response;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchScheduleTypes, handleError]);

    /**
     * IDでスケジュールタイプを取得
     */
    const getScheduleTypeById = useCallback((typeId) => {
        return scheduleTypes.find(type => type.id === typeId);
    }, [scheduleTypes]);

    /**
     * 名前でスケジュールタイプを取得
     */
    const getScheduleTypeByName = useCallback((typeName) => {
        return scheduleTypes.find(type => type.type_name === typeName);
    }, [scheduleTypes]);

    /**
     * 初期データ取得
     */
    useEffect(() => {
        if (autoFetch) {
            fetchScheduleTypes();
        }
    }, [autoFetch, fetchScheduleTypes]);

    return {
        // State
        scheduleTypes,
        loading,
        error,
        
        // Actions
        fetchScheduleTypes,
        createScheduleType,
        updateScheduleType,
        deleteScheduleType,
        
        // Utils
        getScheduleTypeById,
        getScheduleTypeByName,
        setError: (error) => setError(error),
        clearError: () => setError(null)
    };
};