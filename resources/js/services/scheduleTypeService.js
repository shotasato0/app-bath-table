import api from './api';

/**
 * Schedule Type API Service
 * スケジュールタイプ関連のAPI通信を管理
 */
class ScheduleTypeService {
    /**
     * スケジュールタイプ一覧取得
     * @returns {Promise} API response
     */
    async getScheduleTypes() {
        try {
            const response = await api.get('/schedule-types');
            return response.data;
        } catch (error) {
            console.error('スケジュールタイプ一覧取得エラー:', error);
            throw error;
        }
    }

    /**
     * スケジュールタイプ詳細取得
     * @param {number} typeId - スケジュールタイプID
     * @returns {Promise} API response
     */
    async getScheduleType(typeId) {
        try {
            const response = await api.get(`/schedule-types/${typeId}`);
            return response.data;
        } catch (error) {
            console.error('スケジュールタイプ詳細取得エラー:', error);
            throw error;
        }
    }

    /**
     * スケジュールタイプ作成
     * @param {Object} typeData - スケジュールタイプデータ
     * @returns {Promise} API response
     */
    async createScheduleType(typeData) {
        try {
            const response = await api.post('/schedule-types', typeData);
            return response.data;
        } catch (error) {
            console.error('スケジュールタイプ作成エラー:', error);
            throw error;
        }
    }

    /**
     * スケジュールタイプ更新
     * @param {number} typeId - スケジュールタイプID
     * @param {Object} typeData - 更新データ
     * @returns {Promise} API response
     */
    async updateScheduleType(typeId, typeData) {
        try {
            const response = await api.put(`/schedule-types/${typeId}`, typeData);
            return response.data;
        } catch (error) {
            console.error('スケジュールタイプ更新エラー:', error);
            throw error;
        }
    }

    /**
     * スケジュールタイプ削除
     * @param {number} typeId - スケジュールタイプID
     * @returns {Promise} API response
     */
    async deleteScheduleType(typeId) {
        try {
            const response = await api.delete(`/schedule-types/${typeId}`);
            return response.data;
        } catch (error) {
            console.error('スケジュールタイプ削除エラー:', error);
            throw error;
        }
    }
}

// シングルトンインスタンスをエクスポート
export default new ScheduleTypeService();