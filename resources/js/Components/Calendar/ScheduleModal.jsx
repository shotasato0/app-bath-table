import React, { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, UserIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { router } from '@inertiajs/react';
import { usePermissions } from '@/Utils/PermissionHelper';

export default function ScheduleModal({ 
    isOpen, 
    onClose, 
    schedule = null, 
    residents = [],
    date = '',
    columnType = 'general',
    mode = 'create' // 'create' or 'edit'
}) {
    const { hasPermission, user } = usePermissions();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        resident_id: '',
        date: '',
        start_time: '',
        end_time: '',
        type: 'general',
        priority: 'medium',
        status: 'scheduled',
        staff_id: user?.id || '',
        location: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // モーダルが開かれたときの初期化
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && schedule) {
                // 編集モード: 既存の予定データを設定
                setFormData({
                    title: schedule.title || '',
                    description: schedule.description || '',
                    resident_id: schedule.resident_id || '',
                    date: schedule.date || '',
                    start_time: schedule.start_time || '',
                    end_time: schedule.end_time || '',
                    type: schedule.type || 'general',
                    priority: schedule.priority || 'medium',
                    status: schedule.status || 'scheduled',
                    staff_id: schedule.staff_id || user?.id || '',
                    location: schedule.location || '',
                    notes: schedule.notes || ''
                });
            } else {
                // 作成モード: 新規予定のデフォルト値を設定
                const defaultTime = getDefaultTime();
                setFormData({
                    title: '',
                    description: '',
                    resident_id: '',
                    date: date,
                    start_time: defaultTime.start,
                    end_time: defaultTime.end,
                    type: columnType === 'bathing' ? 'bathing' : 'general',
                    priority: 'medium',
                    status: 'scheduled',
                    staff_id: user?.id || '',
                    location: '',
                    notes: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, mode, schedule, date, columnType, user]);

    // デフォルト時間の取得
    const getDefaultTime = () => {
        const now = new Date();
        const currentHour = now.getHours();
        
        if (columnType === 'bathing') {
            return currentHour < 12 
                ? { start: '10:00', end: '11:00' }
                : { start: '14:00', end: '15:00' };
        }
        
        const nextHour = currentHour + 1;
        return {
            start: `${nextHour.toString().padStart(2, '0')}:00`,
            end: `${(nextHour + 1).toString().padStart(2, '0')}:00`
        };
    };

    // フォームの入力値を更新
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // エラーをクリア
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // バリデーション
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) {
            newErrors.title = 'タイトルは必須です';
        }
        
        if (!formData.resident_id) {
            newErrors.resident_id = '利用者を選択してください';
        }
        
        if (!formData.date) {
            newErrors.date = '日付は必須です';
        }
        
        if (!formData.start_time) {
            newErrors.start_time = '開始時間は必須です';
        }
        
        if (!formData.end_time) {
            newErrors.end_time = '終了時間は必須です';
        }
        
        if (formData.start_time && formData.end_time) {
            if (formData.start_time >= formData.end_time) {
                newErrors.end_time = '終了時間は開始時間より後にしてください';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // フォーム送信
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        const submitData = {
            ...formData,
            column_type: columnType
        };
        
        try {
            if (mode === 'edit' && schedule) {
                // 編集モード
                router.put(`/schedules/${schedule.id}`, submitData, {
                    onSuccess: () => {
                        onClose();
                        // 成功メッセージ表示（オプション）
                    },
                    onError: (errors) => {
                        setErrors(errors);
                    },
                    onFinish: () => {
                        setIsSubmitting(false);
                    }
                });
            } else {
                // 作成モード
                router.post('/schedules', submitData, {
                    onSuccess: () => {
                        onClose();
                        // 成功メッセージ表示（オプション）
                    },
                    onError: (errors) => {
                        setErrors(errors);
                    },
                    onFinish: () => {
                        setIsSubmitting(false);
                    }
                });
            }
        } catch (error) {
            console.error('予定の保存に失敗しました:', error);
            setIsSubmitting(false);
        }
    };

    // 選択された利用者の情報を取得
    const selectedResident = residents.find(r => r.id === parseInt(formData.resident_id));

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 flex items-center justify-between"
                                >
                                    <span className="flex items-center space-x-2">
                                        <span>{columnType === 'bathing' ? '🛁' : '📅'}</span>
                                        <span>
                                            {mode === 'edit' ? '予定編集' : '新規予定作成'}
                                        </span>
                                    </span>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-4">
                                    {/* タイトル */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            タイトル *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.title ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder={columnType === 'bathing' ? '入浴予定' : '予定のタイトル'}
                                        />
                                        {errors.title && (
                                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                        )}
                                    </div>

                                    {/* 利用者選択 */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            利用者 *
                                        </label>
                                        <select
                                            value={formData.resident_id}
                                            onChange={(e) => handleInputChange('resident_id', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.resident_id ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        >
                                            <option value="">利用者を選択してください</option>
                                            {residents.map(resident => (
                                                <option key={resident.id} value={resident.id}>
                                                    {resident.name} ({resident.room_number}号室)
                                                </option>
                                            ))}
                                        </select>
                                        {errors.resident_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.resident_id}</p>
                                        )}
                                    </div>

                                    {/* 選択された利用者の情報表示 */}
                                    {selectedResident && (
                                        <div className="mb-4 p-3 bg-blue-50 rounded-md">
                                            <div className="flex items-center space-x-2 text-sm text-blue-800">
                                                <UserIcon className="h-4 w-4" />
                                                <span>{selectedResident.name}</span>
                                                <span>({selectedResident.room_number}号室)</span>
                                                <span>要介護度: {selectedResident.care_level}</span>
                                            </div>
                                            {selectedResident.medical_notes && (
                                                <div className="mt-2 text-xs text-blue-700">
                                                    <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                                                    {selectedResident.medical_notes}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 日付と時間 */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            日付 *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => handleInputChange('date', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.date ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.date && (
                                            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                                        )}
                                    </div>

                                    <div className="mb-4 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                開始時間 *
                                            </label>
                                            <input
                                                type="time"
                                                value={formData.start_time}
                                                onChange={(e) => handleInputChange('start_time', e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.start_time ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.start_time && (
                                                <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                終了時間 *
                                            </label>
                                            <input
                                                type="time"
                                                value={formData.end_time}
                                                onChange={(e) => handleInputChange('end_time', e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.end_time ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.end_time && (
                                                <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 優先度 */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            優先度
                                        </label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => handleInputChange('priority', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="low">低</option>
                                            <option value="medium">中</option>
                                            <option value="high">高</option>
                                        </select>
                                    </div>

                                    {/* 場所 */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            場所
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={columnType === 'bathing' ? '浴室' : '実施場所'}
                                        />
                                    </div>

                                    {/* 備考 */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            備考
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => handleInputChange('notes', e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="特記事項があれば入力してください"
                                        />
                                    </div>

                                    {/* ボタン */}
                                    <div className="flex items-center justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                                        >
                                            キャンセル
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                                        >
                                            {isSubmitting ? '保存中...' : '保存'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}