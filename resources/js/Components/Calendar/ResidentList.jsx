import React, { useState } from 'react';

const SAMPLE_RESIDENTS = [
    { id: 1, name: '田中太郎', room: '101号室', color: 'bg-blue-600' },
    { id: 2, name: '佐藤花子', room: '102号室', color: 'bg-green-600' },
    { id: 3, name: '山田次郎', room: '103号室', color: 'bg-purple-600' },
    { id: 4, name: '鈴木一郎', room: '104号室', color: 'bg-yellow-600' },
    { id: 5, name: '高橋美子', room: '105号室', color: 'bg-red-600' },
];

export default function ResidentList() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredResidents = SAMPLE_RESIDENTS.filter(resident =>
        resident.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDragStart = (e, resident) => {
        e.dataTransfer.setData('application/json', JSON.stringify(resident));
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
                {filteredResidents.map((resident) => (
                    <div
                        key={resident.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, resident)}
                        className="flex items-center gap-3 p-3 bg-gray-700 border border-gray-600 rounded-md mb-2 cursor-move transition-all hover:bg-gray-600 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${resident.color}`}>
                            👤
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-100">{resident.name}</h4>
                            <p className="text-xs text-gray-400">{resident.room}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="p-4 border-t border-gray-600 bg-gray-900">
                <p className="text-xs text-gray-400">💡 入浴予定にドラッグして追加</p>
            </div>
        </div>
    );
}