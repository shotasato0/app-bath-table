import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DragDropProvider from './DragDropProvider';
import ScheduleColumn from './ScheduleColumn';
import BathingColumn from './BathingColumn';
import ResidentSidebar from './ResidentSidebar';
import ScheduleModal from './ScheduleModal';
import { 
    CalendarIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { usePermissions } from '@/Utils/PermissionHelper';

export default function CalendarLayout({ 
    auth, 
    schedules = [], 
    residents = [], 
    currentDate = new Date().toISOString().split('T')[0]
}) {
    const [selectedDate, setSelectedDate] = useState(currentDate);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [modalColumnType, setModalColumnType] = useState('general');
    const [showSidebar, setShowSidebar] = useState(true);
    
    const { hasPermission, user } = usePermissions();

    // 日付の変更
    const handleDateChange = (direction) => {
        const currentDate = new Date(selectedDate);
        const newDate = new Date(currentDate);
        
        if (direction === 'prev') {
            newDate.setDate(currentDate.getDate() - 1);
        } else {
            newDate.setDate(currentDate.getDate() + 1);
        }
        
        setSelectedDate(newDate.toISOString().split('T')[0]);
    };

    // 今日に戻る
    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    // 新規予定作成
    const handleAddSchedule = (columnType) => {
        setModalMode('create');
        setModalColumnType(columnType);
        setSelectedSchedule(null);
        setShowModal(true);
    };

    // 予定編集
    const handleEditSchedule = (schedule) => {
        setModalMode('edit');
        setSelectedSchedule(schedule);
        setModalColumnType(schedule.column_type || 'general');
        setShowModal(true);
    };

    // 予定削除
    const handleDeleteSchedule = (schedule) => {
        if (window.confirm(`「${schedule.title}」を削除しますか？`)) {
            router.delete(`/schedules/${schedule.id}`, {
                onSuccess: () => {
                    // 削除成功時の処理
                },
                onError: (errors) => {
                    console.error('予定の削除に失敗しました:', errors);
                }
            });
        }
    };

    // 入浴予定作成
    const handleAddBathingSchedule = (date) => {
        handleAddSchedule('bathing', date);
    };

    // モーダルを閉じる
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedSchedule(null);
        setModalMode('create');
        setModalColumnType('general');
    };

    // 選択日の予定をカテゴリ別に分類
    const getSchedulesForDate = (date) => {
        const dailySchedules = schedules.filter(schedule => schedule.date === date);
        
        return {
            general: dailySchedules.filter(schedule => 
                schedule.column_type === 'general' || 
                schedule.type === 'general' || 
                (!schedule.column_type && !schedule.type)
            ),
            bathing: dailySchedules.filter(schedule => 
                schedule.column_type === 'bathing' || 
                schedule.type === 'bathing'
            ),
            medical: dailySchedules.filter(schedule => 
                schedule.column_type === 'medical' || 
                schedule.type === 'medical'
            ),
            activity: dailySchedules.filter(schedule => 
                schedule.column_type === 'activity' || 
                schedule.type === 'activity'
            )
        };
    };

    const dailySchedules = getSchedulesForDate(selectedDate);

    // 日付のフォーマット
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        };
        return date.toLocaleDateString('ja-JP', options);
    };

    // 権限チェック
    const canViewCalendar = hasPermission('CALENDAR_VIEW');

    if (!canViewCalendar) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="カレンダー" />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h2 className="text-lg font-medium text-gray-900 mb-2">
                            カレンダーを閲覧する権限がありません
                        </h2>
                        <p className="text-sm text-gray-600">
                            システム管理者にお問い合わせください。
                        </p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="介護施設カレンダー" />
            
            <DragDropProvider>
                <div className="min-h-screen bg-gray-50">
                    {/* ヘッダー */}
                    <div className="bg-white shadow-sm border-b border-gray-200">
                        <div className="max-w-full px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between h-16">
                                {/* タイトルと日付ナビゲーション */}
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <CalendarIcon className="h-8 w-8 text-blue-600" />
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            介護施設カレンダー
                                        </h1>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleDateChange('prev')}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                                        >
                                            <ChevronLeftIcon className="h-5 w-5" />
                                        </button>
                                        
                                        <div className="text-center min-w-0 flex-1">
                                            <div className="text-lg font-semibold text-gray-900">
                                                {formatDate(selectedDate)}
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleDateChange('next')}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                                        >
                                            <ChevronRightIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* 操作ボタン */}
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={goToToday}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        今日
                                    </button>
                                    
                                    <div className="flex items-center space-x-1">
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    
                                    <button
                                        onClick={() => setShowSidebar(!showSidebar)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                                        title="サイドバーの表示/非表示"
                                    >
                                        <Cog6ToothIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* メインコンテンツ */}
                    <div className="flex h-screen">
                        {/* サイドバー */}
                        {showSidebar && (
                            <ResidentSidebar
                                residents={residents}
                                userRole={user?.role}
                                onResidentSelect={(resident) => {
                                    // 利用者選択時の処理
                                }}
                                className="flex-shrink-0"
                            />
                        )}

                        {/* カレンダー列 */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* 一般予定列 */}
                            <ScheduleColumn
                                title="一般予定"
                                schedules={dailySchedules.general}
                                date={selectedDate}
                                columnType="general"
                                onAddSchedule={handleAddSchedule}
                                onEditSchedule={handleEditSchedule}
                                onDeleteSchedule={handleDeleteSchedule}
                                className="flex-1 border-r border-gray-200"
                            />

                            {/* 入浴予定列 */}
                            <BathingColumn
                                title="入浴スケジュール"
                                bathingSchedules={dailySchedules.bathing}
                                date={selectedDate}
                                onAddBathingSchedule={handleAddBathingSchedule}
                                onEditSchedule={handleEditSchedule}
                                onDeleteSchedule={handleDeleteSchedule}
                                className="flex-1 border-r border-gray-200"
                            />

                            {/* 医療・活動予定列 */}
                            <ScheduleColumn
                                title="医療・活動予定"
                                schedules={[...dailySchedules.medical, ...dailySchedules.activity]}
                                date={selectedDate}
                                columnType="medical"
                                onAddSchedule={handleAddSchedule}
                                onEditSchedule={handleEditSchedule}
                                onDeleteSchedule={handleDeleteSchedule}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {/* 予定作成・編集モーダル */}
                    <ScheduleModal
                        isOpen={showModal}
                        onClose={handleCloseModal}
                        schedule={selectedSchedule}
                        residents={residents}
                        date={selectedDate}
                        columnType={modalColumnType}
                        mode={modalMode}
                    />

                    {/* フッター（統計情報など） */}
                    <div className="bg-white border-t border-gray-200 px-4 py-3">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center space-x-4">
                                <span>
                                    利用者数: {residents.filter(r => r.status === 'active').length}名
                                </span>
                                <span>
                                    本日の予定: {Object.values(dailySchedules).flat().length}件
                                </span>
                                <span>
                                    入浴予定: {dailySchedules.bathing.length}件
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs">
                                    最終更新: {new Date().toLocaleString('ja-JP')}
                                </span>
                                <span className="text-xs">
                                    {user?.name} ({user?.role})
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </DragDropProvider>
        </AuthenticatedLayout>
    );
}