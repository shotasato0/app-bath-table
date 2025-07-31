import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import InputLabel from '../InputLabel';
import TextInput from '../TextInput';
import InputError from '../InputError';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';

// 性別の選択肢定数
const GENDER_OPTIONS = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'other', label: 'その他' }
];

const GENDER_VALUES = GENDER_OPTIONS.map(option => option.value);

export default function ResidentModal({
    isOpen,
    onClose,
    onSave,
    resident = null,
    loading = false
}) {
    const [formData, setFormData] = useState({
        name: '',
        gender: '',
        birth_date: '',
        medical_notes: ''
    });
    const [errors, setErrors] = useState({});

    // モーダルが開かれた時にフォームデータを初期化
    useEffect(() => {
        if (isOpen) {
            if (resident && !resident.isNewResident) {
                // 編集モード: 既存利用者データを設定
                setFormData({
                    name: resident.name || '',
                    gender: resident.gender || '',
                    birth_date: resident.birth_date || '',
                    medical_notes: resident.medical_notes || ''
                });
            } else {
                // 新規作成モード: フォームをリセット
                setFormData({
                    name: '',
                    gender: '',
                    birth_date: '',
                    medical_notes: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, resident]);

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

    const validateForm = () => {
        const newErrors = {};

        // 名前のバリデーション
        if (!formData.name.trim()) {
            newErrors.name = '名前は必須です';
        } else if (formData.name.length > 255) {
            newErrors.name = '名前は255文字以内で入力してください';
        }

        // 性別のバリデーション
        if (formData.gender && !['male', 'female', 'other'].includes(formData.gender)) {
            newErrors.gender = '性別は男性、女性、その他から選択してください';
        }

        // 生年月日のバリデーション
        if (formData.birth_date) {
            const birthDate = new Date(formData.birth_date);
            const today = new Date();
            if (birthDate >= today) {
                newErrors.birth_date = '生年月日は今日より前の日付を入力してください';
            }
        }

        // 医療メモのバリデーション
        if (formData.medical_notes && formData.medical_notes.length > 1000) {
            newErrors.medical_notes = '医療メモは1000文字以内で入力してください';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            // サーバーサイドバリデーションエラーの処理
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        }
    };

    const isEditing = resident && !resident.isNewResident;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {isEditing ? '利用者情報を編集' : '新しい利用者を追加'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 名前 */}
                    <div>
                        <InputLabel htmlFor="name" value="名前 *" />
                        <TextInput
                            id="name"
                            type="text"
                            className="mt-1 block w-full"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="利用者の名前を入力"
                            disabled={loading}
                            required
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    {/* 性別 */}
                    <div>
                        <InputLabel htmlFor="gender" value="性別" />
                        <select
                            id="gender"
                            value={formData.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                            disabled={loading}
                        >
                            <option value="">選択してください</option>
                            <option value="male">男性</option>
                            <option value="female">女性</option>
                            <option value="other">その他</option>
                        </select>
                        <InputError message={errors.gender} className="mt-2" />
                    </div>

                    {/* 生年月日 */}
                    <div>
                        <InputLabel htmlFor="birth_date" value="生年月日" />
                        <TextInput
                            id="birth_date"
                            type="date"
                            className="mt-1 block w-full"
                            value={formData.birth_date}
                            onChange={(e) => handleInputChange('birth_date', e.target.value)}
                            disabled={loading}
                            max={new Date().toISOString().split('T')[0]}
                        />
                        <InputError message={errors.birth_date} className="mt-2" />
                    </div>

                    {/* 医療メモ */}
                    <div>
                        <InputLabel htmlFor="medical_notes" value="医療メモ" />
                        <textarea
                            id="medical_notes"
                            rows={4}
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                            value={formData.medical_notes}
                            onChange={(e) => handleInputChange('medical_notes', e.target.value)}
                            placeholder="アレルギー、服薬情報、注意事項などを記入"
                            disabled={loading}
                            maxLength={1000}
                        />
                        <div className="mt-1 text-sm text-gray-500">
                            {formData.medical_notes.length}/1000文字
                        </div>
                        <InputError message={errors.medical_notes} className="mt-2" />
                    </div>

                    {/* ボタン */}
                    <div className="flex items-center justify-end gap-3">
                        <SecondaryButton onClick={onClose} disabled={loading}>
                            キャンセル
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={loading}>
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    保存中...
                                </div>
                            ) : (
                                isEditing ? '更新' : '作成'
                            )}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}