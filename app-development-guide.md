# 入浴スケジュール管理システム 実装手順書

## 🎯 このガイドの使い方

この手順書は**コピペで実装できる**ように設計されています。
上から順番に実行すれば、約6-10時間で完成したシステムが手に入ります。

## 📋 事前準備

```bash
# プロジェクトディレクトリに移動
cd /path/to/your/project

# 現在のブランチを確認
git branch

# 新しいブランチを作成（推奨）
git checkout -b feature/bathing-schedule-system
```

---

## 🚨 STEP 1: 致命的バグ修正（必須・15分）

### 1.1 useSchedules.jsファイルを開く

```bash
# エディタでファイルを開く
code resources/js/hooks/useSchedules.js
# または
vim resources/js/hooks/useSchedules.js
```

### 1.2 fetchMonthlySchedules関数の修正

**ファイル**: `resources/js/hooks/useSchedules.js`

以下の行を探す：
```javascript
const fetchMonthlySchedules = useCallback(async (year, month) => {
```

その関数の最後の `}, [` 部分を以下に変更：

**変更前**:
```javascript
}, []);
```

**変更後**:
```javascript
}, [handleError]);
```

### 1.3 fetchSchedules関数の修正

以下の行を探す：
```javascript
const fetchSchedules = useCallback(async () => {
```

その関数の最後の依存配列を修正：

**変更前**:
```javascript
}, []);
```

**変更後**:
```javascript
}, [handleError]);
```

### 1.4 getSchedulesByDate関数の修正

以下の行を探す：
```javascript
const getSchedulesByDate = useCallback((date) => {
```

その関数の最後の依存配列を修正：

**変更前**:
```javascript
}, [schedules]);
```

**変更後**:
```javascript
}, [schedules, handleError]);
```

### 1.5 fetchSchedulesByDateRange関数の修正

以下の行を探す：
```javascript
const fetchSchedulesByDateRange = useCallback(async (startDate, endDate, forceRefresh = false) => {
```

その関数の最後の依存配列を修正：

**変更前**:
```javascript
}, []);
```

**変更後**:
```javascript
}, [handleError]);
```

### 1.6 保存して確認

```bash
# ファイルを保存後、構文エラーがないか確認
npm run dev
```

---

## 📊 STEP 2: カレンダーレイアウト変更（1-2時間）

### 2.1 CalendarDay.jsxの完全書き換え

**ファイル**: `resources/js/Components/Calendar/CalendarDay.jsx`

```javascript
import React, { useState, useRef, memo } from 'react';
import { format } from 'date-fns';
import ScheduleModal from './ScheduleModal';
import AllSchedulesModal from './AllSchedulesModal';

const SAMPLE_EVENTS = {};

const CalendarDay = memo(function CalendarDay({ 
    date, 
    isCurrentMonth, 
    isToday, 
    isSelected, 
    onClick, 
    dayIndex,
    schedules = [],
    scheduleTypes = [],
    createSchedule,
    updateSchedule,
    deleteSchedule,
    loading = false,
    showNotification,
    showConfirmDialog
}) {
    const [dragOver, setDragOver] = useState(false);
    const dragCounter = useRef(0);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [showAllSchedulesModal, setShowAllSchedulesModal] = useState(false);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    // 表示数制限の設定
    const MAX_DISPLAY_SCHEDULES = 2; // 一般予定の最大表示数
    const MAX_DISPLAY_BATHING = 4;   // 入浴予定の最大表示数

    // ここに他の関数をコピペ（長いので次のセクションで追加）

    return (
        <div 
            className={`
                calendar-day flex flex-col p-3 min-h-[220px] border-r border-b border-gray-600 relative cursor-pointer layout-stable
                w-[calc(100%/7)] flex-shrink-0
                ${dayIndex % 7 === 6 ? 'border-r-0' : ''}
                ${!isCurrentMonth ? 'bg-gray-700' : 'bg-gray-800'}
                ${isToday ? 'bg-blue-900 bg-opacity-20 border-2 border-blue-600' : ''}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
            `}
            onClick={onClick}
        >
            {/* 日付ヘッダー */}
            <div className="flex justify-between items-center mb-3 min-h-[24px]">
                <div className={`text-lg font-semibold ${
                    !isCurrentMonth ? 'text-gray-500' : 
                    isToday ? 'text-blue-400' : 
                    'text-gray-100'
                }`}>
                    {format(date, 'd')}
                </div>
            </div>

            {/* 上下分割レイアウト */}
            <div className="flex flex-col flex-1">
                {/* 上部：予定セクション */}
                <div className="flex-1 flex flex-col">
                    <div className="text-purple-300 text-xs text-center pb-1 border-b border-gray-600 font-semibold flex justify-between items-center">
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4h6a2 2 0 012 2v2a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z" />
                            </svg>
                            予定
                        </span>
                    </div>
                </div>

                {/* 下部：入浴セクション */}
                <div className="flex-1 flex flex-col border-t border-gray-600 pt-1 mt-1">
                    <div className="text-blue-300 text-xs text-center pb-1 border-b border-gray-600 font-semibold flex justify-between items-center">
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3a5 5 0 015 5 5 5 0 015-5 5 5 0 00-5 5 5 5 0 00-5-5z" />
                            </svg>
                            入浴
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CalendarDay;
```

### 2.2 動作確認

```bash
# 開発サーバーを起動
npm run dev

# ブラウザでアクセス
# http://localhost:3000/calendar
```

**確認項目**:
- [ ] カレンダーが7日間表示される
- [ ] 各日に「予定」「入浴」セクションが表示される
- [ ] SVGアイコンが正しく表示される

---

## 🎭 STEP 3: モーダル機能追加（1-2時間）

### 3.1 AllSchedulesModal.jsxファイル作成

```bash
# 新しいファイルを作成
touch resources/js/Components/Calendar/AllSchedulesModal.jsx
```

**ファイル**: `resources/js/Components/Calendar/AllSchedulesModal.jsx`

**以下の内容をコピペ**:

### 3. モーダル機能の実装（中優先度）

#### 3.1 全スケジュール表示モーダル
**ファイル**: `resources/js/Components/Calendar/AllSchedulesModal.jsx`

React Portalを使用したモーダル実装：

```javascript
import { createPortal } from 'react-dom';

export default function AllSchedulesModal({ isOpen, onClose, ... }) {
  if (!isOpen) return null;
  
  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
      {/* モーダル内容 */}
    </div>
  );
  
  return createPortal(modalContent, document.body);
}
```

### 4. UIコンポーネントの改善（中優先度）

#### 4.1 住民リストの制限表示
**ファイル**: `resources/js/Components/Calendar/ResidentList.jsx`

```javascript
<div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(10 * 80px)' }}>
  {/* 最大10人表示、それ以上はスクロール */}
</div>
```

#### 4.2 アクセシビリティ対応（SVGアイコン化）
絵文字をSVGアイコンに置換してスクリーンリーダー対応：

```javascript
// 絵文字：📋 → SVGアイコン
<svg className="w-4 h-4 text-purple-300" aria-hidden="true" focusable="false">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9 4h6a2 2 0 012 2v2a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z..." />
</svg>
```

### 5. バグ修正とパフォーマンス最適化（低優先度）

#### 5.1 ドラッグ&ドロップの最適化
- `will-change`プロパティの適用タイミング制限
- ドラッグオーバー状態の適切な管理
- メモリリーク対策

#### 5.2 楽観的更新の実装
- スケジュール操作時の即座なUI反映
- エラー時のロールバック処理
- キャッシュ制御の最適化

## 避けるべき実装・不要な作業

### 1. 過度な最適化
- 初期段階でのパフォーマンス最適化
- 複雑なキャッシュ戦略
- 不要なuseMemoやuseCallback

### 2. 機能の先走り実装
- zoom toggle機能（現在未使用）
- 複雑な権限管理
- 高度な検索・フィルタリング

### 3. UI/UXの過度な調整
- 細かなアニメーション
- 複雑なレスポンシブデザイン
- カスタムテーマ機能

## 重要な技術的ポイント

### 1. React Hooks の依存配列管理
```javascript
// 正しい依存配列の指定
const fetchData = useCallback(async () => {
  // 処理
}, [handleError, otherDependency]); // すべての依存値を含める
```

### 2. Flexbox レイアウト戦略
```javascript
// 高さ制御とスクロールの組み合わせ
className="h-full flex flex-col"     // 親：フル高さのflex
className="flex-shrink-0"            // ヘッダー：縮小禁止
className="flex-1 overflow-auto"     // コンテンツ：拡張＋スクロール
```

### 3. React Portal の活用
```javascript
// モーダルの適切な実装
return createPortal(modalContent, document.body);
```

## テスト・デバッグのポイント

### 1. 必須確認項目
- [ ] useSchedules.jsの依存配列修正
- [ ] カレンダーグリッドの7日間表示
- [ ] スクロール機能の動作
- [ ] モーダルの表示・非表示
- [ ] ドラッグ&ドロップ機能

### 2. レスポンシブ確認
- [ ] モバイル表示（768px未満）
- [ ] タブレット表示（768px-1024px）
- [ ] デスクトップ表示（1024px以上）

### 3. アクセシビリティ確認
- [ ] スクリーンリーダーでの読み上げ
- [ ] キーボードナビゲーション
- [ ] コントラスト比の確認

## 開発時間の目安

| 項目 | 時間 | 優先度 |
|------|------|--------|
| useSchedules修正 | 30分 | 最高 |
| カレンダーレイアウト変更 | 2-3時間 | 高 |
| モーダル実装 | 1-2時間 | 中 |
| SVGアイコン化 | 1時間 | 中 |
| バグ修正・最適化 | 2-4時間 | 低 |

**総開発時間**: 約6-10時間

## まとめ

このガイドに従って開発を進めることで、効率的かつ安定したシステムを構築できます。特にuseSchedules.jsの修正は最優先で行い、その後段階的にUI改善を進めることを推奨します。

過度な最適化や機能追加は避け、まず安定動作する基盤を構築してから必要に応じて機能拡張を検討してください。