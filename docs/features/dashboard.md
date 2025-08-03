# 📊 ダッシュボード機能

このドキュメントでは、介護施設カレンダーアプリのダッシュボード機能について説明します。

## 📋 ダッシュボード概要

ダッシュボードは、職員がログイン後に最初に表示される画面で、施設の状況を一目で把握できるように設計されています。

### 主な表示要素

- **統計カード**: 住民数、本日のスケジュール数などの基本統計
- **今日のスケジュール**: 当日の予定一覧
- **住民一覧**: アクティブな住民の情報
- **週間概要**: 今週のスケジュール概況

## 🏗️ システム構成

### コントローラー

```php
// app/Http/Controllers/DashboardController.php

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today();

        // 今日のスケジュール取得
        $todaySchedules = Schedule::with(['scheduleType', 'resident', 'creator'])
            ->byDate($today->format('Y-m-d'))
            ->orderBy('start_time')
            ->get();

        // アクティブな住民取得
        $residents = Resident::with('department')
            ->active()
            ->orderByRoom()
            ->get();

        // 統計データ計算
        $stats = [
            'total_residents' => $residents->count(),
            'today_schedules' => $todaySchedules->count(),
            'bath_schedules_today' => $todaySchedules->where('scheduleType.name', '入浴')->count(),
            'total_staff' => User::where('role', '!=', 'viewer')->count(),
        ];

        // 週間スケジュール概要
        $weekSchedules = Schedule::with(['scheduleType', 'resident'])
            ->byDateRange($today->format('Y-m-d'), $today->addDays(6)->format('Y-m-d'))
            ->get()
            ->groupBy('date');

        return Inertia::render('Dashboard', [
            'user' => $user->load('department'),
            'todaySchedules' => $todaySchedules,
            'residents' => $residents,
            'stats' => $stats,
            'weekSchedules' => $weekSchedules,
            'currentDate' => $today->format('Y-m-d'),
            'currentDateFormatted' => $today->format('Y年n月j日（D）'),
        ]);
    }
}
```

### メインコンポーネント

```jsx
// resources/js/Pages/Dashboard.jsx

export default function Dashboard({ 
    user, 
    todaySchedules, 
    residents, 
    stats, 
    weekSchedules, 
    currentDate, 
    currentDateFormatted 
}) {
    return (
        <AuthenticatedLayout user={user}>
            <Head title="ダッシュボード" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* 統計カード */}
                    <StatCards stats={stats} />
                    
                    {/* メインコンテンツエリア */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 今日のスケジュール */}
                        <div className="lg:col-span-2">
                            <TodaySchedules 
                                schedules={todaySchedules} 
                                currentDate={currentDateFormatted}
                            />
                        </div>
                        
                        {/* 住民一覧 */}
                        <div className="lg:col-span-1">
                            <ResidentsList residents={residents} />
                        </div>
                    </div>
                    
                    {/* 週間概要 */}
                    <WeeklyOverview 
                        weekSchedules={weekSchedules} 
                        currentDate={currentDate}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

## 📊 統計カードコンポーネント

### 表示内容

| カード | 内容 | 計算方法 |
|-------|------|---------|
| **入居住民数** | アクティブな住民の総数 | `Resident::active()->count()` |
| **本日のスケジュール** | 今日の全スケジュール数 | `Schedule::byDate(today())->count()` |
| **本日の入浴予定** | 今日の入浴スケジュール数 | 入浴タイプのスケジュールのみ |
| **職員数** | 閲覧者以外の職員数 | `User::where('role', '!=', 'viewer')->count()` |

### コンポーネント実装

```jsx
// resources/js/Components/Dashboard/StatCards.jsx

export default function StatCards({ stats }) {
    const cards = [
        {
            title: '入居住民数',
            value: stats.total_residents,
            icon: '👥',
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700'
        },
        {
            title: '本日のスケジュール',
            value: stats.today_schedules,
            icon: '📅',
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700'
        },
        {
            title: '本日の入浴予定',
            value: stats.bath_schedules_today,
            icon: '🛁',
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700'
        },
        {
            title: '職員数',
            value: stats.total_staff,
            icon: '👨‍⚕️',
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-700'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
                <div key={index} className={`${card.bgColor} rounded-lg p-6 border border-gray-200`}>
                    <div className="flex items-center">
                        <div className={`${card.color} rounded-lg p-3 text-white text-2xl mr-4`}>
                            {card.icon}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${card.textColor} opacity-75`}>
                                {card.title}
                            </p>
                            <p className={`text-3xl font-bold ${card.textColor}`}>
                                {card.value}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
```

## 📅 今日のスケジュールコンポーネント

### 表示機能

- **時系列表示**: 開始時刻順でソート
- **スケジュール種別**: アイコンと色分けで視覚的に区別
- **住民情報**: 対象住民名と部屋番号
- **詳細情報**: スケジュールの説明文

### コンポーネント実装

```jsx
// resources/js/Components/Dashboard/TodaySchedules.jsx

export default function TodaySchedules({ schedules, currentDate }) {
    const getTypeColor = (typeName) => {
        const colors = {
            '入浴': 'bg-blue-100 text-blue-800 border-blue-200',
            'リハビリ': 'bg-green-100 text-green-800 border-green-200',
            'レクリエーション': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            '医療行為': 'bg-red-100 text-red-800 border-red-200',
            '面会': 'bg-purple-100 text-purple-800 border-purple-200',
        };
        return colors[typeName] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    今日のスケジュール
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    {currentDate} • {schedules.length}件
                </p>
            </div>
            
            <div className="p-6">
                {schedules.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">📅</div>
                        <p className="text-gray-500">今日のスケジュールはありません</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {schedules.map((schedule) => (
                            <div 
                                key={schedule.id} 
                                className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                            >
                                <div className="flex-shrink-0 text-sm font-medium text-gray-600 min-w-[80px]">
                                    {schedule.start_time} - {schedule.end_time}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(schedule.schedule_type.name)}`}>
                                            {schedule.schedule_type.name}
                                        </span>
                                        <h4 className="font-medium text-gray-900 truncate">
                                            {schedule.title}
                                        </h4>
                                    </div>
                                    
                                    <div className="flex items-center text-sm text-gray-600">
                                        <span className="mr-2">👤</span>
                                        <span>
                                            {schedule.resident ? schedule.resident.name : '全体対象'}
                                        </span>
                                        {schedule.resident?.room_number && (
                                            <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                {schedule.resident.room_number}号室
                                            </span>
                                        )}
                                    </div>
                                    
                                    {schedule.description && (
                                        <p className="text-sm text-gray-500 mt-1 truncate">
                                            {schedule.description}
                                        </p>
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

## 👥 住民一覧コンポーネント

### 表示機能

- **基本情報**: 氏名、年齢、性別、部屋番号
- **所属部署**: 担当部署名
- **医療情報**: 重要な注意事項の概要
- **部屋番号順**: 見つけやすい順序で表示

### コンポーネント実装

```jsx
// resources/js/Components/Dashboard/ResidentsList.jsx

export default function ResidentsList({ residents }) {
    const getGenderIcon = (gender) => {
        return gender === 'male' ? '👨' : gender === 'female' ? '👩' : '👤';
    };

    const getAge = (birthDate) => {
        if (!birthDate) return '';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    入居住民一覧
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    {residents.length}名の住民
                </p>
            </div>
            
            <div className="p-6">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {residents.map((resident) => (
                        <div 
                            key={resident.id} 
                            className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                        >
                            <div className="flex-shrink-0 text-2xl">
                                {getGenderIcon(resident.gender)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-gray-900 truncate">
                                        {resident.name}
                                    </h4>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                        {resident.room_number}号室
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                    {resident.birth_date && (
                                        <span>{getAge(resident.birth_date)}歳</span>
                                    )}
                                    <span>•</span>
                                    <span>{resident.department?.department_name}</span>
                                </div>
                                
                                {resident.medical_info && (
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                        {resident.medical_info}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
```

## 📈 週間概要コンポーネント

### 表示機能

- **7日間表示**: 今日から1週間のスケジュール件数
- **日別集計**: 各日のスケジュール総数と入浴予定数
- **今日のハイライト**: 当日を視覚的に強調
- **曜日表示**: 日本語曜日での表示

### コンポーネント実装

```jsx
// resources/js/Components/Dashboard/WeeklyOverview.jsx

export default function WeeklyOverview({ weekSchedules, currentDate }) {
    const getDayOfWeek = (dateString) => {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const date = new Date(dateString);
        return days[date.getDay()];
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const isToday = (dateString) => {
        return dateString === currentDate;
    };

    // 7日間の日付を生成
    const generateWeekDates = () => {
        const dates = [];
        const start = new Date(currentDate);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        return dates;
    };

    const weekDates = generateWeekDates();

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    今週のスケジュール概要
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    7日間のスケジュール件数
                </p>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-7 gap-4">
                    {weekDates.map((date) => {
                        const daySchedules = weekSchedules[date] || [];
                        const bathCount = daySchedules.filter(s => s.schedule_type.name === '入浴').length;
                        const totalCount = daySchedules.length;
                        
                        return (
                            <div 
                                key={date} 
                                className={`text-center p-4 rounded-lg border transition-colors ${
                                    isToday(date) 
                                        ? 'border-blue-300 bg-blue-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className={`text-sm font-medium mb-2 ${
                                    isToday(date) ? 'text-blue-700' : 'text-gray-700'
                                }`}>
                                    {getDayOfWeek(date)}
                                </div>
                                <div className={`text-lg font-bold mb-1 ${
                                    isToday(date) ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                    {formatDate(date)}
                                </div>
                                
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-600">
                                        全{totalCount}件
                                    </div>
                                    {bathCount > 0 && (
                                        <div className="text-xs text-blue-600">
                                            🛁 {bathCount}件
                                        </div>
                                    )}
                                </div>
                                
                                {isToday(date) && (
                                    <div className="mt-2">
                                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
```

## 🎨 レスポンシブデザイン

### ブレークポイント設計

| デバイス | 幅 | レイアウト |
|---------|---|---------|
| **Mobile** | < 768px | 1列表示、縦スタック |
| **Tablet** | 768px - 1024px | 2列表示、一部縦スタック |
| **Desktop** | > 1024px | 3列表示、横並び |

### グリッドレイアウト

```jsx
{/* モバイル: 1列、タブレット: 2列、デスクトップ: 4列 */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCards stats={stats} />
</div>

{/* モバイル: 1列、デスクトップ: 3列（2:1の比率） */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
        <TodaySchedules />
    </div>
    <div className="lg:col-span-1">
        <ResidentsList />
    </div>
</div>
```

## 🚀 パフォーマンス最適化

### データ取得の最適化

```php
// N+1クエリ問題を回避するEager Loading
$todaySchedules = Schedule::with(['scheduleType', 'resident', 'creator'])
    ->byDate($today->format('Y-m-d'))
    ->orderBy('start_time')
    ->get();

// 必要なカラムのみ取得
$residents = Resident::with('department:id,department_name')
    ->select('id', 'name', 'room_number', 'gender', 'birth_date', 'medical_info', 'department_id')
    ->active()
    ->orderByRoom()
    ->get();
```

### キャッシュ戦略

```php
// 統計データのキャッシュ（1時間）
$stats = Cache::remember('dashboard_stats_' . $today->format('Y-m-d'), 3600, function () use ($residents, $todaySchedules) {
    return [
        'total_residents' => $residents->count(),
        'today_schedules' => $todaySchedules->count(),
        'bath_schedules_today' => $todaySchedules->where('scheduleType.name', '入浴')->count(),
        'total_staff' => User::where('role', '!=', 'viewer')->count(),
    ];
});
```

## 🧪 テスト

### ダッシュボード表示テスト

```php
// tests/Feature/DashboardTest.php

public function test_dashboard_displays_correctly(): void
{
    $user = User::factory()->create();
    $resident = Resident::factory()->create();
    $schedule = Schedule::factory()->create([
        'date' => today(),
        'resident_id' => $resident->id,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->component('Dashboard')
             ->has('todaySchedules', 1)
             ->has('residents', 1)
             ->has('stats')
    );
}
```

### 統計データテスト

```php
public function test_stats_calculation(): void
{
    $user = User::factory()->create();
    
    // テストデータ作成
    Resident::factory()->count(5)->create();
    Schedule::factory()->count(3)->create(['date' => today()]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertInertia(fn ($page) => 
        $page->has('stats', fn ($stats) => 
            $stats->where('total_residents', 5)
                  ->where('today_schedules', 3)
        )
    );
}
```

## 📚 関連ドキュメント

- [認証システム](auth.md) - ダッシュボードへのアクセス制御
- [カレンダー機能](calendar.md) - スケジュール表示の詳細
- [データベース設計](../development/database.md) - データ構造の詳細

---

**💡 設計のポイント**: 
- 介護職員が必要な情報を一目で把握できるシンプルなUI
- レスポンシブデザインでモバイル端末からもアクセス可能
- パフォーマンスを重視したデータ取得とキャッシュ戦略