import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import InputLabel from '../InputLabel';
import TextInput from '../TextInput';
import InputError from '../InputError';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';
import { format, parseISO } from 'date-fns';

export default function ScheduleModal({ 
    isOpen, 
    onClose, 
    onSave, 
    schedule = null, 
    date,
    scheduleTypes = [],
    loading = false 
}) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        schedule_type_id: '',
        all_day: false
    });
    const [errors, setErrors] = useState({});

    // モーダルが開かれた時にフォームデータを初期化
    useEffect(() => {
        if (isOpen) {
            if (schedule && !schedule.isNewSchedule) {
                // 編集モード: 既存スケジュールデータを設定
                // dateフィールドがnullの場合はcalendar_dateから取得
                const scheduleDate = schedule.date || schedule.calendar_date?.calendar_date || format(date, 'yyyy-MM-dd');
                
                setFormData({
                    title: schedule.title || '',
                    description: schedule.description || '',
                    date: scheduleDate,
                    start_time: schedule.start_time ? schedule.start_time.substring(0, 5) : '',
                    end_time: schedule.end_time ? schedule.end_time.substring(0, 5) : '',
                    schedule_type_id: schedule.schedule_type_id || '',
                    all_day: schedule.all_day || false
                });
            } else {
                // 作成モード: 選択された日付で初期化
                const dateStr = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                const isBathingSchedule = schedule?.isBathingSchedule;
                const defaultScheduleTypeId = isBathingSchedule ? 1 : (scheduleTypes.length > 0 ? scheduleTypes[0].id : '');
                
                setFormData({
                    title: isBathingSchedule ? '入浴' : '',
                    description: '',
                    date: dateStr,
                    start_time: '09:00',
                    end_time: '10:00',
                    schedule_type_id: defaultScheduleTypeId,
                    all_day: false
                });
            }
            setErrors({});
        }
    }, [isOpen, schedule, date, scheduleTypes]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // エラーをクリア
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // バリデーション
        const newErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = 'タイトルは必須です';
        }
        if (!formData.date) {
            newErrors.date = '日付は必須です';
        }
        if (!formData.schedule_type_id) {
            newErrors.schedule_type_id = 'スケジュールタイプを選択してください';
        }
        if (!formData.all_day && !formData.start_time) {
            newErrors.start_time = '開始時間は必須です';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: 'スケジュールの保存に失敗しました' });
            }
        }
    };

    const selectedType = scheduleTypes.find(type => type.id == formData.schedule_type_id);

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="bg-gray-800 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                        {schedule && !schedule.isNewSchedule 
                            ? 'スケジュール編集' 
                            : (schedule?.isBathingSchedule ? '入浴スケジュール作成' : 'スケジュール作成')
                        }
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {errors.general && (
                    <div className="mb-4 p-3 bg-red-900 bg-opacity-20 border border-red-600 text-red-300 rounded">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* タイトル */}
                    <div>
                        <InputLabel htmlFor="title" value="タイトル *" className="text-gray-300" />
                        <TextInput
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                            placeholder="スケジュールのタイトルを入力"
                        />
                        <InputError message={errors.title} className="mt-2" />
                    </div>

                    {/* スケジュールタイプ */}
                    <div>
                        <InputLabel htmlFor="schedule_type_id" value="タイプ *" className="text-gray-300" />
                        <select
                            id="schedule_type_id"
                            value={formData.schedule_type_id}
                            onChange={(e) => handleInputChange('schedule_type_id', e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">選択してください</option>
                            {scheduleTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.type_name}
                                </option>
                            ))}
                        </select>
                        {selectedType && (
                            <div className="mt-2 flex items-center">
                                <div 
                                    className="w-4 h-4 rounded mr-2"
                                    style={{ backgroundColor: selectedType.color_code }}
                                ></div>
                                <span className="text-sm text-gray-400">{selectedType.type_name}</span>
                            </div>
                        )}
                        <InputError message={errors.schedule_type_id} className="mt-2" />
                    </div>

                    {/* 日付 */}
                    <div>
                        <InputLabel htmlFor="date" value="日付 *" className="text-gray-300" />
                        <TextInput
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleInputChange('date', e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                        />
                        <InputError message={errors.date} className="mt-2" />
                    </div>

                    {/* 全日チェックボックス */}
                    <div className="flex items-center">
                        <input
                            id="all_day"
                            type="checkbox"
                            checked={formData.all_day}
                            onChange={(e) => handleInputChange('all_day', e.target.checked)}
                            className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="all_day" className="ml-2 text-sm text-gray-300">
                            終日
                        </label>
                    </div>

                    {/* 時間選択（全日でない場合のみ表示） */}
                    {!formData.all_day && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="start_time" value="開始時間 *" className="text-gray-300" />
                                <TextInput
                                    id="start_time"
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                                    className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                                />
                                <InputError message={errors.start_time} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="end_time" value="終了時間" className="text-gray-300" />
                                <TextInput
                                    id="end_time"
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                                    className="mt-1 block w-full bg-gray-700 border-gray-600 text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* 説明 */}
                    <div>
                        <InputLabel htmlFor="description" value="説明" className="text-gray-300" />
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="スケジュールの詳細を入力（任意）"
                        />
                    </div>

                    {/* アクションボタン */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <SecondaryButton type="button" onClick={onClose}>
                            キャンセル
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={loading}>
                            {loading ? '保存中...' : (schedule ? '更新' : '作成')}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}