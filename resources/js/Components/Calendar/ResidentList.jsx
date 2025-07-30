import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
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

    // 利用者管理フック
    const {
        residents: apiResidents,
        loading: residentsLoading,
        error: residentsError,
        fetchResidents,
        createResident,
        updateResident,
        deleteResident
    } = useResidents({ autoFetch: false });

    // APIと接続する場合の利用者データ、そうでなければサンプルデータ
    const useApiEndpoint = import.meta.env.VITE_USE_RESIDENTS_API === 'true';
    const residents = useApiEndpoint ? apiResidents : SAMPLE_RESIDENTS;
    const loading = useApiEndpoint ? residentsLoading : false;

    // 住民データを取得
    useEffect(() => {
        const fetchResidents = async () => {
            try {
                // 開発環境では住民APIエンドポイントが未実装のためサンプルデータを使用
                const useApiEndpoint = import.meta.env.VITE_USE_RESIDENTS_API === 'true';
                
                if (useApiEndpoint) {
                    try {
                        const response = await api.get('/residents');
                        const apiResidents = response.data.data || [];
                        
                        // APIデータに色を追加
                        const residentsWithColors = apiResidents.map((resident, index) => ({
                            ...resident,
                            room: resident.room_number || `${resident.id}号室`,
                            color: COLORS[index % COLORS.length]
                        }));
                        
                        setResidents(residentsWithColors.length > 0 ? residentsWithColors : SAMPLE_RESIDENTS);
                        console.log('住民データ: APIから取得完了');
                    } catch (apiError) {
                        console.warn('住民API取得エラー、サンプルデータにフォールバック:', apiError);
                        setResidents(SAMPLE_RESIDENTS);
                    }
                } else {
                    console.log('住民データ: サンプルデータを使用中（環境設定により）');
                    setResidents(SAMPLE_RESIDENTS);
                }
            } catch (error) {
                console.error('住民データ取得エラー:', error);
                // エラー時はサンプルデータを使用
                setResidents(SAMPLE_RESIDENTS);
            } finally {
                setLoading(false);
            }
        };

        fetchResidents();
    }, []);

    // コンポーネントアンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            // 全てのタイマーをクリアしてメモリリークを防止
            timeoutRefs.current.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            timeoutRefs.current.clear();
        };
    }, []);

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
        <div className="bg-gray-800 border border-gray-600 rounded-lg">
            <div className="p-4 border-b border-gray-600">
                <h3 className="text-sm font-medium mb-3 text-gray-100">利用者一覧</h3>
                <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-md text-gray-100 text-sm placeholder-gray-400"
                    placeholder="名前で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-gray-400 text-sm">住民データを読み込み中...</div>
                    </div>
                ) : (
                    filteredResidents.map((resident) => (
                        <div
                            key={resident.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, resident)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-3 p-3 bg-gray-700 border border-gray-600 rounded-md mb-2 cursor-move transition-all hover:bg-gray-600 hover:-translate-y-0.5 hover:shadow-lg ${
                                draggedResident === resident.id ? 'opacity-50 scale-95' : ''
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${resident.color}`}>
                                👤
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-100">{resident.name}</h4>
                                <p className="text-xs text-gray-400">{resident.room}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-4 border-t border-gray-600 bg-gray-900">
                <p className="text-xs text-gray-400">💡 入浴予定にドラッグして追加</p>
            </div>
        </div>
    );
}