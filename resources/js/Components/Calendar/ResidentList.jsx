import React, { useState, useEffect, useRef } from 'react';
import ResidentModal from './ResidentModal';
import { useResidents } from '../../hooks/useResidents';

const SAMPLE_RESIDENTS = [
    { id: 1, name: '田中太郎', room: '101号室', color: 'bg-blue-600' },
    { id: 2, name: '佐藤花子', room: '102号室', color: 'bg-green-600' },
    { id: 3, name: '山田次郎', room: '103号室', color: 'bg-purple-600' },
    { id: 4, name: '鈴木一郎', room: '104号室', color: 'bg-yellow-600' },
    { id: 5, name: '高橋美子', room: '105号室', color: 'bg-red-600' },
];

const COLORS = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-yellow-600', 'bg-red-600', 'bg-orange-600', 'bg-pink-600', 'bg-indigo-600'];

export default function ResidentList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedResident, setDraggedResident] = useState(null);
    const [showResidentModal, setShowResidentModal] = useState(false);
    const [selectedResident, setSelectedResident] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const timeoutRefs = useRef(new Set());
    const notificationTimeouts = useRef(new Map());

    // APIと接続する場合の利用者データ、そうでなければサンプルデータ
    const useApiEndpoint = import.meta.env.VITE_USE_RESIDENTS_API === 'true';

    // 利用者管理フック
    const {
        residents: apiResidents,
        loading: residentsLoading,
        error: residentsError,
        fetchResidents,
        createResident,
        updateResident,
        deleteResident
    } = useResidents({ autoFetch: useApiEndpoint });
    const residents = useApiEndpoint ? apiResidents : SAMPLE_RESIDENTS;
    const loading = useApiEndpoint ? residentsLoading : false;


    // コンポーネントアンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            // 全てのタイマーをクリアしてメモリリークを防止
            timeoutRefs.current.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            timeoutRefs.current.clear();
            
            // 通知タイマーもクリア
            notificationTimeouts.current.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            notificationTimeouts.current.clear();
        };
    }, []);

    // 通知システム
    const showNotification = (message, type = 'success') => {
        const id = Date.now() + Math.random();
        const notification = { id, message, type };
        
        setNotifications(prev => [...prev, notification]);
        
        const timeoutId = setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
            notificationTimeouts.current.delete(id);
        }, type === 'error' ? 5000 : 3000);
        
        notificationTimeouts.current.set(id, timeoutId);
    };

    const showSuccessMessage = (message) => {
        showNotification(message, 'success');
    };

    const showErrorMessage = (message) => {
        showNotification(message, 'error');
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        const timeoutId = notificationTimeouts.current.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            notificationTimeouts.current.delete(id);
        }
    };

    // 利用者一覧の再取得
    const handleRefreshResidents = async () => {
        if (!useApiEndpoint) return;
        
        try {
            await fetchResidents();
            showSuccessMessage('利用者一覧を更新しました');
        } catch (error) {
            showErrorMessage(`データの取得に失敗しました: ${error.message}`);
        }
    };

    // 利用者管理機能
    const handleAddResident = () => {
        if (!useApiEndpoint) {
            showErrorMessage('サンプルデータモードでは利用者の追加はできません');
            return;
        }
        setSelectedResident({ isNewResident: true });
        setShowResidentModal(true);
    };

    const handleEditResident = (resident) => {
        setSelectedResident(resident);
        setShowResidentModal(true);
    };

    const handleDeleteResident = async (resident) => {
        if (!useApiEndpoint) {
            showErrorMessage('サンプルデータは削除できません');
            return;
        }

        if (window.confirm(`${resident.name}さんを削除しますか？`)) {
            try {
                await deleteResident(resident.id);
                showSuccessMessage(`${resident.name}さんを削除しました`);
            } catch (error) {
                showErrorMessage(`削除に失敗しました: ${error.message}`);
            }
        }
    };

    const handleSaveResident = async (formData) => {
        if (!useApiEndpoint) {
            showErrorMessage('サンプルデータモードでは利用者の作成・編集はできません');
            return;
        }

        try {
            if (selectedResident?.isNewResident) {
                await createResident(formData);
                showSuccessMessage(`${formData.name}さんを追加しました`);
            } else {
                await updateResident(selectedResident.id, formData);
                showSuccessMessage(`${formData.name}さんの情報を更新しました`);
            }
            setShowResidentModal(false);
            setSelectedResident(null);
        } catch (error) {
            showErrorMessage(`保存に失敗しました: ${error.message}`);
            throw error;
        }
    };

    const filteredResidents = residents.filter(resident =>
        resident.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDragStart = (e, resident) => {
        e.dataTransfer.setData('application/json', JSON.stringify(resident));
        e.dataTransfer.effectAllowed = 'copy';
        setDraggedResident(resident.id);
        
        // ドラッグ中の要素のスタイルを設定
        const dragImage = e.currentTarget.cloneNode(true);
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.style.left = '-1000px';
        dragImage.style.opacity = '0.8';
        dragImage.style.transform = 'rotate(2deg)';
        dragImage.style.pointerEvents = 'none';
        dragImage.style.zIndex = '9999';
        document.body.appendChild(dragImage);
        
        // カーソル位置に近い場所でドラッグイメージを設定
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        
        e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
        
        // 少し遅延後にクローンを削除（メモリリーク対策付き）
        const timeoutId = setTimeout(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
            // タイマーIDをSetから削除
            timeoutRefs.current.delete(timeoutId);
        }, 100);
        
        // タイマーIDを記録
        timeoutRefs.current.add(timeoutId);
    };

    const handleDragEnd = () => {
        setDraggedResident(null);
        
        // ドラッグ終了時に念のため残っているタイマーをクリーンアップ
        // (通常は自動的にクリアされるが、異常終了時の保険)
        timeoutRefs.current.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        timeoutRefs.current.clear();
    };

    return (
        <>
            <div className="bg-gray-800 border border-gray-600 rounded-lg h-full flex flex-col">
                <div className="p-4 border-b border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-100">利用者一覧</h3>
                        <div className="flex items-center gap-2">
                            {useApiEndpoint && (
                                <button
                                    onClick={handleRefreshResidents}
                                    className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded transition-colors"
                                    disabled={loading}
                                    title="更新"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={handleAddResident}
                                className={`text-white text-xs px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                                    useApiEndpoint 
                                        ? 'bg-blue-600 hover:bg-blue-700' 
                                        : 'bg-gray-500 cursor-not-allowed'
                                }`}
                                disabled={loading || !useApiEndpoint}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                追加
                            </button>
                        </div>
                    </div>
                    <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-md text-gray-100 text-sm placeholder-gray-400"
                        placeholder="名前で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(10 * 80px)' }}>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-gray-400 text-sm">住民データを読み込み中...</div>
                        </div>
                    ) : residentsError ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                            <div className="text-red-400 text-sm text-center">{residentsError}</div>
                            {useApiEndpoint && (
                                <button
                                    onClick={handleRefreshResidents}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-md transition-colors"
                                >
                                    再試行
                                </button>
                            )}
                        </div>
                    ) : filteredResidents.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-gray-400 text-sm text-center">
                                {searchTerm ? '検索結果が見つかりません' : '利用者が登録されていません'}
                                {!useApiEndpoint && (
                                    <div className="mt-2 text-xs">
                                        (現在はサンプルデータモードです)
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredResidents.map((resident) => {
                                const avatarColor = resident.color || COLORS[resident.id % COLORS.length];
                                
                                return (
                                    <div
                                        key={resident.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, resident)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-3 p-3 bg-gray-700 border border-gray-600 rounded-md cursor-move transition-all hover:bg-gray-600 hover:-translate-y-0.5 hover:shadow-lg group relative ${
                                            draggedResident === resident.id ? 'opacity-50 scale-95' : ''
                                        }`}
                                        style={{ minHeight: '72px' }}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${avatarColor}`}>
                                            👤
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-100">{resident.name}</h4>
                                            <p className="text-xs text-gray-400">
                                                {resident.room || (resident.gender && `${resident.gender === 'male' ? '男性' : resident.gender === 'female' ? '女性' : 'その他'}`)}
                                            </p>
                                        </div>

                                        {/* 管理ボタン（APIモードの場合のみ表示） */}
                                        {useApiEndpoint && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditResident(resident);
                                                    }}
                                                    className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                                    title="編集"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteResident(resident);
                                                    }}
                                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                    title="削除"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* 利用者数表示 */}
                            {filteredResidents.length > 0 && (
                                <div className="text-center py-2 border-t border-gray-600 mt-2">
                                    <p className="text-xs text-gray-400">
                                        {searchTerm ? `検索結果: ${filteredResidents.length}件` : `利用者: ${filteredResidents.length}件`}
                                        {filteredResidents.length > 10 && (
                                            <span className="block mt-1 text-yellow-400">
                                                スクロールして全て表示
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-gray-600 bg-gray-900">
                    <p className="text-xs text-gray-400">💡 入浴予定にドラッグして追加</p>
                </div>
            </div>

            {/* 利用者モーダル */}
            <ResidentModal
                isOpen={showResidentModal}
                onClose={() => {
                    setShowResidentModal(false);
                    setSelectedResident(null);
                }}
                onSave={handleSaveResident}
                resident={selectedResident}
                loading={loading}
            />

            {/* Toast通知 */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-sm transform transition-all duration-300 ease-in-out ${
                            notification.type === 'success' 
                                ? 'bg-green-600' 
                                : notification.type === 'error'
                                ? 'bg-red-600'
                                : 'bg-blue-600'
                        } animate-slide-in`}
                    >
                        <div className="flex items-center gap-2">
                            {notification.type === 'success' && (
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                            {notification.type === 'error' && (
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            <span className="break-words flex-1">{notification.message}</span>
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="ml-2 text-white hover:text-gray-200 focus:outline-none focus:text-gray-200 transition-colors"
                                aria-label="通知を閉じる"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}