import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Error({ auth, status = 500, message = 'エラーが発生しました' }) {
    const getStatusMessage = (status) => {
        switch (status) {
            case 403:
                return 'アクセス権限がありません';
            case 404:
                return 'ページが見つかりません';
            case 500:
                return 'サーバーエラーが発生しました';
            default:
                return 'エラーが発生しました';
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`エラー ${status}`} />
            
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl font-bold text-gray-400 mb-4">
                        {status}
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                        {getStatusMessage(status)}
                    </h1>
                    <p className="text-gray-600 mb-8">
                        {message}
                    </p>
                    <a
                        href="/dashboard"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        ダッシュボードに戻る
                    </a>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}