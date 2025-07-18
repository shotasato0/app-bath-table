import React, { useState } from 'react';
import { MagnifyingGlassIcon, UserIcon, InformationCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useDragDrop } from './DragDropProvider';
import { usePermissions } from '@/Utils/PermissionHelper';

export default function ResidentSidebar({ 
    residents = [], 
    userRole,
    onResidentSelect,
    className = ''
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResident, setSelectedResident] = useState(null);
    const [expandedResident, setExpandedResident] = useState(null);
    const [filterByRoom, setFilterByRoom] = useState('');
    const [filterByStatus, setFilterByStatus] = useState('');
    
    const { makeDraggable, getDragStyles } = useDragDrop();
    const { hasPermission } = usePermissions();

    // 利用者閲覧権限チェック
    const canViewResidents = hasPermission('RESIDENT_VIEW');

    // 利用者のフィルタリング
    const filteredResidents = residents.filter(resident => {
        const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             resident.room_number?.includes(searchTerm);
        const matchesRoom = !filterByRoom || resident.room_number === filterByRoom;
        const matchesStatus = !filterByStatus || resident.status === filterByStatus;
        
        return matchesSearch && matchesRoom && matchesStatus;
    });

    // 部屋番号でソート
    const sortedResidents = filteredResidents.sort((a, b) => {
        const roomA = parseInt(a.room_number) || 0;
        const roomB = parseInt(b.room_number) || 0;
        return roomA - roomB;
    });

    // 利用者詳細の表示/非表示切り替え
    const toggleResidentDetails = (residentId) => {
        setExpandedResident(expandedResident === residentId ? null : residentId);
    };

    // 利用者の状態に応じたスタイル
    const getResidentStatusStyle = (resident) => {
        switch (resident.status) {
            case 'active':
                return 'border-l-green-500 bg-green-50';
            case 'inactive':
                return 'border-l-gray-500 bg-gray-50';
            case 'medical_care':
                return 'border-l-red-500 bg-red-50';
            case 'temporary_leave':
                return 'border-l-yellow-500 bg-yellow-50';
            default:
                return 'border-l-blue-500 bg-blue-50';
        }
    };

    // 利用者の状態を日本語表示
    const getResidentStatusText = (status) => {
        switch (status) {
            case 'active': return '入所中';
            case 'inactive': return '退所';
            case 'medical_care': return '医療対応';
            case 'temporary_leave': return '一時退所';
            default: return '不明';
        }
    };

    // 利用者コンポーネント
    const ResidentItem = ({ resident }) => {
        const draggableProps = makeDraggable(resident, 'resident');
        const dragStyles = getDragStyles(resident, 'resident');
        const isExpanded = expandedResident === resident.id;

        return (
            <div
                className={`p-3 mb-2 border-l-4 rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow ${getResidentStatusStyle(resident)}`}
                style={dragStyles}
                {...draggableProps}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                        <div>
                            <div className="font-medium text-gray-900">
                                {resident.name}
                            </div>
                            <div className="text-sm text-gray-500">
                                {resident.room_number}号室
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                            resident.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : resident.status === 'medical_care'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            {getResidentStatusText(resident.status)}
                        </span>
                        
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleResidentDetails(resident.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                        >
                            {isExpanded ? 
                                <ChevronUpIcon className="h-4 w-4" /> : 
                                <ChevronDownIcon className="h-4 w-4" />
                            }
                        </button>
                    </div>
                </div>

                {/* 詳細情報 */}
                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">年齢</label>
                                <p className="text-gray-900">{resident.age}歳</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">性別</label>
                                <p className="text-gray-900">{resident.gender === 'male' ? '男性' : '女性'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">要介護度</label>
                                <p className="text-gray-900">{resident.care_level}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">担当職員</label>
                                <p className="text-gray-900">{resident.primary_staff?.name || '未設定'}</p>
                            </div>
                        </div>
                        
                        {resident.medical_notes && (
                            <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-700">医療情報</label>
                                <p className="text-sm text-gray-900 bg-yellow-50 p-2 rounded">
                                    {resident.medical_notes}
                                </p>
                            </div>
                        )}
                        
                        {resident.special_requirements && (
                            <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-700">特別な配慮</label>
                                <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">
                                    {resident.special_requirements}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!canViewResidents) {
        return (
            <div className={`w-80 bg-white border-r border-gray-200 ${className}`}>
                <div className="p-4 text-center text-gray-500">
                    <UserIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">利用者情報を閲覧する権限がありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-80 bg-white border-r border-gray-200 flex flex-col ${className}`}>
            {/* ヘッダー */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    利用者一覧
                </h2>
                
                {/* 検索フィルター */}
                <div className="space-y-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="名前または部屋番号で検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="flex space-x-2">
                        <select
                            value={filterByStatus}
                            onChange={(e) => setFilterByStatus(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">全ての状態</option>
                            <option value="active">入所中</option>
                            <option value="medical_care">医療対応</option>
                            <option value="temporary_leave">一時退所</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 利用者リスト */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                        {filteredResidents.length} 名の利用者
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <InformationCircleIcon className="h-4 w-4" />
                        <span>ドラッグして予定作成</span>
                    </div>
                </div>
                
                {sortedResidents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <UserIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">該当する利用者がいません</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedResidents.map((resident) => (
                            <ResidentItem key={resident.id} resident={resident} />
                        ))}
                    </div>
                )}
            </div>

            {/* フッター */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>入所中</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>医療対応</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>一時退所</span>
                    </div>
                </div>
            </div>
        </div>
    );
}