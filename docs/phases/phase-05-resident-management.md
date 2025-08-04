# 👥 Phase 5: 住民管理機能

このドキュメントでは、住民情報の **CRUD操作** と **スケジュール連携機能** の実装手順を説明します。

## 📋 この段階の目標

- **住民CRUD機能**: 住民情報の作成・参照・更新・削除
- **高度な検索機能**: 部屋番号・医療情報・状態での絞り込み
- **スケジュール連携**: 住民とスケジュールの関連性管理
- **データ整合性**: 安全な削除処理と依存関係管理

## 🎯 実装する機能

この段階で実装する **住民管理システム**：

```
住民管理機能
├── 住民一覧: ページネーション・検索・フィルタ
├── 住民詳細: 基本情報・医療情報・スケジュール履歴
├── 住民編集: バリデーション付きフォーム
└── 住民削除: 安全な削除とデータ保護
```

## 💡 学習ポイント

この段階で身につく技術・知識：

- **Laravel Resource** による API 設計
- **フォームバリデーション** の高度な活用
- **ページネーション** とパフォーマンス最適化
- **データ整合性** の保護戦略
- **UI/UX** の実践的設計

## 🚀 実装手順

### Step 1: ResidentController の拡張

```php
// app/Http/Controllers/ResidentController.php

use App\Http\Controllers\Controller;
use App\Models\Resident;
use App\Models\Department;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class ResidentController extends Controller
{
    public function index(Request $request)
    {
        $query = Resident::with('department')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('room_number', 'like', "%{$search}%");
            })
            ->when($request->department_id, function ($query, $deptId) {
                $query->where('department_id', $deptId);
            })
            ->when($request->is_active !== null, function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->when($request->medical_condition, function ($query, $condition) {
                $query->where('medical_info', 'like', "%{$condition}%");
            });

        $residents = $query->orderBy('room_number')
                          ->paginate(20)
                          ->withQueryString();

        return Inertia::render('Residents/Index', [
            'residents' => $residents,
            'departments' => Department::orderBy('department_name')->get(),
            'filters' => $request->only(['search', 'department_id', 'is_active', 'medical_condition']),
            'stats' => $this->getResidentStats(),
        ]);
    }

    public function show(Resident $resident)
    {
        $resident->load(['department', 'schedules.scheduleType']);
        
        // 最近30日のスケジュール
        $recentSchedules = $resident->schedules()
            ->with(['scheduleType', 'creator'])
            ->where('date', '>=', Carbon::now()->subDays(30))
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get();

        // 今後のスケジュール
        $upcomingSchedules = $resident->schedules()
            ->with(['scheduleType', 'creator'])
            ->where('date', '>=', Carbon::today())
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Residents/Show', [
            'resident' => $resident,
            'recentSchedules' => $recentSchedules,
            'upcomingSchedules' => $upcomingSchedules,
            'scheduleStats' => $this->getResidentScheduleStats($resident),
        ]);
    }

    public function create()
    {
        return Inertia::render('Residents/Create', [
            'departments' => Department::orderBy('department_name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'room_number' => 'nullable|string|max:20|unique:residents,room_number',
            'gender' => 'nullable|in:male,female,other',
            'birth_date' => 'nullable|date|before:today',
            'medical_info' => 'nullable|string|max:1000',
            'department_id' => 'required|exists:departments,id',
            'is_active' => 'boolean',
        ]);

        $resident = Resident::create($validated);

        return redirect()->route('residents.show', $resident)
                        ->with('message', '住民情報を登録しました。');
    }

    public function edit(Resident $resident)
    {
        return Inertia::render('Residents/Edit', [
            'resident' => $resident->load('department'),
            'departments' => Department::orderBy('department_name')->get(),
        ]);
    }

    public function update(Request $request, Resident $resident)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'room_number' => [
                'nullable',
                'string',
                'max:20',
                // 更新時: 自身のIDは除外してユニークチェック
                Rule::unique('residents')->ignore($resident->id),
            ],
            'gender' => 'nullable|in:male,female,other',
            'birth_date' => 'nullable|date|before:today',
            'medical_info' => 'nullable|string|max:1000',
            'department_id' => 'required|exists:departments,id',
            'is_active' => 'boolean',
        ]);

        $resident->update($validated);

        return redirect()->route('residents.show', $resident)
                        ->with('message', '住民情報を更新しました。');
    }

    public function destroy(Request $request, Resident $resident)
    {
        // スケジュールが存在する場合の処理
        $scheduleCount = $resident->schedules()->count();
        
        if ($scheduleCount > 0 && !$request->boolean('force_delete')) {
            return back()->withErrors([
                'delete' => "この住民には {$scheduleCount} 件のスケジュールが関連付けられています。削除を続行するには確認が必要です。"
            ]);
        }

        // 関連するスケジュールの処理
        if ($scheduleCount > 0) {
            if ($request->get('schedule_action') === 'delete') {
                // スケジュールも削除
                $resident->schedules()->delete();
            } else {
                // スケジュールの住民IDをnullに変更（全体対象にする）
                $resident->schedules()->update(['resident_id' => null]);
            }
        }

        $residentName = $resident->name;
        $resident->delete();

        return redirect()->route('residents.index')
                        ->with('message', "{$residentName} さんの情報を削除しました。");
    }

    private function getResidentStats()
    {
        return [
            'total' => Resident::count(),
            'active' => Resident::where('is_active', true)->count(),
            'inactive' => Resident::where('is_active', false)->count(),
            'by_gender' => Resident::selectRaw('gender, count(*) as count')
                                  ->groupBy('gender')
                                  ->pluck('count', 'gender'),
        ];
    }

    private function getResidentScheduleStats(Resident $resident)
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);
        
        return [
            'total_schedules' => $resident->schedules()->count(),
            'recent_schedules' => $resident->schedules()
                                          ->where('date', '>=', $thirtyDaysAgo)
                                          ->count(),
            'by_type' => $resident->schedules()
                                 ->join('schedule_types', 'schedules.schedule_type_id', '=', 'schedule_types.id')
                                 ->selectRaw('schedule_types.name, count(*) as count')
                                 ->groupBy('schedule_types.name')
                                 ->pluck('count', 'name'),
        ];
    }
}
```

### Step 2: 住民一覧画面の実装

```jsx
// resources/js/Pages/Residents/Index.jsx

import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';

export default function ResidentsIndex({ residents, departments, filters, stats }) {
    const { user } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');
    const [isActive, setIsActive] = useState(filters.is_active ?? '');
    const [medicalCondition, setMedicalCondition] = useState(filters.medical_condition || '');

    const handleSearch = () => {
        router.get(route('residents.index'), {
            search,
            department_id: departmentId,
            is_active: isActive,
            medical_condition: medicalCondition,
        });
    };

    const handleReset = () => {
        setSearch('');
        setDepartmentId('');
        setIsActive('');
        setMedicalCondition('');
        router.get(route('residents.index'));
    };

    const getGenderIcon = (gender) => {
        switch (gender) {
            case 'male': return '👨';
            case 'female': return '👩';
            default: return '👤';
        }
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
        <AuthenticatedLayout user={user}>
            <Head title="住民管理" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* ヘッダー */}
                    <div className="mb-6 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">住民管理</h1>
                            <p className="text-gray-600">入居住民の情報を管理します</p>
                        </div>
                        {user.role === 'admin' && (
                            <div className="mt-4 sm:mt-0">
                                <Link
                                    href={route('residents.create')}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    新規住民登録
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* 統計カード */}
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-600">総住民数</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.total}名</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-600">入居中</div>
                            <div className="text-2xl font-bold text-green-600">{stats.active}名</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-600">退居済み</div>
                            <div className="text-2xl font-bold text-gray-600">{stats.inactive}名</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-600">男性/女性</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {stats.by_gender.male || 0}/{stats.by_gender.female || 0}
                            </div>
                        </div>
                    </div>

                    {/* 検索・フィルタ */}
                    <div className="mb-6 bg-white p-4 rounded-lg shadow border">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    氏名・部屋番号
                                </label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="山田太郎 または 101"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    所属部署
                                </label>
                                <select
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">全部署</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.department_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    入居状況
                                </label>
                                <select
                                    value={isActive}
                                    onChange={(e) => setIsActive(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">すべて</option>
                                    <option value="1">入居中</option>
                                    <option value="0">退居済み</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    医療情報
                                </label>
                                <input
                                    type="text"
                                    value={medicalCondition}
                                    onChange={(e) => setMedicalCondition(e.target.value)}
                                    placeholder="糖尿病、認知症など"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                            <button
                                onClick={handleSearch}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                検索
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                リセット
                            </button>
                        </div>
                    </div>

                    {/* 住民一覧 */}
                    <div className="bg-white shadow border rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                住民一覧 ({residents.total}名)
                            </h3>
                        </div>

                        {residents.data.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <p className="text-gray-500">条件に一致する住民が見つかりません。</p>
                            </div>
                        ) : (
                            <>
                                {/* テーブル */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    住民情報
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    部屋・年齢
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    所属部署
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    医療情報
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    状況
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    操作
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {residents.data.map((resident) => (
                                                <tr key={resident.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="text-2xl mr-3">
                                                                {getGenderIcon(resident.gender)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {resident.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    ID: {resident.id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {resident.room_number ? `${resident.room_number}号室` : '未設定'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {resident.birth_date ? `${getAge(resident.birth_date)}歳` : '年齢不明'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {resident.department?.department_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                                            {resident.medical_info || '特記事項なし'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            resident.is_active 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {resident.is_active ? '入居中' : '退居済み'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <Link
                                                                href={route('residents.show', resident)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                詳細
                                                            </Link>
                                                            {user.role === 'admin' && (
                                                                <>
                                                                    <Link
                                                                        href={route('residents.edit', resident)}
                                                                        className="text-indigo-600 hover:text-indigo-900"
                                                                    >
                                                                        編集
                                                                    </Link>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ページネーション */}
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <Pagination links={residents.links} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

### Step 3: 住民詳細画面の実装

```jsx
// resources/js/Pages/Residents/Show.jsx

import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function ResidentShow({ 
    resident, 
    recentSchedules, 
    upcomingSchedules, 
    scheduleStats 
}) {
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.slice(0, 5);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${resident.name} - 住民詳細`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* ヘッダー */}
                    <div className="mb-6 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <nav className="text-sm text-gray-500 mb-2">
                                <Link href={route('residents.index')} className="hover:text-gray-700">
                                    住民管理
                                </Link>
                                <span className="mx-2">/</span>
                                <span className="text-gray-900">{resident.name}</span>
                            </nav>
                            <h1 className="text-2xl font-bold text-gray-900">{resident.name}</h1>
                        </div>
                        <div className="mt-4 sm:mt-0 flex space-x-3">
                            <Link
                                href={route('residents.edit', resident)}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700"
                            >
                                編集
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 基本情報 */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
                                </div>
                                <div className="px-6 py-4 space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">氏名</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{resident.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">部屋番号</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {resident.room_number ? `${resident.room_number}号室` : '未設定'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">性別</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {resident.gender === 'male' ? '男性' : resident.gender === 'female' ? '女性' : '未設定'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">年齢</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {resident.birth_date ? `${getAge(resident.birth_date)}歳` : '未設定'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">所属部署</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {resident.department?.department_name}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">入居状況</dt>
                                        <dd className="mt-1">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                resident.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {resident.is_active ? '入居中' : '退居済み'}
                                            </span>
                                        </dd>
                                    </div>
                                </div>
                            </div>

                            {/* スケジュール統計 */}
                            <div className="mt-6 bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">スケジュール統計</h3>
                                </div>
                                <div className="px-6 py-4 space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">総スケジュール数</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{scheduleStats.total_schedules}件</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">最近30日間</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{scheduleStats.recent_schedules}件</dd>
                                    </div>
                                    {Object.entries(scheduleStats.by_type).map(([type, count]) => (
                                        <div key={type}>
                                            <dt className="text-sm font-medium text-gray-500">{type}</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{count}件</dd>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* メインコンテンツ */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* 医療情報 */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">医療情報・注意事項</h3>
                                </div>
                                <div className="px-6 py-4">
                                    <p className="text-sm text-gray-900">
                                        {resident.medical_info || '特記事項はありません。'}
                                    </p>
                                </div>
                            </div>

                            {/* 今後のスケジュール */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        今後のスケジュール ({upcomingSchedules.length}件)
                                    </h3>
                                </div>
                                <div className="px-6 py-4">
                                    {upcomingSchedules.length === 0 ? (
                                        <p className="text-sm text-gray-500">今後のスケジュールはありません。</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {upcomingSchedules.map((schedule) => (
                                                <div key={schedule.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                                    <div 
                                                        className="w-3 h-3 rounded-full mt-1"
                                                        style={{ backgroundColor: schedule.schedule_type.color_code }}
                                                    ></div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-sm font-medium text-gray-900">
                                                                {schedule.title}
                                                            </h4>
                                                            <span className="text-xs text-gray-500">
                                                                {schedule.schedule_type.name}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {formatDate(schedule.date)}
                                                            {!schedule.all_day && (
                                                                <span className="ml-2">
                                                                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                                                </span>
                                                            )}
                                                        </p>
                                                        {schedule.description && (
                                                            <p className="text-sm text-gray-500 mt-1">
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

                            {/* 最近のスケジュール履歴 */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        最近のスケジュール履歴 (過去30日間)
                                    </h3>
                                </div>
                                <div className="px-6 py-4">
                                    {recentSchedules.length === 0 ? (
                                        <p className="text-sm text-gray-500">最近のスケジュールはありません。</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentSchedules.map((schedule) => (
                                                <div key={schedule.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                                                    <div 
                                                        className="w-3 h-3 rounded-full mt-1"
                                                        style={{ backgroundColor: schedule.schedule_type.color_code }}
                                                    ></div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-sm font-medium text-gray-900">
                                                                {schedule.title}
                                                            </h4>
                                                            <span className="text-xs text-gray-500">
                                                                {schedule.schedule_type.name}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {formatDate(schedule.date)}
                                                            {!schedule.all_day && (
                                                                <span className="ml-2">
                                                                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                                                </span>
                                                            )}
                                                        </p>
                                                        {schedule.description && (
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {schedule.description}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            作成者: {schedule.creator?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

## ✅ 確認方法

Phase 5 が完了したら、以下を確認してください：

### CRUD機能の確認

- [ ] 住民一覧が正常に表示される
- [ ] 検索・フィルタが動作する
- [ ] 住民詳細画面が表示される
- [ ] 住民情報の編集が可能
- [ ] 安全な削除処理が動作する

### データ整合性の確認

```bash
# 住民とスケジュールの関連を確認
./vendor/bin/sail artisan tinker
>> $resident = Resident::first();
>> $resident->schedules()->count();

# 削除処理のテスト（開発環境のみ）
>> $testResident = Resident::create(['name' => 'テスト住民', ...]);
>> $testResident->delete();
```

## 🎯 次の段階への準備

Phase 5 が正常に完了したら、以下を確認してから Phase 6 に進みます：

- [ ] 住民CRUD機能が完全に動作している
- [ ] 検索・フィルタ機能が正常
- [ ] スケジュール連携が適切
- [ ] データ整合性が保護されている
- [ ] パフォーマンスが最適化されている

**次回**: [Phase 6: 品質向上・バグ修正](phase-06-quality-improvement.md) では、実際の開発で発生したバグの修正とパフォーマンス改善を行います。

---

**💡 Phase 5 のポイント**: 
- **包括的CRUD**: 検索・フィルタを含む完全な住民管理機能
- **データ保護**: 関連スケジュールを考慮した安全な削除処理
- **UX重視**: 使いやすい検索・一覧・詳細画面の設計
- **パフォーマンス**: N+1問題の回避とページネーション対応