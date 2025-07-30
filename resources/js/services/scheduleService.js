import api from './api';

/**
 * Schedule API Service
 * スケジュール関連のAPI通信を管理
 */
class ScheduleService {
    /**
     * 月別スケジュール取得
     * @param {number} year - 年
     * @param {number} month - 月
     * @returns {Promise} API response
     */
    async getMonthlySchedules(year, month) {
        try {
            const response = await api.get('/schedules/monthly', {
                params: { year, month }
            });
            return response.data;
        } catch (error) {
            console.error('月別スケジュール取得エラー:', error);
            throw error;
        }
    }

    /**
     * スケジュール一覧取得
     * @param {Object} filters - フィルター条件
     * @returns {Promise} API response
     */
    async getSchedules(filters = {}) {
        try {
            const response = await api.get('/schedules', {
                params: filters
            });
            return response.data;
        } catch (error) {
            console.error('スケジュール一覧取得エラー:', error);
            throw error;
        }
    }

    /**
     * スケジュール詳細取得
     * @param {number} scheduleId - スケジュールID
     * @returns {Promise} API response
     */
    async getSchedule(scheduleId) {
        try {
            const response = await api.get(`/schedules/${scheduleId}`);
            return response.data;
        } catch (error) {
            console.error('スケジュール詳細取得エラー:', error);
            throw error;
        }
    }

    /**
     * スケジュール作成
     * @param {Object} scheduleData - スケジュールデータ
     * @returns {Promise} API response
     */
    async createSchedule(scheduleData) {
        try {
            const response = await api.post('/schedules', scheduleData);
            return response.data;
        } catch (error) {
            console.error('スケジュール作成エラー:', error);
            throw error;
        }
    }

    /**
     * スケジュール更新
     * @param {number} scheduleId - スケジュールID
     * @param {Object} scheduleData - 更新データ
     * @returns {Promise} API response
     */
    async updateSchedule(scheduleId, scheduleData) {
        try {
            const response = await api.put(`/schedules/${scheduleId}`, scheduleData);
            return response.data;
        } catch (error) {
            console.error('スケジュール更新エラー:', error);
            throw error;
        }
    }

    /**
     * スケジュール削除
     * @param {number} scheduleId - スケジュールID
     * @returns {Promise} API response
     */
    async deleteSchedule(scheduleId) {
        try {
            const response = await api.delete(`/schedules/${scheduleId}`);
            return response.data;
        } catch (error) {
            console.error('スケジュール削除エラー:', error);
            throw error;
        }
    }

    /**
     * 指定日のスケジュール取得
     * @param {string} date - 日付 (YYYY-MM-DD形式)
     * @returns {Promise} API response
     */
    async getSchedulesByDate(date) {
        try {
            const response = await api.get('/schedules', {
                params: { date }
            });
            return response.data;
        } catch (error) {
            console.error('日別スケジュール取得エラー:', error);
            throw error;
        }
    }

    /**
     * 期間指定スケジュール取得
     * @param {string} startDate - 開始日 (YYYY-MM-DD形式)
     * @param {string} endDate - 終了日 (YYYY-MM-DD形式)
     * @returns {Promise} API response
     */
    async getSchedulesByDateRange(startDate, endDate) {
        try {
            const response = await api.get('/schedules', {
                params: { 
                    start_date: startDate,
                    end_date: endDate
                }
            });
            return response.data;
        } catch (error) {
            console.error('期間指定スケジュール取得エラー:', error);
            throw error;
        }
    }
}

// シングルトンインスタンスをエクスポート
export default new ScheduleService();