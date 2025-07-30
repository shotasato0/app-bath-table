import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function CalendarHeader({ currentDate, onPreviousMonth, onNextMonth, onToday, onCreateSchedule }) {
    return (
        <div className="bg-gray-800 border-b border-gray-600 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-lg">
                        📅
                    </div>
                    <h1 className="text-xl font-medium text-gray-100">カレンダー</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onToday}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md text-sm hover:bg-gray-600 transition-colors"
                    >
                        今日
                    </button>
                    <button 
                        onClick={onPreviousMonth}
                        className="p-2 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                    >
                        ←
                    </button>
                    <button 
                        onClick={onNextMonth}
                        className="p-2 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                    >
                        →
                    </button>
                    <div className="min-w-[140px] text-center text-xl font-medium text-gray-100">
                        {format(currentDate, 'yyyy年 M月', { locale: ja })}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={onCreateSchedule}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                    + 作成
                </button>
                <button className="p-2 text-gray-400 hover:bg-gray-700 rounded transition-colors">
                    🔍
                </button>
                <button className="p-2 text-gray-400 hover:bg-gray-700 rounded transition-colors">
                    ⚙️
                </button>
            </div>
        </div>
    );
}