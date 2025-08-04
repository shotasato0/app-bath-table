# 🔧 Phase 6: 品質向上・バグ修正

このドキュメントでは、実際の開発で発生した **バグの修正** と **パフォーマンス改善** の実装手順を説明します。

## 📋 この段階の目標

- **バグ修正**: 実際に発生したローディングループ・バリデーション不具合の解決
- **パフォーマンス改善**: React Hook の最適化・レンダリング効率化
- **コード品質向上**: リファクタリング・コードクリーンアップ
- **運用安定性**: エラーハンドリング・フォールバック処理の強化

## 🎯 解決する問題

この段階で修正する **実際のバグと問題**：

```
修正対象
├── ローディングループ: useEffect依存配列の問題
├── スケジュールバリデーション: end_time未入力時の不具合
├── 複雑化したコンポーネント: 過度に複雑になったCalendarDay
└── UI/UX改善: レイアウト・アイコン・アクセシビリティ
```

## 💡 学習ポイント

この段階で身につく技術・知識：

- **React Hook デバッグ** の実践的手法
- **無限ループ** の原因特定と解決方法
- **バリデーション設計** の落とし穴と対策
- **コンポーネント設計** の改善手法
- **パフォーマンス最適化** の実践

## 🚀 実装手順

### Step 1: ローディングループのデッドロック修正

#### 1.1 問題の特定

実際のバグ：useEffectの依存配列が原因で無限レンダリングが発生

```jsx
// ❌ 問題のあるコード (修正前)
// resources/js/Pages/Calendar/Index.jsx

export default function CalendarIndex({ events, residents }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ❌ 毎回新しい関数が作成されて依存配列で無限ループ
    const handleError = (error) => {
        setError(error);
        setLoading(false);
    };

    const fetchSchedulesByDateRange = async (startDate, endDate) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/schedules?start=${startDate}&end=${endDate}`);
            const data = await response.json();
            // データ処理...
        } catch (error) {
            handleError(error); // ❌ 依存配列に含まれると無限ループ
        }
    };

    useEffect(() => {
        fetchSchedulesByDateRange(startDate, endDate);
    }, [startDate, endDate, handleError]); // ❌ handleErrorが含まれる

    return (
        // カレンダーコンポーネント...
    );
}
```

#### 1.2 修正版の実装

```jsx
// ✅ 修正後のコード
// resources/js/Pages/Calendar/Index.jsx

// useState: ローディング・エラー状態管理
// useEffect: 副作用処理（データ取得・クリーンアップ）
// useCallback: 関数メモ化（無限ループ防止）
// useRef: タイムアウトID管理（DOM参照ではなく値の保持用）
import { useState, useEffect, useCallback, useRef } from 'react';

export default function CalendarIndex({ events, residents }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scheduleData, setScheduleData] = useState(events);
    
    // ✅ useRefでタイムアウトIDを管理
    const loadingTimeoutRef = useRef(null);

    // ✅ useCallbackで関数をメモ化し、依存配列を最小限に
    const handleError = useCallback((error) => {
        console.error('Calendar error:', error);
        setError(error.message || 'エラーが発生しました');
        setLoading(false);
        
        // ✅ タイムアウトのクリア処理を安全に実行
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
        }
    }, []); // ✅ 依存配列は空

    // ✅ データ取得関数もuseCallbackでメモ化
    const fetchSchedulesByDateRange = useCallback(async (startDate, endDate) => {
        if (loading) return; // ✅ 重複リクエスト防止

        setLoading(true);
        setError(null);

        // ✅ ローディングタイムアウト設定（10秒）
        loadingTimeoutRef.current = setTimeout(() => {
            handleError(new Error('読み込みがタイムアウトしました'));
        }, 10000);

        try {
            const response = await router.get(route('calendar.index'), {
                year: moment(startDate).year(),
                month: moment(startDate).month() + 1,
            }, {
                preserveState: true,
                onSuccess: (page) => {
                    setScheduleData(page.props.events);
                    setLoading(false);
                    
                    // ✅ 成功時のタイムアウトクリア
                    if (loadingTimeoutRef.current) {
                        clearTimeout(loadingTimeoutRef.current);
                        loadingTimeoutRef.current = null;
                    }
                },
                onError: (errors) => {
                    handleError(new Error('データの取得に失敗しました'));
                }
            });
        } catch (error) {
            handleError(error);
        }
    }, [loading, handleError]); // ✅ 最小限の依存配列

    // ✅ クリーンアップ処理
    useEffect(() => {
        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, []);

    // ✅ 日付変更時のデータ取得
    useEffect(() => {
        fetchSchedulesByDateRange(startDate, endDate);
    }, [startDate, endDate]); // ✅ fetchSchedulesByDateRangeは含めない

    return (
        <AuthenticatedLayout user={user}>
            <Head title="カレンダー" />

            {/* ✅ エラー表示 */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-red-800 text-sm">
                        {error}
                        <button 
                            onClick={() => setError(null)}
                            className="ml-2 text-red-600 hover:text-red-800 underline"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ ローディング表示 */}
            {loading && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-blue-800 text-sm flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        スケジュールを読み込み中...
                    </div>
                </div>
            )}

            {/* カレンダー本体 */}
            <Calendar 
                events={scheduleData}
                // その他のprops...
            />
        </AuthenticatedLayout>
    );
}
```

### Step 2: スケジュールバリデーション不具合の修正

#### 2.1 問題の特定

バリデーション不具合：`all_day=false` の時に `end_time` が未入力でも通過してしまう

```php
// ❌ 問題のあるバリデーション (修正前)
// app/Http/Requests/ScheduleRequest.php

public function rules(): array
{
    return [
        'title' => 'required|string|max:200',
        'description' => 'nullable|string',
        'date' => 'required|date',
        'start_time' => 'nullable|date_format:H:i',
        'end_time' => 'nullable|date_format:H:i', // ❌ all_dayの状態を考慮していない
        'all_day' => 'boolean',
        'schedule_type_id' => 'required|exists:schedule_types,id',
        'resident_id' => 'nullable|exists:residents,id',
    ];
}
```

#### 2.2 修正版のバリデーション

```php
// ✅ 修正後のバリデーション
// app/Http/Requests/ScheduleRequest.php

public function rules(): array
{
    return [
        'title' => 'required|string|max:200',
        'description' => 'nullable|string',
        'date' => 'required|date',
        'start_time' => [
            'nullable',
            'date_format:H:i',
            // ✅ all_day=falseの時は必須
            Rule::requiredIf(function () {
                return !$this->boolean('all_day');
            }),
        ],
        'end_time' => [
            'nullable',
            'date_format:H:i',
            // ✅ all_day=falseの時は必須
            Rule::requiredIf(function () {
                return !$this->boolean('all_day');
            }),
            // ✅ start_timeより後である必要がある
            'after:start_time',
        ],
        'all_day' => 'boolean',
        'schedule_type_id' => 'required|exists:schedule_types,id',
        'resident_id' => 'nullable|exists:residents,id',
    ];
}

// ✅ カスタムバリデーションメッセージ
public function messages(): array
{
    return [
        'start_time.required_if' => '時間指定の場合、開始時刻は必須です。',
        'end_time.required_if' => '時間指定の場合、終了時刻は必須です。',
        'end_time.after' => '終了時刻は開始時刻より後である必要があります。',
    ];
}

// ✅ バリデーション後の追加チェック
public function withValidator($validator)
{
    $validator->after(function ($validator) {
        // 時間指定の場合の論理チェック
        if (!$this->boolean('all_day')) {
            $startTime = $this->input('start_time');
            $endTime = $this->input('end_time');
            
            if ($startTime && $endTime) {
                $start = Carbon::createFromFormat('H:i', $startTime);
                $end = Carbon::createFromFormat('H:i', $endTime);
                
                // ✅ 時間の論理チェック
                if ($end->lte($start)) {
                    $validator->errors()->add('end_time', '終了時刻は開始時刻より後である必要があります。');
                }
                
                // ✅ 非現実的な長時間スケジュールのチェック
                $diffInHours = $end->diffInHours($start);
                if ($diffInHours > 8) {
                    $validator->errors()->add('end_time', 'スケジュールの時間は8時間以内で設定してください。');
                }
            }
        }
    });
}
```

### Step 3: 複雑化したコンポーネントのリファクタリング

#### 3.1 問題の特定

CalendarDayコンポーネントが過度に複雑になり、保守性が低下

```jsx
// ❌ 複雑化したコンポーネント (修正前)
// resources/js/Components/Calendar/CalendarDay.jsx

export default function CalendarDay({ date, schedules, onEventClick, onDateClick }) {
    // ❌ 1つのコンポーネントに多すぎる責任
    const [showAllSchedules, setShowAllSchedules] = useState(false);
    const [bathSchedules, setBathSchedules] = useState([]);
    const [otherSchedules, setOtherSchedules] = useState([]);
    const [isToday, setIsToday] = useState(false);
    
    // ❌ 複雑な計算ロジックがコンポーネント内に
    useEffect(() => {
        const baths = schedules.filter(s => s.scheduleType?.name === '入浴');
        const others = schedules.filter(s => s.scheduleType?.name !== '入浴');
        setBathSchedules(baths);
        setOtherSchedules(others);
        setIsToday(moment(date).isSame(moment(), 'day'));
    }, [schedules, date]);

    // ❌ 長大なJSX
    return (
        <div className={`border p-2 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
            {/* 300行以上の複雑なJSX... */}
            {/* 日付表示 */}
            {/* 入浴スケジュール */}
            {/* その他スケジュール */}
            {/* モーダル */}
        </div>
    );
}
```

#### 3.2 リファクタリング後の設計

```jsx
// ✅ リファクタリング後 - 責任を分離
// resources/js/Components/Calendar/CalendarDay.jsx

export default function CalendarDay({ date, schedules, onEventClick, onDateClick }) {
    const dayInfo = useDayInfo(date);
    const { bathSchedules, otherSchedules } = useSchedulesByType(schedules);
    const [showAllModal, setShowAllModal] = useState(false);

    return (
        <div 
            className={`border rounded-lg p-3 min-h-[120px] cursor-pointer transition-colors
                ${dayInfo.isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'}
            `}
            onClick={() => onDateClick(date)}
        >
            {/* 日付ヘッダー */}
            <CalendarDayHeader date={date} dayInfo={dayInfo} />
            
            {/* 入浴スケジュール専用セクション */}
            <ScheduleSection 
                title="入浴"
                schedules={bathSchedules}
                maxDisplay={2}
                onEventClick={onEventClick}
                color="blue"
            />
            
            {/* その他スケジュール */}
            <ScheduleSection 
                title="その他"
                schedules={otherSchedules}
                maxDisplay={3}
                onEventClick={onEventClick}
                color="gray"
            />
            
            {/* 全件表示ボタン */}
            {schedules.length > 5 && (
                <ShowAllButton 
                    count={schedules.length - 5}
                    onClick={() => setShowAllModal(true)}
                />
            )}
            
            {/* 全スケジュール表示モーダル */}
            <AllSchedulesModal 
                isOpen={showAllModal}
                onClose={() => setShowAllModal(false)}
                date={date}
                schedules={schedules}
                onEventClick={onEventClick}
            />
        </div>
    );
}

// ✅ カスタムフック - ロジックを分離
function useDayInfo(date) {
    return useMemo(() => ({
        isToday: moment(date).isSame(moment(), 'day'),
        isWeekend: moment(date).day() === 0 || moment(date).day() === 6,
        dayNumber: moment(date).format('D'),
        dayOfWeek: moment(date).format('ddd'),
    }), [date]);
}

function useSchedulesByType(schedules) {
    return useMemo(() => ({
        bathSchedules: schedules.filter(s => s.scheduleType?.name === '入浴'),
        otherSchedules: schedules.filter(s => s.scheduleType?.name !== '入浴'),
    }), [schedules]);
}
```

#### 3.3 分離されたコンポーネント

```jsx
// ✅ 単一責任のコンポーネント
// resources/js/Components/Calendar/CalendarDayHeader.jsx

export default function CalendarDayHeader({ date, dayInfo }) {
    return (
        <div className="flex justify-between items-center mb-2">
            <span className={`text-lg font-semibold ${
                dayInfo.isToday ? 'text-blue-700' : 
                dayInfo.isWeekend ? 'text-gray-500' : 'text-gray-900'
            }`}>
                {dayInfo.dayNumber}
            </span>
            <span className="text-xs text-gray-500">
                {dayInfo.dayOfWeek}
            </span>
        </div>
    );
}

// resources/js/Components/Calendar/ScheduleSection.jsx
export default function ScheduleSection({ 
    title, 
    schedules, 
    maxDisplay, 
    onEventClick, 
    color 
}) {
    if (schedules.length === 0) return null;

    const displaySchedules = schedules.slice(0, maxDisplay);
    const hiddenCount = schedules.length - maxDisplay;

    return (
        <div className="mb-2">
            <div className="flex items-center mb-1">
                <div className={`w-2 h-2 rounded-full bg-${color}-500 mr-1`}></div>
                <span className="text-xs font-medium text-gray-700">{title}</span>
            </div>
            <div className="space-y-1">
                {displaySchedules.map((schedule) => (
                    <ScheduleItem 
                        key={schedule.id}
                        schedule={schedule}
                        onClick={() => onEventClick(schedule)}
                    />
                ))}
                {hiddenCount > 0 && (
                    <div className="text-xs text-gray-500">
                        他{hiddenCount}件
                    </div>
                )}
            </div>
        </div>
    );
}
```

### Step 4: UI/UX改善

#### 4.1 アイコンの改善

```jsx
// ✅ SVGアイコンの実装
// resources/js/Components/Icons/TrashIcon.jsx

export default function TrashIcon({ className = "w-4 h-4" }) {
    return (
        <svg 
            className={className} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
            />
        </svg>
    );
}

// resources/js/Components/Icons/EditIcon.jsx
export default function EditIcon({ className = "w-4 h-4" }) {
    return (
        <svg 
            className={className} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
        >
            <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
            />
        </svg>
    );
}
```

#### 4.2 レスポンシブレイアウトの改善

```jsx
// ✅ 改善されたレイアウト
// resources/js/Components/Calendar/CalendarGrid.jsx

export default function CalendarGrid({ children }) {
    return (
        <div className="flex flex-col h-full">
            {/* 曜日ヘッダー - 固定 */}
            <div className="grid grid-cols-7 border-b bg-gray-50 sticky top-0 z-10">
                {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                    <div 
                        key={day} 
                        className={`p-3 text-center text-sm font-medium ${
                            index === 0 ? 'text-red-600' : 
                            index === 6 ? 'text-blue-600' : 'text-gray-700'
                        }`}
                    >
                        {day}
                    </div>
                ))}
            </div>
            
            {/* カレンダーグリッド - スクロール可能 */}
            <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-7 min-h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
```

### Step 5: エラーハンドリングの強化

#### 5.1 グローバルエラーハンドラー

```jsx
// resources/js/Utils/ErrorHandler.js

class ErrorHandler {
    static handle(error, context = '') {
        console.error(`[${context}] Error:`, error);
        
        // エラーの種類に応じて適切な処理
        if (error.response) {
            return this.handleHttpError(error.response);
        } else if (error.name === 'ValidationError') {
            return this.handleValidationError(error);
        } else {
            return this.handleGenericError(error);
        }
    }

    static handleHttpError(response) {
        const status = response.status;
        const errorMessages = {
            400: 'リクエストが正しくありません。',
            401: 'ログインが必要です。',
            403: 'アクセス権限がありません。',
            404: 'データが見つかりません。',
            422: 'バリデーションエラーが発生しました。',
            500: 'サーバーエラーが発生しました。管理者にお問い合わせください。',
        };

        return {
            message: errorMessages[status] || `エラーが発生しました (${status})`,
            code: status,
            details: response.data
        };
    }

    static handleValidationError(error) {
        return {
            message: 'バリデーションエラー',
            code: 'validation',
            details: error.errors
        };
    }

    static handleGenericError(error) {
        return {
            message: error.message || 'エラーが発生しました。',
            code: 'generic',
            details: error
        };
    }
}

export default ErrorHandler;
```

## ✅ 確認方法

Phase 6 が完了したら、以下を確認してください：

### バグ修正の確認

```bash
# 開発サーバー起動
./vendor/bin/sail up -d
npm run dev

# ブラウザでテスト
# - カレンダーの日付切り替えが正常動作するか
# - スケジュール作成で適切なバリデーションが働くか
# - ローディング状態が適切に表示されるか
```

### パフォーマンス確認

```bash
# ブラウザの開発者ツールでパフォーマンス測定
# F12 → Performance タブで録画・分析
```

### コード品質確認

```bash
# ESLintでコード品質チェック
npm run lint

# PHPStanでPHPコード品質をチェック（設定済みの場合）
./vendor/bin/sail composer analyze
```

## 🎯 完成度チェック

Phase 6 が正常に完了したら、全体の動作を確認してください：

- [ ] ローディングループが解消されている
- [ ] バリデーションが適切に動作している
- [ ] コンポーネントが適切に分離されている
- [ ] エラーハンドリングが強化されている
- [ ] UI/UXが改善されている

## 🎉 プロジェクト完成

**おめでとうございます！** 

Phase 1〜6 を通じて、以下の包括的なアプリケーションが完成しました：

```
完成したアプリケーション
├── 🗃️ データベース基盤: 7つのテーブルと適切なリレーション
├── 🔐 認証システム: username認証・日本語UI・権限管理
├── 🌱 サンプルデータ: リアルな介護施設データ
├── 📅 カレンダーUI: React・日本語化・レスポンシブ対応
├── 👥 住民管理: CRUD・検索・スケジュール連携
└── 🔧 品質保証: バグ修正・パフォーマンス改善
```

**次のステップ**: [学習支援資料](../learning/) で、さらなるスキルアップを目指しましょう！

---

**💡 Phase 6 のポイント**: 
- **実践的デバッグ**: 実際のバグを通じた問題解決スキル
- **品質重視**: コード品質・パフォーマンス・保守性の改善
- **継続的改善**: リファクタリングとベストプラクティスの適用
- **運用安定性**: エラーハンドリングとフォールバック処理の重要性