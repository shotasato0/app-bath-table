import React, { createContext, useContext, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

const DragDropContext = createContext();

export const useDragDrop = () => {
    const context = useContext(DragDropContext);
    if (!context) {
        throw new Error('useDragDrop must be used within a DragDropProvider');
    }
    return context;
};

export default function DragDropProvider({ children }) {
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverTarget, setDragOverTarget] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // ドラッグ開始
    const handleDragStart = useCallback((e, item, type) => {
        setDraggedItem({ ...item, type });
        setIsDragging(true);
        
        // ドラッグ効果を設定
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ ...item, type }));
        
        // ドラッグ中のスタイルを適用
        if (e.target) {
            e.target.classList.add('dragging');
        }
    }, []);

    // ドラッグ終了
    const handleDragEnd = useCallback((e) => {
        setDraggedItem(null);
        setDragOverTarget(null);
        setIsDragging(false);
        
        // ドラッグ中のスタイルを削除
        if (e.target) {
            e.target.classList.remove('dragging');
        }
    }, []);

    // ドラッグオーバー（ドロップ可能エリア上）
    const handleDragOver = useCallback((e, targetInfo) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        setDragOverTarget(targetInfo);
    }, []);

    // ドラッグリーブ（ドロップ可能エリアを離れる）
    const handleDragLeave = useCallback((e) => {
        // 子要素に移動した場合は無視
        if (e.currentTarget.contains(e.relatedTarget)) {
            return;
        }
        
        setDragOverTarget(null);
    }, []);

    // ドロップ処理
    const handleDrop = useCallback((e, targetInfo) => {
        e.preventDefault();
        
        if (!draggedItem) return;
        
        const droppedItem = draggedItem;
        const target = targetInfo;
        
        // 同じ場所にドロップした場合は何もしない
        if (droppedItem.type === 'schedule' && 
            droppedItem.column_type === target.columnType &&
            droppedItem.date === target.date) {
            return;
        }
        
        // ドロップタイプに応じて処理を分岐
        if (droppedItem.type === 'resident') {
            handleResidentDrop(droppedItem, target);
        } else if (droppedItem.type === 'schedule') {
            handleScheduleDrop(droppedItem, target);
        }
        
        setDraggedItem(null);
        setDragOverTarget(null);
    }, [draggedItem]);

    // 利用者をドロップした場合の処理
    const handleResidentDrop = useCallback((resident, target) => {
        // 新しい予定を作成
        const newSchedule = {
            resident_id: resident.id,
            date: target.date,
            column_type: target.columnType,
            title: target.columnType === 'bathing' 
                ? `${resident.name}さんの入浴`
                : `${resident.name}さんの予定`,
            start_time: target.suggestedTime || '09:00',
            end_time: target.suggestedEndTime || '10:00',
            type: target.columnType === 'bathing' ? 'bathing' : 'general'
        };

        // サーバーに送信
        router.post('/schedules', newSchedule, {
            onSuccess: () => {
                console.log('予定が作成されました');
            },
            onError: (errors) => {
                console.error('予定の作成に失敗しました:', errors);
            }
        });
    }, []);

    // 予定をドロップした場合の処理
    const handleScheduleDrop = useCallback((schedule, target) => {
        // 予定を移動
        const updatedSchedule = {
            ...schedule,
            date: target.date,
            column_type: target.columnType,
            start_time: target.suggestedTime || schedule.start_time,
            end_time: target.suggestedEndTime || schedule.end_time
        };

        // サーバーに送信
        router.put(`/schedules/${schedule.id}`, updatedSchedule, {
            onSuccess: () => {
                console.log('予定が移動されました');
            },
            onError: (errors) => {
                console.error('予定の移動に失敗しました:', errors);
            }
        });
    }, []);

    // ドラッグ可能な要素の設定
    const makeDraggable = useCallback((item, type) => {
        return {
            draggable: true,
            onDragStart: (e) => handleDragStart(e, item, type),
            onDragEnd: handleDragEnd
        };
    }, [handleDragStart, handleDragEnd]);

    // ドロップ可能な要素の設定
    const makeDroppable = useCallback((targetInfo) => {
        return {
            onDragOver: (e) => handleDragOver(e, targetInfo),
            onDragLeave: handleDragLeave,
            onDrop: (e) => handleDrop(e, targetInfo)
        };
    }, [handleDragOver, handleDragLeave, handleDrop]);

    // ドラッグ中のスタイル取得
    const getDragStyles = useCallback((item, type) => {
        const isDraggedItem = draggedItem && 
            draggedItem.id === item.id && 
            draggedItem.type === type;
        
        return {
            opacity: isDraggedItem ? 0.5 : 1,
            transform: isDraggedItem ? 'rotate(5deg)' : 'none',
            transition: 'all 0.2s ease'
        };
    }, [draggedItem]);

    // ドロップターゲットのスタイル取得
    const getDropTargetStyles = useCallback((targetInfo) => {
        const isCurrentTarget = dragOverTarget && 
            dragOverTarget.date === targetInfo.date &&
            dragOverTarget.columnType === targetInfo.columnType;
        
        return {
            backgroundColor: isCurrentTarget ? '#e0f2fe' : 'transparent',
            border: isCurrentTarget ? '2px dashed #0284c7' : '2px dashed transparent',
            minHeight: '60px',
            transition: 'all 0.2s ease'
        };
    }, [dragOverTarget]);

    const contextValue = {
        // 状態
        draggedItem,
        dragOverTarget,
        isDragging,
        
        // ハンドラー
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        
        // ヘルパー関数
        makeDraggable,
        makeDroppable,
        getDragStyles,
        getDropTargetStyles
    };

    return (
        <DragDropContext.Provider value={contextValue}>
            <div className={`${isDragging ? 'dragging-active' : ''}`}>
                {children}
            </div>
        </DragDropContext.Provider>
    );
}