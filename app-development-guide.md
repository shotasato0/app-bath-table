# 入浴スケジュール管理システム開発ガイド

このドキュメントは、入浴スケジュール管理システムの開発で実際に実装した機能と最適な開発手順をまとめたものです。

## システム概要

React + Laravel Inertia.jsベースの介護施設向け入浴スケジュール管理システム。カレンダーUIでの直感的なスケジュール管理と住民管理機能を提供。

## 開発の優先順位と最適手順

### 1. 基盤修正（必須・最優先）

#### 1.1 useSchedules.jsのクロージャ問題修正
**ファイル**: `resources/js/hooks/useSchedules.js`

以下4つの関数の依存配列にhandleErrorを追加：
- `fetchMonthlySchedules`
- `fetchSchedules` 
- `getSchedulesByDate`
- `fetchSchedulesByDateRange`

```javascript
// 修正例
const fetchMonthlySchedules = useCallback(async (year, month) => {
  // ... 処理
}, [handleError]); // handleErrorを依存配列に追加
```

**理由**: クロージャによる古い状態参照を防ぎ、メモリリークとバグを防止

### 2. カレンダーレイアウト改善（高優先度）

#### 2.1 上下分割レイアウトの実装
**ファイル**: `resources/js/Components/Calendar/CalendarDay.jsx`

- 従来の左右分割から上下分割に変更
- 上部：一般予定（最大2件表示）
- 下部：入浴予定（最大4件表示）
- 表示制限超過時は「他X件」ボタンで全件表示モーダル

```javascript
// 表示数制限の設定
const MAX_DISPLAY_SCHEDULES = 2; // 一般予定
const MAX_DISPLAY_BATHING = 4;   // 入浴予定
```

#### 2.2 レスポンシブレイアウトの最適化
**ファイル**: `resources/js/Components/Calendar/CalendarGrid.jsx`

```javascript
// Flexレイアウトの実装
<div className="bg-gray-800 rounded-lg overflow-hidden h-full flex flex-col">
  <div className="flex w-full border-b border-gray-600 flex-shrink-0">
    {/* 固定曜日ヘッダー */}
  </div>
  <div className="flex flex-wrap w-full flex-1 min-h-0 overflow-auto">
    {/* スクロール可能なカレンダーグリッド */}
  </div>
</div>
```

#### 2.3 独立スクロール機能の実装
**ファイル**: `resources/js/Components/Calendar/Calendar.jsx`

```javascript
<div className="flex gap-3 h-[calc(100vh-100px)]">
  <div className="hidden md:block w-60 flex-shrink-0 overflow-y-auto bg-gray-900">
    {/* サイドバー独立スクロール */}
  </div>
  <div className="flex-1 overflow-auto">
    {/* カレンダー独立スクロール */}
  </div>
</div>
```

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