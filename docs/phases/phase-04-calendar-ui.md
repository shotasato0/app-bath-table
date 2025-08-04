# 📅 Phase 4: カレンダーUI実装

このドキュメントでは、React + Inertia.js を使った **モダンなカレンダーUI** の実装手順を段階的に説明します。

## 📋 この段階の目標

- **react-big-calendar統合**: プロフェッショナルなカレンダーライブラリの活用
- **日本語対応カレンダー**: moment.js による完全日本語化
- **レスポンシブデザイン**: モバイル・タブレット対応
- **リアルタイム更新**: サーバーデータとの同期

## 🎯 実装する機能

この段階で実装する **カレンダーシステム**：

```
カレンダーUI
├── 月間ビュー: メインのカレンダー表示
├── 週間ビュー: 詳細スケジュール管理
├── 日間ビュー: 当日の詳細タイムライン
└── サイドバー: 住民リスト・統計情報
```

## 💡 学習ポイント

この段階で身につく技術・知識：

- **React Hooks** の実践的な活用
- **第三者ライブラリ** の統合方法
- **状態管理** の設計パターン
- **API連携** とデータ同期
- **UI/UX設計** の実践

## 🚀 実装手順

### Step 1: フロントエンド依存関係の追加

```bash
# React カレンダーライブラリとその依存関係をインストール
npm install react-big-calendar moment
npm install --save-dev @types/react-big-calendar
```

### Step 2: バックエンドAPI の実装

#### 2.1 カレンダーコントローラーの作成

```bash
./vendor/bin/sail artisan make:controller CalendarController
```

```php
// app/Http/Controllers/CalendarController.php

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // クエリパラメータから年月を取得
        $year = $request->get('year', Carbon::now()->year);
        $month = $request->get('month', Carbon::now()->month);
        
        // 月の範囲を計算
        $startOfMonth = Carbon::create($year, $month, 1);
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        
        // カレンダー表示用に前後の日付も含める
        $startOfCalendar = $startOfMonth->copy()->startOfWeek(Carbon::SUNDAY);
        $endOfCalendar = $endOfMonth->copy()->endOfWeek(Carbon::SATURDAY);

        // スケジュール取得（N+1問題を回避）
        $schedules = Schedule::with(['scheduleType', 'resident', 'creator'])
            ->whereBetween('date', [
                $startOfCalendar->format('Y-m-d'),
                $endOfCalendar->format('Y-m-d')
            ])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        // react-big-calendar用にイベントデータを整形
        $events = $schedules->map(function ($schedule) {
            $startDateTime = $schedule->all_day 
                ? $schedule->date . ' 00:00:00'
                : $schedule->date . ' ' . $schedule->start_time;
                
            $endDateTime = $schedule->all_day
                ? $schedule->date . ' 23:59:59'
                : $schedule->date . ' ' . $schedule->end_time;

            return [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'start' => $startDateTime,
                'end' => $endDateTime,
                'allDay' => $schedule->all_day,
                'resource' => [
                    'schedule' => $schedule,
                    'type' => $schedule->scheduleType,
                    'resident' => $schedule->resident,
                    'creator' => $schedule->creator,
                ],
                'style' => [
                    'backgroundColor' => $schedule->scheduleType->color_code ?? '#3B82F6',
                    'borderColor' => $schedule->scheduleType->color_code ?? '#3B82F6',
                ],
            ];
        });

        return Inertia::render('Calendar/Index', [
            'user' => $user->load('department'),
            'events' => $events,
            'residents' => Resident::active()->orderBy('room_number')->get(),
            'scheduleTypes' => ScheduleType::orderBy('name')->get(),
            'currentMonth' => [
                'year' => $year,
                'month' => $month,
                'formatted' => $startOfMonth->format('Y年n月'),
            ],
            'monthStats' => $this->calculateMonthStats($schedules),
        ]);
    }

    private function calculateMonthStats($schedules)
    {
        return [
            'total_schedules' => $schedules->count(),
            'bath_schedules' => $schedules->where('scheduleType.name', '入浴')->count(),
            'rehabilitation_schedules' => $schedules->where('scheduleType.name', 'リハビリ')->count(),
            'recreation_schedules' => $schedules->where('scheduleType.name', 'レクリエーション')->count(),
        ];
    }
}
```

#### 2.2 ルート設定

```php
// routes/web.php

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // カレンダー関連ルート
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::get('/calendar/week', [CalendarController::class, 'week'])->name('calendar.week');
    Route::get('/calendar/{date}', [CalendarController::class, 'show'])->name('calendar.show');
});
```

### Step 3: React カレンダーコンポーネントの実装

#### 3.1 メインカレンダーページ

```jsx
// resources/js/Pages/Calendar/Index.jsx

import { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

// 日本語設定
moment.locale('ja');
const localizer = momentLocalizer(moment);

// カレンダーの日本語メッセージ
const messages = {
    allDay: '終日',
    previous: '前',
    next: '次',
    today: '今日',
    month: '月',
    week: '週',
    day: '日',
    agenda: '予定',
    date: '日付',
    time: '時刻',
    event: '予定',
    noEventsInRange: 'この期間には予定がありません。',
    showMore: (total) => `他${total}件`,
};

export default function CalendarIndex({ 
    user, 
    events, 
    residents, 
    scheduleTypes, 
    currentMonth, 
    monthStats 
}) {
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    // イベントクリック時の処理
    const handleSelectEvent = (event) => {
        console.log('Selected event:', event);
        // TODO: モーダル表示やページ遷移の実装
    };

    // 日付クリック時の処理
    const handleSelectSlot = (slotInfo) => {
        const selectedDate = moment(slotInfo.start).format('YYYY-MM-DD');
        console.log('Selected date:', selectedDate);
        // TODO: 新規スケジュール作成の実装
    };

    // 月変更時の処理
    const handleNavigate = (newDate) => {
        setDate(newDate);
        const year = moment(newDate).year();
        const month = moment(newDate).month() + 1;
        
        router.get(route('calendar.index'), { year, month });
    };

    // イベントスタイルのカスタマイズ
    const eventStyleGetter = (event) => {
        const backgroundColor = event.resource?.type?.color_code || '#3B82F6';
        
        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: '#fff',
                border: 'none',
                fontSize: '12px',
                padding: '2px 4px',
            }
        };
    };

    // 今日の日付ハイライト
    const dayPropGetter = (date) => {
        const today = moment().format('YYYY-MM-DD');
        const cellDate = moment(date).format('YYYY-MM-DD');
        
        if (cellDate === today) {
            return {
                style: {
                    backgroundColor: '#EBF8FF',
                    border: '2px solid #3182CE',
                }
            };
        }
        
        return {};
    };

    return (
        <AuthenticatedLayout user={user}>
            <Head title="カレンダー" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* 月間統計ダッシュボード */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-600">総スケジュール</div>
                            <div className="text-2xl font-bold text-blue-600">
                                {monthStats.total_schedules}件
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-600">入浴予定</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {monthStats.bath_schedules}件
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-600">リハビリ</div>
                            <div className="text-2xl font-bold text-green-600">
                                {monthStats.rehabilitation_schedules}件
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-600">レクリエーション</div>
                            <div className="text-2xl font-bold text-orange-600">
                                {monthStats.recreation_schedules}件
                            </div>
                        </div>
                    </div>

                    {/* レスポンシブ対応のカレンダーレイアウト */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        
                        {/* カレンダーメイン部分 */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-lg shadow border overflow-hidden">
                                <div className="p-4 border-b">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {currentMonth.formatted}
                                    </h2>
                                </div>
                                <div className="p-4">
                                    <Calendar
                                        localizer={localizer}
                                        events={events}
                                        startAccessor="start"
                                        endAccessor="end"
                                        style={{ height: 600 }}
                                        view={view}
                                        date={date}
                                        onNavigate={handleNavigate}
                                        onView={setView}
                                        onSelectEvent={handleSelectEvent}
                                        onSelectSlot={handleSelectSlot}
                                        selectable
                                        popup
                                        messages={messages}
                                        eventPropGetter={eventStyleGetter}
                                        dayPropGetter={dayPropGetter}
                                        formats={{
                                            dayFormat: 'D',
                                            monthHeaderFormat: 'YYYY年M月',
                                            dayHeaderFormat: 'M/D (ddd)',
                                            timeGutterFormat: 'HH:mm',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* サイドバー */}
                        <div className="lg:col-span-1">
                            <CalendarSidebar 
                                residents={residents}
                                scheduleTypes={scheduleTypes}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

#### 3.2 カレンダーサイドバーコンポーネント

```jsx
// resources/js/Components/Calendar/CalendarSidebar.jsx

export default function CalendarSidebar({ residents, scheduleTypes }) {
    return (
        <div className="space-y-6">
            
            {/* スケジュール種別凡例 */}
            <div className="bg-white rounded-lg shadow border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">スケジュール種別</h3>
                <div className="space-y-2">
                    {scheduleTypes.map((type) => (
                        <div key={type.id} className="flex items-center space-x-2">
                            <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: type.color_code }}
                            ></div>
                            <span className="text-sm text-gray-700">{type.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 住民一覧 */}
            <div className="bg-white rounded-lg shadow border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                    入居住民 ({residents.length}名)
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {residents.map((resident) => (
                        <div 
                            key={resident.id} 
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                        >
                            <div>
                                <div className="font-medium text-sm">{resident.name}</div>
                                <div className="text-xs text-gray-500">
                                    {resident.room_number}号室
                                </div>
                            </div>
                            <div className="text-xs text-gray-400">
                                {resident.gender === 'male' ? '👨' : resident.gender === 'female' ? '👩' : '👤'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* クイックアクション */}
            <div className="bg-white rounded-lg shadow border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">クイックアクション</h3>
                <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-md">
                        📅 新規スケジュール
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-md">
                        👥 住民管理
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 rounded-md">
                        📊 レポート表示
                    </button>
                </div>
            </div>
        </div>
    );
}
```

### Step 4: レスポンシブ対応とモバイル最適化

#### 4.1 モバイル専用カレンダーコンポーネント

```jsx
// resources/js/Components/Calendar/MobileCalendar.jsx

import { useState } from 'react';
import moment from 'moment';

export default function MobileCalendar({ events, currentMonth }) {
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    
    // 月のカレンダーグリッド生成
    const generateCalendarDays = () => {
        const startOfMonth = moment(`${currentMonth.year}-${currentMonth.month}-01`);
        const endOfMonth = startOfMonth.clone().endOf('month');
        const startOfCalendar = startOfMonth.clone().startOf('week');
        const endOfCalendar = endOfMonth.clone().endOf('week');
        
        const days = [];
        let day = startOfCalendar.clone();
        
        while (day.isSameOrBefore(endOfCalendar)) {
            days.push(day.clone());
            day.add(1, 'day');
        }
        
        return days;
    };

    const calendarDays = generateCalendarDays();
    const selectedDayEvents = events.filter(event => 
        moment(event.start).format('YYYY-MM-DD') === selectedDate
    );

    return (
        <div className="bg-white rounded-lg shadow border">
            {/* 月ヘッダー */}
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-center">
                    {currentMonth.formatted}
                </h2>
            </div>

            {/* カレンダーグリッド */}
            <div className="p-4">
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* 日付グリッド */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                        const dayStr = day.format('YYYY-MM-DD');
                        const dayEvents = events.filter(event => 
                            moment(event.start).format('YYYY-MM-DD') === dayStr
                        );
                        const isSelected = selectedDate === dayStr;
                        const isToday = moment().format('YYYY-MM-DD') === dayStr;
                        const isCurrentMonth = day.month() + 1 === currentMonth.month;

                        return (
                            <button
                                key={dayStr}
                                onClick={() => setSelectedDate(dayStr)}
                                className={`
                                    aspect-square p-1 text-xs rounded-md relative
                                    ${isSelected ? 'bg-blue-500 text-white' : ''}
                                    ${isToday && !isSelected ? 'bg-blue-100 text-blue-800' : ''}
                                    ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                                    hover:bg-gray-100
                                `}
                            >
                                <div>{day.format('D')}</div>
                                {dayEvents.length > 0 && (
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 選択日のスケジュール */}
            <div className="p-4 border-t">
                <h3 className="font-medium text-gray-900 mb-2">
                    {moment(selectedDate).format('M月D日（ddd）')} のスケジュール
                </h3>
                {selectedDayEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">予定がありません</p>
                ) : (
                    <div className="space-y-2">
                        {selectedDayEvents.map((event) => (
                            <div key={event.id} className="bg-gray-50 p-2 rounded">
                                <div className="font-medium text-sm">{event.title}</div>
                                <div className="text-xs text-gray-600">
                                    {event.resource?.resident?.name || '全体'}
                                    {!event.allDay && (
                                        <span className="ml-2">
                                            {moment(event.start).format('HH:mm')} - 
                                            {moment(event.end).format('HH:mm')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
```

#### 4.2 レスポンシブ切り替えロジック

```jsx
// resources/js/Pages/Calendar/Index.jsx の修正

import MobileCalendar from '@/Components/Calendar/MobileCalendar';
import { useState, useEffect } from 'react';

export default function CalendarIndex({ /* props */ }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <AuthenticatedLayout user={user}>
            <Head title="カレンダー" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* 統計ダッシュボード */}
                    {/* ... 統計表示部分は共通 ... */}

                    {/* レスポンシブカレンダー表示 */}
                    {isMobile ? (
                        <MobileCalendar 
                            events={events}
                            currentMonth={currentMonth}
                        />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* デスクトップ版カレンダー */}
                            {/* ... 既存のカレンダー表示 ... */}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

### Step 5: ナビゲーションとヘッダーの更新

```jsx
// resources/js/Layouts/AuthenticatedLayout.jsx の修正

export default function AuthenticatedLayout({ user, header, children }) {
    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            {/* ロゴ部分 */}
                            <div className="shrink-0 flex items-center">
                                <Link href="/">
                                    <span className="text-xl font-bold text-gray-900">
                                        介護施設カレンダー
                                    </span>
                                </Link>
                            </div>

                            {/* ナビゲーションメニュー */}
                            <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                                <NavLink 
                                    href={route('dashboard')} 
                                    active={route().current('dashboard')}
                                >
                                    ダッシュボード
                                </NavLink>
                                <NavLink 
                                    href={route('calendar.index')} 
                                    active={route().current('calendar.*')}
                                >
                                    カレンダー
                                </NavLink>
                                {user.role === 'admin' && (
                                    <>
                                        <NavLink 
                                            href={route('residents.index')} 
                                            active={route().current('residents.*')}
                                        >
                                            住民管理
                                        </NavLink>
                                        <NavLink 
                                            href={route('users.index')} 
                                            active={route().current('users.*')}
                                        >
                                            職員管理
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ユーザーメニュー */}
                        {/* ... 既存のユーザーメニュー部分 ... */}
                    </div>
                </div>
            </nav>

            {/* ページヘッダー */}
            {header && (
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* メインコンテンツ */}
            <main>{children}</main>
        </div>
    );
}
```

## ✅ 確認方法

Phase 4 が完了したら、以下を確認してください：

### カレンダー表示の確認

```bash
# 開発サーバー起動
./vendor/bin/sail up -d
npm run dev

# ブラウザで確認
# http://localhost/calendar
```

### 機能動作確認

- [ ] 月間カレンダーが正常に表示される
- [ ] スケジュールが適切な色で表示される
- [ ] 日本語化が正しく動作している
- [ ] モバイル表示が適切に切り替わる
- [ ] サイドバーの住民リストが表示される

### レスポンシブ確認

```bash
# ブラウザの開発者ツールでレスポンシブテスト
# F12 → デバイスモードで各画面サイズを確認
```

## 🎯 次の段階への準備

Phase 4 が正常に完了したら、以下を確認してから Phase 5 に進みます：

- [ ] カレンダーUIが正常表示されている
- [ ] 日本語化が完了している
- [ ] レスポンシブ対応が動作している
- [ ] API連携が正常に機能している
- [ ] ナビゲーションが適切に動作している

**次回**: [Phase 5: 住民管理機能](phase-05-resident-management.md) では、住民情報の CRUD 操作とスケジュール連携機能を実装します。

---

**💡 Phase 4 のポイント**: 
- **モダンUI**: react-big-calendar による高機能カレンダー
- **日本語化**: moment.js による完全な日本語対応
- **レスポンシブ**: モバイルファーストのUI設計
- **実用性**: 介護職員が実際に使いやすいUX設計