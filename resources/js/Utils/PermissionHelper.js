import { usePage } from "@inertiajs/react";

// 権限管理ヘルパー関数
export class PermissionHelper {
    // 権限階層定義
    static ROLE_HIERARCHY = {
        admin: 100,
        manager: 90,
        care_manager: 80,
        nurse: 70,
        care_worker: 60,
        nutritionist: 50,
        staff: 40,
    };

    // 権限レベルごとの操作可能な機能
    static PERMISSIONS = {
        // カレンダー関連
        CALENDAR_VIEW: 40, // カレンダー閲覧
        SCHEDULE_CREATE: 60, // 予定作成
        SCHEDULE_EDIT_OWN: 60, // 自分の予定編集
        SCHEDULE_EDIT_ALL: 80, // 全ての予定編集
        SCHEDULE_DELETE: 80, // 予定削除

        // 入浴スケジュール関連
        BATHING_VIEW: 40, // 入浴スケジュール閲覧
        BATHING_SCHEDULE: 60, // 入浴スケジュール作成・編集
        BATHING_MANAGE: 70, // 入浴スケジュール管理

        // 利用者関連
        RESIDENT_VIEW: 40, // 利用者情報閲覧
        RESIDENT_EDIT: 70, // 利用者情報編集
        RESIDENT_MANAGE: 80, // 利用者管理

        // システム管理
        USER_MANAGE: 90, // ユーザー管理
        SYSTEM_ADMIN: 100, // システム管理
    };

    /**
     * ユーザーの権限レベルを取得
     * @param {Object} user - ユーザーオブジェクト
     * @returns {number} 権限レベル
     */
    static getUserLevel(user) {
        if (!user || !user.role) {
            return 0;
        }
        return this.ROLE_HIERARCHY[user.role] || 0;
    }

    /**
     * 権限チェック
     * @param {Object} user - ユーザーオブジェクト
     * @param {string} permission - 権限名
     * @returns {boolean} 権限があるかどうか
     */
    static hasPermission(user, permission) {
        const userLevel = this.getUserLevel(user);
        const requiredLevel = this.PERMISSIONS[permission];

        return userLevel >= requiredLevel;
    }

    /**
     * 複数の権限のいずれかを持っているかチェック
     * @param {Object} user - ユーザーオブジェクト
     * @param {Array} permissions - 権限名の配列
     * @returns {boolean} いずれかの権限があるかどうか
     */
    static hasAnyPermission(user, permissions) {
        return permissions.some((permission) =>
            this.hasPermission(user, permission)
        );
    }

    /**
     * 全ての権限を持っているかチェック
     * @param {Object} user - ユーザーオブジェクト
     * @param {Array} permissions - 権限名の配列
     * @returns {boolean} 全ての権限があるかどうか
     */
    static hasAllPermissions(user, permissions) {
        return permissions.every((permission) =>
            this.hasPermission(user, permission)
        );
    }

    /**
     * 予定の編集権限チェック
     * @param {Object} user - ユーザーオブジェクト
     * @param {Object} schedule - 予定オブジェクト
     * @returns {boolean} 編集権限があるかどうか
     */
    static canEditSchedule(user, schedule) {
        // 全ての予定を編集できる権限があるかチェック
        if (this.hasPermission(user, "SCHEDULE_EDIT_ALL")) {
            return true;
        }

        // 自分の予定のみ編集できる権限があるかチェック
        if (this.hasPermission(user, "SCHEDULE_EDIT_OWN")) {
            return schedule.created_by === user.id;
        }

        return false;
    }

    /**
     * 予定の削除権限チェック
     * @param {Object} user - ユーザーオブジェクト
     * @param {Object} schedule - 予定オブジェクト
     * @returns {boolean} 削除権限があるかどうか
     */
    static canDeleteSchedule(user, schedule) {
        if (!this.hasPermission(user, "SCHEDULE_DELETE")) {
            return false;
        }

        // 管理者レベルなら全て削除可能
        if (this.getUserLevel(user) >= this.ROLE_HIERARCHY.manager) {
            return true;
        }

        // それ以外は自分が作成した予定のみ削除可能
        return schedule.created_by === user.id;
    }

    /**
     * 役職名を日本語で取得
     * @param {string} role - 役職コード
     * @returns {string} 日本語の役職名
     */
    static getRoleDisplayName(role) {
        const roleNames = {
            admin: "管理者",
            manager: "施設長",
            care_manager: "ケアマネージャー",
            nurse: "看護師",
            care_worker: "介護士",
            nutritionist: "栄養士",
            staff: "スタッフ",
        };

        return roleNames[role] || "不明";
    }

    /**
     * 権限に応じたボタンスタイルを取得
     * @param {Object} user - ユーザーオブジェクト
     * @param {string} permission - 権限名
     * @returns {Object} ボタンスタイル設定
     */
    static getButtonStyle(user, permission) {
        const hasPermission = this.hasPermission(user, permission);

        return {
            disabled: !hasPermission,
            className: hasPermission
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed",
        };
    }
}

// React Hook for permissions
export function usePermissions() {
    const { props } = usePage();
    const user = props.auth.user;

    return {
        user,
        hasPermission: (permission) =>
            PermissionHelper.hasPermission(user, permission),
        hasAnyPermission: (permissions) =>
            PermissionHelper.hasAnyPermission(user, permissions),
        hasAllPermissions: (permissions) =>
            PermissionHelper.hasAllPermissions(user, permissions),
        canEditSchedule: (schedule) =>
            PermissionHelper.canEditSchedule(user, schedule),
        canDeleteSchedule: (schedule) =>
            PermissionHelper.canDeleteSchedule(user, schedule),
        getUserLevel: () => PermissionHelper.getUserLevel(user),
        getRoleDisplayName: () =>
            PermissionHelper.getRoleDisplayName(user?.role),
        getButtonStyle: (permission) =>
            PermissionHelper.getButtonStyle(user, permission),
    };
}
