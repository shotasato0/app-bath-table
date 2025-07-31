import { useState, useEffect, useCallback } from 'react';
import residentService from '../services/residentService';

/**
 * 利用者管理用カスタムフック
 * @param {Object} options - オプション設定
 * @returns {Object} 利用者状態と操作関数
 */
export const useResidents = (options = {}) => {
    const { 
        autoFetch = false,
        searchQuery = ''
    } = options;

    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * エラーハンドリング
     */
    const handleError = useCallback((error) => {
        console.error('Resident operation error:', error);
        setError(error.response?.data?.message || 'エラーが発生しました');
    }, []);

    /**
     * 利用者一覧取得
     */
    const fetchResidents = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await residentService.getResidents(filters);
            setResidents(response.data || []);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    /**
     * 利用者作成
     */
    const createResident = useCallback(async (residentData) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await residentService.createResident(residentData);
            
            // 成功時は新しい利用者を状態に追加
            setResidents((prevResidents) => [...prevResidents, response.data]);
            
            return response;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchResidents, handleError]);

    /**
     * 利用者更新
     */
    const updateResident = useCallback(async (residentId, residentData) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await residentService.updateResident(residentId, residentData);
            
            // 成功時は該当する利用者を状態で更新
            setResidents((prevResidents) => 
                prevResidents.map((resident) => 
                    resident.id === residentId ? { ...resident, ...response.data } : resident
                )
            );
            
            return response;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchResidents, handleError]);

    /**
     * 利用者削除
     */
    const deleteResident = useCallback(async (residentId) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await residentService.deleteResident(residentId);
            
            // 成功時は該当する利用者を状態から削除
            setResidents((prevResidents) => 
                prevResidents.filter((resident) => resident.id !== residentId)
            );
            
            return response;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchResidents, handleError]);

    /**
     * 利用者詳細取得
     */
    const getResident = useCallback(async (residentId) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await residentService.getResident(residentId);
            return response.data;
        } catch (error) {
            handleError(error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    /**
     * 利用者検索
     */
    const searchResidents = useCallback(async (query) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await residentService.searchResidents(query);
            setResidents(response.data || []);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    /**
     * 初期データ取得
     */
    useEffect(() => {
        if (autoFetch) {
            fetchResidents();
        }
    }, [autoFetch, fetchResidents]);

    /**
     * 検索クエリでの自動検索
     */
    useEffect(() => {
        if (searchQuery) {
            searchResidents(searchQuery);
        } else if (autoFetch) {
            fetchResidents();
        }
    }, [searchQuery, searchResidents, fetchResidents, autoFetch]);

    return {
        // State
        residents,
        loading,
        error,
        
        // Actions
        fetchResidents,
        createResident,
        updateResident,
        deleteResident,
        getResident,
        searchResidents,
        
        // Utils
        setError: (error) => setError(error),
        clearError: () => setError(null)
    };
};