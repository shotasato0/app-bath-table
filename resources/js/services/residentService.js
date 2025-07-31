import api from './api';

/**
 * Resident API Service
 * 利用者関連のAPI通信を管理
 */
class ResidentService {
    /**
     * 利用者一覧取得
     * @param {Object} filters - フィルター条件
     * @returns {Promise} API response
     */
    async getResidents(filters = {}) {
        try {
            const response = await api.get('/residents', {
                params: filters
            });
            return response.data;
        } catch (error) {
            console.error('利用者一覧取得エラー:', error);
            throw error;
        }
    }

    /**
     * 利用者詳細取得
     * @param {number} id - 利用者ID
     * @returns {Promise} API response
     */
    async getResident(id) {
        try {
            const response = await api.get(`/residents/${id}`);
            return response.data;
        } catch (error) {
            console.error('利用者詳細取得エラー:', error);
            throw error;
        }
    }

    /**
     * 利用者作成
     * @param {Object} residentData - 利用者データ
     * @returns {Promise} API response
     */
    async createResident(residentData) {
        try {
            const response = await api.post('/residents', residentData);
            return response.data;
        } catch (error) {
            console.error('利用者作成エラー:', error);
            throw error;
        }
    }

    /**
     * 利用者更新
     * @param {number} id - 利用者ID
     * @param {Object} residentData - 更新データ
     * @returns {Promise} API response
     */
    async updateResident(id, residentData) {
        try {
            const response = await api.put(`/residents/${id}`, residentData);
            return response.data;
        } catch (error) {
            console.error('利用者更新エラー:', error);
            throw error;
        }
    }

    /**
     * 利用者削除
     * @param {number} id - 利用者ID
     * @returns {Promise} API response
     */
    async deleteResident(id) {
        try {
            const response = await api.delete(`/residents/${id}`);
            return response.data;
        } catch (error) {
            console.error('利用者削除エラー:', error);
            throw error;
        }
    }

    /**
     * 利用者検索
     * @param {string} query - 検索クエリ
     * @returns {Promise} API response
     */
    async searchResidents(query) {
        try {
            const response = await api.get('/residents', {
                params: { search: query }
            });
            return response.data;
        } catch (error) {
            console.error('利用者検索エラー:', error);
            throw error;
        }
    }
}

// シングルトンインスタンスをエクスポート
const residentService = new ResidentService();
export default residentService;