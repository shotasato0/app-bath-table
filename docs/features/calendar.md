# 📅 カレンダー機能

このドキュメントでは、介護施設カレンダーアプリのカレンダー機能について説明します。

## 📋 カレンダー機能概要

カレンダー機能は、スケジュールの視覚的な管理を可能にする中心的な機能です。月間・週間・日間の表示モードを提供し、直感的なスケジュール管理を実現します。

### 主な機能

- **複数表示モード**: 月間・週間・日間カレンダー
- **スケジュール表示**: 色分けされたイベント表示
- **インタラクティブ操作**: クリック・ドラッグによる操作
- **リアルタイム更新**: データ変更の即座反映

## 🏗️ システム構成

### 使用技術

- **react-big-calendar**: メインカレンダーライブラリ
- **moment.js**: 日付操作・日本語化
- **Inertia.js**: サーバーサイドとの連携
- **Tailwind CSS**: スタイリング

### ディレクトリ構成

```
resources/js/
├── Pages/Calendar/
│   ├── Index.jsx          # 月間カレンダー
│   ├── WeekView.jsx       # 週間カレンダー
│   └── DayView.jsx        # 日間カレンダー
└── Components/Calendar/
    ├── CalendarToolbar.jsx # カスタムツールバー
    ├── EventComponent.jsx  # イベント表示
    └── MonthStats.jsx      # 月間統計
```

## 🎯 コントローラー実装

### CalendarController

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

        // スケジュール取得
        $schedules = Schedule::with(['scheduleType', 'resident', 'creator'])
            ->byDateRange($startOfCalendar->format('Y-m-d'), $endOfCalendar->format('Y-m-d'))
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        // react-big-calendar用にイベントデータを整形
        $events = $schedules->map(function ($schedule) {
            return [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'start' => $schedule->date . ' ' . $schedule->start_time,
                'end' => $schedule->date . ' ' . $schedule->end_time,
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
            'residents' => Resident::active()->orderByRoom()->get(),
            'scheduleTypes' => ScheduleType::active()->get(),
            'currentMonth' => [
                'year' => $year,
                'month' => $month,
                'formatted' => $startOfMonth->format('Y年n月'),
            ],
            'monthStats' => $this->calculateMonthStats($schedules),
        ]);
    }

    public function week(Request $request)
    {
        $baseDate = $request->get('date', Carbon::now()->format('Y-m-d'));
        $targetDate = Carbon::parse($baseDate);
        
        $startOfWeek = $targetDate->copy()->startOfWeek(Carbon::SUNDAY);
        $endOfWeek = $targetDate->copy()->endOfWeek(Carbon::SATURDAY);

        $schedules = Schedule::with(['scheduleType', 'resident', 'creator'])
            ->byDateRange($startOfWeek->format('Y-m-d'), $endOfWeek->format('Y-m-d'))
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Calendar/WeekView', [
            'user' => $request->user()->load('department'),
            'weekSchedules' => $schedules->groupBy('date'),
            'residents' => Resident::active()->orderByRoom()->get(),
            'scheduleTypes' => ScheduleType::active()->get(),
            'weekRange' => [
                'start' => $startOfWeek->format('Y-m-d'),
                'end' => $endOfWeek->format('Y-m-d'),
                'formatted' => $startOfWeek->format('Y年n月j日') . ' - ' . $endOfWeek->format('n月j日'),
            ],
            'targetDate' => $targetDate->format('Y-m-d'),
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

## 📅 月間カレンダー

### メインコンポーネント

```jsx
// resources/js/Pages/Calendar/Index.jsx

import { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
        // TODO: モーダル表示やページ遷移
    };

    // 日付クリック時の処理
    const handleSelectSlot = (slotInfo) => {
        const selectedDate = moment(slotInfo.start).format('YYYY-MM-DD');
        router.get(route('calendar.show', selectedDate));
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
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* 月間統計 */}
                    <MonthStats stats={monthStats} currentMonth={currentMonth} />
                    
                    {/* カレンダー */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6">
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
                                components={{
                                    toolbar: CalendarToolbar,
                                    event: EventComponent,
                                }}
                                formats={{
                                    dayFormat: 'D',
                                    monthHeaderFormat: 'YYYY年M月',
                                    dayHeaderFormat: 'M/D (ddd)',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

### カスタムツールバー

```jsx
// resources/js/Components/Calendar/CalendarToolbar.jsx

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function CalendarToolbar({ label, onNavigate, onView, view }) {
    return (
        <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
            {/* ナビゲーション */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => onNavigate('PREV')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="前の月"
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                <button
                    onClick={() => onNavigate('TODAY')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                >
                    今日
                </button>
                
                <button
                    onClick={() => onNavigate('NEXT')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="次の月"
                >
                    <ChevronRightIcon className="h-5 w-5" />
                </button>
            </div>

            {/* 月・年表示 */}
            <h3 className="text-xl font-bold text-gray-900">
                {label}
            </h3>

            {/* ビュー切り替え */}
            <div className="flex space-x-2">
                {['month', 'week', 'day'].map((viewType) => (
                    <button
                        key={viewType}
                        onClick={() => onView(viewType)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                            view === viewType 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {viewType === 'month' ? '月' : viewType === 'week' ? '週' : '日'}
                    </button>
                ))}
            </div>
        </div>
    );
}
```

### イベントコンポーネント

```jsx
// resources/js/Components/Calendar/EventComponent.jsx

export default function EventComponent({ event }) {
    const getTypeIcon = (typeName) => {
        const icons = {
            '入浴': '🛁',
            'リハビリ': '🏃‍♀️',
            'レクリエーション': '🎯',
            '医療行為': '🏥',
            '面会': '👨‍👩‍👧‍👦',
        };
        return icons[typeName] || '📅';
    };

    const schedule = event.resource?.schedule;
    const resident = event.resource?.resident;
    const type = event.resource?.type;

    return (
        <div className="text-xs p-1 rounded overflow-hidden">
            <div className="flex items-center space-x-1">
                <span className="text-white text-xs">
                    {getTypeIcon(type?.name)}
                </span>
                <span className="text-white font-medium truncate">
                    {event.title}
                </span>
            </div>
            {resident && (
                <div className="text-white opacity-90 text-xs truncate">
                    {resident.name}
                </div>
            )}
        </div>
    );
}
```

## 📆 週間カレンダー

### WeekViewコンポーネント

```jsx
// resources/js/Pages/Calendar/WeekView.jsx

export default function WeekView({ 
    user, 
    weekSchedules, 
    residents, 
    scheduleTypes, 
    weekRange, 
    targetDate 
}) {
    // 週の日付配列を生成
    const generateWeekDates = () => {
        const dates = [];
        const start = moment(weekRange.start);
        
        for (let i = 0; i < 7; i++) {
            const date = start.clone().add(i, 'days');
            dates.push({
                date: date.format('YYYY-MM-DD'),
                dayOfWeek: date.format('ddd'),
                dayNumber: date.format('D'),
                isToday: date.format('YYYY-MM-DD') === moment().format('YYYY-MM-DD'),
                isWeekend: date.day() === 0 || date.day() === 6,
            });
        }
        
        return dates;
    };

    const weekDates = generateWeekDates();

    // 前週・次週への遷移
    const handleNavigate = (direction) => {
        const currentDate = moment(targetDate);
        const newDate = direction === 'prev' 
            ? currentDate.subtract(1, 'week') 
            : currentDate.add(1, 'week');
        
        router.get(route('calendar.week'), {
            date: newDate.format('YYYY-MM-DD')
        });
    };

    return (
        <AuthenticatedLayout user={user}>
            <Head title="週間カレンダー" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        
                        {/* 週間ナビゲーション */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => handleNavigate('prev')}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                    ← 前週
                                </button>
                                
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {weekRange.formatted}
                                </h3>
                                
                                <button
                                    onClick={() => handleNavigate('next')}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                    次週 →
                                </button>
                            </div>
                        </div>

                        {/* 週間グリッド */}
                        <div className="p-6">
                            <div className="grid grid-cols-7 gap-4">
                                {weekDates.map((dayInfo) => {
                                    const daySchedules = weekSchedules[dayInfo.date] || [];
                                    
                                    return (
                                        <div 
                                            key={dayInfo.date}
                                            className={`border rounded-lg p-4 min-h-[300px] ${
                                                dayInfo.isToday 
                                                    ? 'border-blue-300 bg-blue-50' 
                                                    : dayInfo.isWeekend 
                                                        ? 'border-gray-200 bg-gray-50' 
                                                        : 'border-gray-200 bg-white'
                                            }`}
                                        >
                                            {/* 日付ヘッダー */}
                                            <div className="text-center mb-3">
                                                <div className={`text-sm font-medium ${
                                                    dayInfo.isToday ? 'text-blue-700' : 'text-gray-700'
                                                }`}>
                                                    {dayInfo.dayOfWeek}
                                                </div>
                                                <div className={`text-lg font-bold ${
                                                    dayInfo.isToday ? 'text-blue-900' : 'text-gray-900'
                                                }`}>
                                                    {dayInfo.dayNumber}
                                                </div>
                                            </div>

                                            {/* スケジュール一覧 */}
                                            <div className="space-y-2">
                                                {daySchedules.length === 0 ? (
                                                    <p className="text-xs text-gray-400 text-center mt-8">
                                                        予定なし
                                                    </p>
                                                ) : (
                                                    daySchedules.map((schedule) => (
                                                        <div 
                                                            key={schedule.id}
                                                            className="p-2 rounded border text-xs cursor-pointer transition-colors hover:shadow-sm"
                                                            onClick={() => console.log('Schedule clicked:', schedule)}
                                                        >
                                                            <div className="font-medium truncate">
                                                                {schedule.start_time} {schedule.title}
                                                            </div>
                                                            {schedule.resident && (
                                                                <div className="truncate opacity-75 mt-1">
                                                                    {schedule.resident.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

## 🎨 スタイルカスタマイズ

### CSS設定

```css
/* resources/css/calendar.css */

/* react-big-calendar のスタイル調整 */
.rbc-calendar {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.rbc-header {
    padding: 8px 4px;
    font-weight: 600;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.rbc-today {
    background-color: #ebf8ff !important;
}

.rbc-event {
    border-radius: 4px;
    border: none;
    padding: 2px 4px;
    font-size: 11px;
    font-weight: 500;
}

.rbc-event:focus {
    outline: 2px solid #3182ce;
    outline-offset: 2px;
}

/* スケジュール種別別の色設定 */
.schedule-bath {
    background-color: #3b82f6 !important;
    border-color: #2563eb !important;
}

.schedule-rehabilitation {
    background-color: #10b981 !important;
    border-color: #059669 !important;
}

.schedule-recreation {
    background-color: #f59e0b !important;
    border-color: #d97706 !important;
}

.schedule-medical {
    background-color: #ef4444 !important;
    border-color: #dc2626 !important;
}

.schedule-visit {
    background-color: #8b5cf6 !important;
    border-color: #7c3aed !important;
}
```

## 🔧 ルート設定

```php
// routes/web.php

Route::middleware(['auth', 'verified'])->group(function () {
    // カレンダー関連ルート
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::get('/calendar/week', [CalendarController::class, 'week'])->name('calendar.week');
    Route::get('/calendar/{date}', [CalendarController::class, 'show'])->name('calendar.show');
    
    // スケジュール操作（今後の実装）
    Route::post('/schedules', [ScheduleController::class, 'store'])->name('schedules.store');
    Route::put('/schedules/{schedule}', [ScheduleController::class, 'update'])->name('schedules.update');
    Route::delete('/schedules/{schedule}', [ScheduleController::class, 'destroy'])->name('schedules.destroy');
});
```

## 🚀 パフォーマンス最適化

### データ取得の最適化

```php
// 必要最小限のデータのみ取得
$events = $schedules->map(function ($schedule) {
    return [
        'id' => $schedule->id,
        'title' => $schedule->title,
        'start' => $schedule->date . ' ' . $schedule->start_time,
        'end' => $schedule->date . ' ' . $schedule->end_time,
        'allDay' => $schedule->all_day,
        'resource' => [
            'type' => [
                'name' => $schedule->scheduleType->name,
                'color_code' => $schedule->scheduleType->color_code,
            ],
            'resident' => $schedule->resident ? [
                'id' => $schedule->resident->id,
                'name' => $schedule->resident->name,
                'room_number' => $schedule->resident->room_number,
            ] : null,
        ],
    ];
});
```

### フロントエンドでの最適化

```jsx
// メモ化によるレンダリング最適化
const MemoizedEventComponent = memo(EventComponent);
const MemoizedCalendarToolbar = memo(CalendarToolbar);

// 大きなイベントリストの仮想化
const VirtualizedCalendar = ({ events, ...props }) => {
    const [visibleEvents, setVisibleEvents] = useState([]);
    
    useEffect(() => {
        // 表示範囲内のイベントのみをレンダリング
        const filtered = events.filter(event => {
            // 現在の表示範囲内かどうかの判定ロジック
            return isEventInViewRange(event, currentViewRange);
        });
        setVisibleEvents(filtered);
    }, [events, currentViewRange]);
    
    return <Calendar events={visibleEvents} {...props} />;
};
```

## 🧪 テスト

### カレンダー表示テスト

```php
// tests/Feature/CalendarTest.php

public function test_calendar_displays_monthly_view(): void
{
    $user = User::factory()->create();
    $schedule = Schedule::factory()->create([
        'date' => today(),
        'title' => 'テストスケジュール',
    ]);

    $response = $this->actingAs($user)->get('/calendar');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->component('Calendar/Index')
             ->has('events', 1)
             ->where('events.0.title', 'テストスケジュール')
    );
}

public function test_calendar_navigates_to_different_month(): void
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/calendar?year=2024&month=12');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->where('currentMonth.year', 2024)
             ->where('currentMonth.month', 12)
    );
}
```

### 週間表示テスト

```php
public function test_weekly_view_displays_correct_date_range(): void
{
    $user = User::factory()->create();
    $targetDate = '2024-01-15'; // 月曜日

    $response = $this->actingAs($user)->get("/calendar/week?date={$targetDate}");

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->component('Calendar/WeekView')
             ->where('weekRange.start', '2024-01-14') // 日曜日
             ->where('weekRange.end', '2024-01-20')   // 土曜日
    );
}
```

## 📚 関連ドキュメント

- [ダッシュボード機能](dashboard.md) - カレンダーとの連携
- [データベース設計](../development/database.md) - スケジュールデータ構造
- [認証システム](auth.md) - アクセス制御

---

**💡 設計のポイント**: 
- react-big-calendarを使用した高機能なカレンダー表示
- 日本語対応と介護施設向けUIのカスタマイズ
- レスポンシブデザインでモバイル対応
- パフォーマンスを重視したデータ取得とレンダリング最適化