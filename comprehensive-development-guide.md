# 介護施設カレンダーアプリ開発ガイド：未経験者から実用レベルまで

## 🎯 このガイドについて

このガイドは、**実際の開発履歴（11のPR、438コミット）を詳細分析**して作成された、未経験者でも段階的に実用レベルのアプリケーションを開発できる包括的な教育ドキュメントです。

**特徴**:
- 実際の開発者の思考プロセスと試行錯誤を再現
- よくある間違いとその解決方法を事前に明示
- 各段階での学習ポイントと次のステップを明確化

---

## 📊 プロジェクト概要

### 何を作るのか
**介護施設向け入浴スケジュール管理システム**

- 📅 **カレンダー型UI**で入浴スケジュールを管理
- 👥 **住民管理機能**でドラッグ&ドロップによる直感的操作
- 🔐 **職員認証システム**で権限管理
- 📱 **レスポンシブデザイン**でモバイル対応

### 完成形のイメージ
```
┌─────────────────────────────────────────────────────────────┐
│ 🏥 介護施設カレンダーシステム                               │
├─────────────────────────────────────────────────────────────┤
│ [住民一覧]  │           [カレンダー表示]                     │
│ ▫ 田中太郎  │  月   火   水   木   金   土   日              │
│ ▫ 佐藤花子  │ ┌──┬──┬──┬──┬──┬──┬──┐               │
│ ▫ 山田次郎  │ │予│予│  │  │予│  │  │               │
│ (ドラッグ可) │ │定│定│  │  │定│  │  │               │
│             │ ├─入─入─入─入─入─入─入─┤               │
│             │ │浴│浴│浴│浴│浴│浴│浴│               │
│             │ └──┴──┴──┴──┴──┴──┴──┘               │
└─────────────────────────────────────────────────────────────┘
```

### 技術スタック
- **バックエンド**: Laravel 12 (PHP)
- **フロントエンド**: React + Inertia.js
- **スタイリング**: Tailwind CSS
- **データベース**: MySQL/PostgreSQL
- **認証**: Laravel Breeze

### 必要な前提知識

#### 必須レベル（開始前に要習得）
- HTML/CSS の基本
- PHP の基本構文
- JavaScript の基本

#### 推奨レベル（進行中に学習可能）
- Laravel の基本概念
- React の基本
- データベース設計の基礎

---

## 🏗️ 開発環境構築ガイド

### 必要なツール

#### 1. 基本環境
```bash
# PHP 8.2以上
php --version

# Composer（PHPパッケージマネージャー）
composer --version

# Node.js 20以上
node --version
npm --version

# Docker（推奨）
docker --version
docker-compose --version
```

#### 2. 開発ツール
```bash
# Git
git --version

# VS Code（推奨エディタ）
code --version
```

### セットアップ手順

#### STEP 1: プロジェクト初期化（30分）

```bash
# Laravel プロジェクト作成
composer create-project laravel/laravel care-facility-calendar
cd care-facility-calendar

# Laravel Breezeインストール（認証機能）
composer require laravel/breeze --dev
./vendor/bin/sail artisan breeze:install react
npm install && npm run build

# データベース設定
cp .env.example .env
php artisan key:generate

# .envファイル編集（データベース設定）
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=care_facility_calendar
DB_USERNAME=sail
DB_PASSWORD=password
```

#### STEP 2: 開発環境起動確認（15分）

```bash
# Sailを起動
./vendor/bin/sail up -d

# データベースマイグレーション
./vendor/bin/sail artisan migrate

# フロントエンド開発サーバー
npm run dev
```

**確認項目**:
- [ ] http://localhost でWelcome画面が表示される
- [ ] http://localhost/register で登録画面が表示される
- [ ] 新規ユーザー登録とログインができる

---

## 🚀 段階的実装ガイド

## Phase 1: データベース基盤構築（PR #1相当）

### この段階の目標
- **基本的なデータベース設計を理解する**
- **Laravel のマイグレーション・モデル・シーダーの仕組みを学ぶ**
- **リレーションの設計パターンを身につける**

### 実装する機能
1. 部署管理テーブル
2. 住民管理テーブル
3. スケジュール種別テーブル
4. カレンダー日付テーブル
5. スケジュールテーブル
6. 権限管理テーブル

### 学習ポイント
- **マイグレーション**の正しい書き方
- **モデルリレーション**の設定方法
- **シーダー**による初期データ投入
- **インデックス設計**の考え方

---

### 🛠️ 実装手順 1-1: 部署管理機能

#### 背景知識
実際の開発では「部署 → 住民 → スケジュール」の順序で設計されました。これはリレーションの依存関係を考慮した結果です。

#### 手順

**1. マイグレーション作成**
```bash
./vendor/bin/sail artisan make:migration create_departments_table
```

**2. マイグレーションファイル編集**
```php
// database/migrations/xxxx_create_departments_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('department_name', 100)->comment('部署名');
            $table->timestamps();
            
            // インデックス設定
            $table->index('department_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
```

**3. モデル作成**
```bash
./vendor/bin/sail artisan make:model Department
```

```php
// app/Models/Department.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_name',
    ];

    // リレーション: 部署は複数のユーザーを持つ
    public function users()
    {
        return $this->hasMany(User::class);
    }

    // リレーション: 部署は複数の住民を持つ
    public function residents()
    {
        return $this->hasMany(Resident::class);
    }
}
```

**4. コントローラー作成**
```bash
./vendor/bin/sail artisan make:controller DepartmentController --resource
```

```php
// app/Http/Controllers/DepartmentController.php
<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::with('users', 'residents')->get();
        return response()->json($departments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_name' => 'required|string|max:100|unique:departments'
        ]);

        $department = Department::create($validated);
        return response()->json($department, 201);
    }

    public function show(Department $department)
    {
        return response()->json($department->load('users', 'residents'));
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'department_name' => 'required|string|max:100|unique:departments,department_name,' . $department->id
        ]);

        $department->update($validated);
        return response()->json($department);
    }

    public function destroy(Department $department)
    {
        $department->delete();
        return response()->json(null, 204);
    }
}
```

**5. シーダー作成**
```bash
./vendor/bin/sail artisan make:seeder DepartmentSeeder
```

```php
// database/seeders/DepartmentSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['department_name' => '看護部'],
            ['department_name' => '介護部'],
            ['department_name' => 'リハビリテーション部'],
            ['department_name' => '栄養管理部'],
            ['department_name' => '事務部'],
        ];

        foreach ($departments as $department) {
            Department::create($department);
        }
    }
}
```

**6. 実行とテスト**
```bash
# マイグレーション実行
./vendor/bin/sail artisan migrate

# シーダー実行
./vendor/bin/sail artisan db:seed --class=DepartmentSeeder

# 動作確認
./vendor/bin/sail artisan tinker
# >> Department::all()
# >> Department::find(1)->users
```

#### よくあるエラーと解決方法

**エラー1: `SQLSTATE[42000]: Syntax error`**
```
原因: カラム名やテーブル名にMySQLの予約語を使用
解決: バッククォートで囲むか、別の名前を使用
```

**エラー2: `Class 'Department' not found`**
```
原因: オートローダーのキャッシュが古い
解決: composer dump-autoload
```

---

### 🛠️ 実装手順 1-2: ユーザー管理機能拡張

#### 背景
実際の開発では、既存のusersテーブルを**一度リセット**して再構築しました。これは設計変更の際によくある手法です。

#### 手順

**1. ユーザーテーブル拡張マイグレーション**
```bash
./vendor/bin/sail artisan make:migration modify_users_table_for_staff
```

```php
// database/migrations/xxxx_modify_users_table_for_staff.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 職員用の追加カラム
            $table->string('username', 50)->unique()->after('name')->comment('ログインID');
            $table->enum('role', ['admin', 'staff', 'viewer'])->default('staff')->after('email')->comment('権限');
            $table->foreignId('department_id')->nullable()->constrained()->after('role')->comment('所属部署');
            
            // emailをnullableに変更（ユーザー名ログイン対応）
            $table->string('email')->nullable()->change();
            
            // インデックス設定
            $table->index('username');
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'role', 'department_id']);
            $table->string('email')->nullable(false)->change();
        });
    }
};
```

**2. Userモデル更新**
```php
// app/Models/User.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'department_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // リレーション: ユーザーは1つの部署に属する
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    // リレーション: ユーザーは複数の権限を持つ
    public function permissions()
    {
        return $this->hasMany(Permission::class);
    }

    // 権限チェックメソッド
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function canEditSchedules()
    {
        return in_array($this->role, ['admin', 'staff']);
    }
}
```

**3. ユーザーシーダー作成**
```bash
./vendor/bin/sail artisan make:seeder UserSeeder
```

```php
// database/seeders/UserSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 管理者ユーザー
        User::create([
            'name' => '管理者 太郎',
            'username' => 'admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'department_id' => Department::where('department_name', '事務部')->first()->id,
        ]);

        // 一般職員ユーザー
        $departments = Department::all();
        $staffNames = [
            ['name' => '看護師 花子', 'username' => 'nurse01'],
            ['name' => '介護士 次郎', 'username' => 'care01'],
            ['name' => '理学療法士 三郎', 'username' => 'pt01'],
        ];

        foreach ($staffNames as $index => $staff) {
            User::create([
                'name' => $staff['name'],
                'username' => $staff['username'],
                'email' => $staff['username'] . '@example.com',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'department_id' => $departments[$index % $departments->count()]->id,
            ]);
        }
    }
}
```

#### 開発者の学び
実際の開発では以下の試行錯誤がありました：

1. **最初**: emailベースの認証
2. **問題発見**: 介護施設職員はメールアドレスを持たない場合が多い
3. **解決**: usernameベースの認証に変更
4. **学習**: 要件変更時のマイグレーション戦略の重要性

---

### 🛠️ 実装手順 1-3: 住民管理機能

#### 手順

**1. マイグレーション作成**
```bash
./vendor/bin/sail artisan make:migration create_residents_table
```

```php
// database/migrations/xxxx_create_residents_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('residents', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->comment('住民氏名');
            $table->string('room_number', 20)->nullable()->comment('部屋番号');
            $table->enum('gender', ['male', 'female', 'other'])->nullable()->comment('性別');
            $table->date('birth_date')->nullable()->comment('生年月日');
            $table->text('medical_info')->nullable()->comment('医療情報・注意事項');
            $table->foreignId('department_id')->constrained()->comment('所属部署');
            $table->boolean('is_active')->default(true)->comment('入居中フラグ');
            $table->timestamps();
            
            // インデックス設定
            $table->index('name');
            $table->index('room_number');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('residents');
    }
};
```

**2. モデル作成**
```php
// app/Models/Resident.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Resident extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'room_number',
        'gender',
        'birth_date',
        'medical_info',
        'department_id',
        'is_active',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'is_active' => 'boolean',
    ];

    // リレーション
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    // アクセサ: 年齢計算
    public function getAgeAttribute()
    {
        return $this->birth_date ? Carbon::parse($this->birth_date)->age : null;
    }

    // スコープ: アクティブな住民のみ
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // スコープ: 部屋番号順
    public function scopeOrderByRoom($query)
    {
        return $query->orderBy('room_number');
    }
}
```

**3. 住民シーダー作成**
```php
// database/seeders/ResidentSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Resident;
use App\Models\Department;
use Carbon\Carbon;

class ResidentSeeder extends Seeder
{
    public function run(): void
    {
        $caregivers = Department::where('department_name', '介護部')->first();
        
        $residents = [
            [
                'name' => '田中 太郎',
                'room_number' => '101',
                'gender' => 'male',
                'birth_date' => Carbon::parse('1935-03-15'),
                'medical_info' => '糖尿病、高血圧症の既往歴あり。血糖値管理が必要。',
                'department_id' => $caregivers->id,
            ],
            [
                'name' => '佐藤 花子',
                'room_number' => '102',
                'gender' => 'female',
                'birth_date' => Carbon::parse('1940-07-22'),
                'medical_info' => '認知症初期段階。見守りが必要。',
                'department_id' => $caregivers->id,
            ],
            [
                'name' => '山田 次郎',
                'room_number' => '103',
                'gender' => 'male',
                'birth_date' => Carbon::parse('1938-11-08'),
                'medical_info' => '脳梗塞の既往歴。右半身に軽度の麻痺あり。',
                'department_id' => $caregivers->id,
            ],
            [
                'name' => '鈴木 一郎',
                'room_number' => '104',
                'gender' => 'male',
                'birth_date' => Carbon::parse('1942-01-30'),
                'medical_info' => '特記事項なし。自立度高い。',
                'department_id' => $caregivers->id,
            ],
            [
                'name' => '高橋 美子',
                'room_number' => '105',
                'gender' => 'female',
                'birth_date' => Carbon::parse('1936-05-12'),
                'medical_info' => 'アルツハイマー型認知症。徘徊リスクあり。',
                'department_id' => $caregivers->id,
            ],
        ];

        foreach ($residents as $resident) {
            Resident::create($resident);
        }
    }
}
```

---

### 🛠️ 実装手順 1-4: スケジュール関連機能

#### 1. スケジュール種別テーブル

```bash
./vendor/bin/sail artisan make:migration create_schedule_types_table
```

```php
// database/migrations/xxxx_create_schedule_types_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->comment('種別名');
            $table->string('color_code', 7)->default('#3B82F6')->comment('表示色（16進数）');
            $table->string('description')->nullable()->comment('説明');
            $table->boolean('is_active')->default(true)->comment('有効フラグ');
            $table->timestamps();
            
            // インデックス
            $table->index('name');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_types');
    }
};
```

```php
// app/Models/ScheduleType.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduleType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'color_code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
```

```php
// database/seeders/ScheduleTypeSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ScheduleType;

class ScheduleTypeSeeder extends Seeder
{
    public function run(): void
    {
        $scheduleTypes = [
            [
                'name' => '入浴',
                'color_code' => '#3B82F6',
                'description' => '住民の入浴スケジュール',
            ],
            [
                'name' => '医療行為',
                'color_code' => '#EF4444',
                'description' => '医師による診察・治療',
            ],
            [
                'name' => 'リハビリ',
                'color_code' => '#10B981',
                'description' => '理学療法・作業療法',
            ],
            [
                'name' => 'レクリエーション',
                'color_code' => '#F59E0B',
                'description' => '集団活動・娯楽',
            ],
            [
                'name' => '面会',
                'color_code' => '#8B5CF6',
                'description' => '家族・友人との面会',
            ],
        ];

        foreach ($scheduleTypes as $type) {
            ScheduleType::create($type);
        }
    }
}
```

#### 2. カレンダー日付テーブル

```bash
./vendor/bin/sail artisan make:migration create_calendar_dates_table
```

```php
// database/migrations/xxxx_create_calendar_dates_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_dates', function (Blueprint $table) {
            $table->id();
            $table->date('calendar_date')->unique()->comment('日付');
            $table->string('day_of_week', 10)->comment('曜日');
            $table->boolean('is_holiday')->default(false)->comment('祝日フラグ');
            $table->string('holiday_name')->nullable()->comment('祝日名');
            $table->boolean('is_weekend')->default(false)->comment('週末フラグ');
            $table->timestamps();
            
            // インデックス
            $table->index('calendar_date');
            $table->index('is_holiday');
            $table->index('is_weekend');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_dates');
    }
};
```

#### 3. メインスケジュールテーブル

```bash
./vendor/bin/sail artisan make:migration create_schedules_table
```

```php
// database/migrations/xxxx_create_schedules_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200)->comment('スケジュールタイトル');
            $table->text('description')->nullable()->comment('詳細説明');
            $table->date('date')->comment('実施日');
            $table->time('start_time')->nullable()->comment('開始時刻');
            $table->time('end_time')->nullable()->comment('終了時刻');
            $table->boolean('all_day')->default(false)->comment('終日フラグ');
            $table->foreignId('schedule_type_id')->constrained()->comment('スケジュール種別');
            $table->foreignId('resident_id')->nullable()->constrained()->comment('対象住民');
            $table->foreignId('created_by')->constrained('users')->comment('作成者');
            $table->timestamps();
            
            // インデックス
            $table->index('date');
            $table->index(['date', 'schedule_type_id']);
            $table->index(['resident_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
```

```php
// app/Models/Schedule.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'date',
        'start_time',
        'end_time',
        'all_day',
        'schedule_type_id',
        'resident_id',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'all_day' => 'boolean',
    ];

    // リレーション
    public function scheduleType()
    {
        return $this->belongsTo(ScheduleType::class);
    }

    public function resident()
    {
        return $this->belongsTo(Resident::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // スコープ
    public function scopeByDate($query, $date)
    {
        return $query->where('date', $date);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeByType($query, $typeId)
    {
        return $query->where('schedule_type_id', $typeId);
    }

    // アクセサ
    public function getFormattedTimeAttribute()
    {
        if ($this->all_day) {
            return '終日';
        }
        
        if ($this->start_time && $this->end_time) {
            return $this->start_time->format('H:i') . ' - ' . $this->end_time->format('H:i');
        }
        
        return $this->start_time?->format('H:i') ?: '時刻未設定';
    }
}
```

---

### 🛠️ 実装手順 1-5: 権限管理機能

```bash
./vendor/bin/sail artisan make:migration create_permissions_table
```

```php
// database/migrations/xxxx_create_permissions_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('ユーザーID');
            $table->boolean('can_edit_schedules')->default(false)->comment('スケジュール編集権限');
            $table->boolean('can_manage_residents')->default(false)->comment('住民管理権限');
            $table->boolean('can_view_reports')->default(false)->comment('レポート閲覧権限');
            $table->timestamps();
            
            // インデックス
            $table->index('user_id');
            $table->index('can_edit_schedules');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
```

---

### 🛠️ 実行とテスト

```bash
# 全マイグレーション実行
./vendor/bin/sail artisan migrate

# 全シーダー実行
./vendor/bin/sail artisan db:seed

# 或いは個別に実行
./vendor/bin/sail artisan db:seed --class=DepartmentSeeder
./vendor/bin/sail artisan db:seed --class=UserSeeder
./vendor/bin/sail artisan db:seed --class=ResidentSeeder
./vendor/bin/sail artisan db:seed --class=ScheduleTypeSeeder
```

### 動作確認
```bash
./vendor/bin/sail artisan tinker

# データ確認
>> Department::with('users', 'residents')->get()
>> User::with('department')->get()
>> Resident::with('department')->get()
>> ScheduleType::all()

# リレーション確認
>> $dept = Department::first()
>> $dept->users
>> $dept->residents
```

---

### Phase 1 完了チェックリスト

- [ ] 全テーブルが正常に作成された
- [ ] シーダーで初期データが投入された
- [ ] リレーションが正しく動作する
- [ ] 各モデルでCRUD操作ができる
- [ ] Tinkerでデータの取得・操作ができる

### 次の段階への準備

Phase 1で構築したデータベース基盤を元に、Phase 2では認証システムをカスタマイズし、実際のアプリケーションとして動作させていきます。

**学習の振り返り**:
- マイグレーションの設計思想
- モデルリレーションの設定方法
- シーダーによるテストデータ作成
- 実際の開発での試行錯誤プロセス

---

## Phase 2: 認証システムカスタマイズ（PR #2相当）

### この段階の目標
- **Laravel Breezeベースの認証をカスタマイズする**
- **ユーザー名ベース認証への変更方法を学ぶ**
- **日本語化の実装手法を身につける**
- **権限ベースのアクセス制御を理解する**

### 実装する機能
1. ユーザー名（username）ベース認証
2. 日本語化対応
3. 職員向けユーザー管理画面
4. 権限ベースのアクセス制御

### 学習ポイント
- **認証システムのカスタマイズ手法**
- **Laravel の言語設定・翻訳機能**
- **Middleware によるアクセス制御**
- **React コンポーネントのカスタマイズ**

### 実際の開発での学び
この段階で開発者が直面した課題：
- 介護施設職員はメールアドレスを持たない場合が多い
- 既存のBreezeはemail前提の設計
- 日本語環境での使いやすさが必要

---

### 🛠️ 実装手順 2-1: 認証ロジックの変更

#### 1. 認証設定の変更

```php
// config/auth.php
<?php

return [
    'defaults' => [
        'guard' => 'web',
        'passwords' => 'users',
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,
];
```

#### 2. Userモデルの認証メソッド変更

```php
// app/Models/User.php (追加部分)
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
// ... other imports

class User extends Authenticatable
{
    // ... existing code

    /**
     * 認証に使用するフィールドをusernameに変更
     */
    public function getAuthIdentifierName()
    {
        return 'username';
    }

    /**
     * ユーザー名でユーザーを検索
     */
    public function findForPassport($username)
    {
        return $this->where('username', $username)->first();
    }
}
```

#### 3. 認証リクエストの変更

```php
// app/Http/Requests/Auth/LoginRequest.php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('username', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'username' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'username' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('username')).'|'.$this->ip());
    }
}
```

#### 4. 登録リクエストの変更

```php
// app/Http/Requests/Auth/RegisterRequest.php (新規作成)
<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:50', 'unique:'.User::class],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'department_id' => ['required', 'exists:departments,id'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => '氏名',
            'username' => 'ログインID',
            'email' => 'メールアドレス',
            'password' => 'パスワード',
            'department_id' => '所属部署',
        ];
    }
}
```

---

### 🛠️ 実装手順 2-2: 日本語化対応

#### 1. 言語設定の変更

```php
// config/app.php
<?php

return [
    // ... other config

    'locale' => 'ja',
    'fallback_locale' => 'en',
    'faker_locale' => 'ja_JP',
    'timezone' => 'Asia/Tokyo',

    // ... rest of config
];
```

#### 2. 日本語翻訳ファイルの作成

```php
// lang/ja/auth.php
<?php

return [
    'failed' => 'ログインIDまたはパスワードが正しくありません。',
    'password' => 'パスワードが正しくありません。',
    'throttle' => 'ログイン試行回数が多すぎます。:seconds秒後に再試行してください。',
];
```

```php
// lang/ja/validation.php
<?php

return [
    'accepted' => ':attributeを承認してください。',
    'accepted_if' => ':otherが:valueの場合、:attributeを承認してください。',
    'active_url' => ':attributeは有効なURLではありません。',
    'after' => ':attributeには、:dateより後の日付を指定してください。',
    'after_or_equal' => ':attributeには、:date以降の日付を指定してください。',
    'alpha' => ':attributeはアルファベットのみがご利用できます。',
    'alpha_dash' => ':attributeはアルファベットとダッシュ(-)及び下線(_)がご利用できます。',
    'alpha_num' => ':attributeはアルファベット数字がご利用できます。',
    'array' => ':attributeは配列でなくてはなりません。',
    'ascii' => ':attributeは半角英数字及び記号のみ使用できます。',
    'before' => ':attributeには、:dateより前の日付をご利用ください。',
    'before_or_equal' => ':attributeには、:date以前の日付をご利用ください。',
    'between' => [
        'array' => ':attributeは:min個から:max個の間で指定してください。',
        'file' => ':attributeのファイルは、:minKBから:maxKBの間で指定してください。',
        'numeric' => ':attributeは:minから:maxの間で指定してください。',
        'string' => ':attributeは:min文字から:max文字の間で指定してください。',
    ],
    'boolean' => ':attributeはtrueかfalseを指定してください。',
    'can' => ':attributeフィールドに認可されていない値が含まれています。',
    'confirmed' => ':attributeと確認フィールドとが、一致していません。',
    'current_password' => 'パスワードが正しくありません。',
    'date' => ':attributeには有効な日付を指定してください。',
    'date_equals' => ':attributeには、:dateと同じ日付けを指定してください。',
    'date_format' => ':attributeは:format形式で指定してください。',
    'decimal' => ':attributeは:decimal桁の小数で指定してください。',
    'declined' => ':attributeは拒否してください。',
    'declined_if' => ':otherが:valueの場合、:attributeは拒否してください。',
    'different' => ':attributeと:otherには、異なった内容を指定してください。',
    'digits' => ':attributeは:digits桁で指定してください。',
    'digits_between' => ':attributeは:min桁から:max桁の間で指定してください。',
    'dimensions' => ':attributeの図形サイズが正しくありません。',
    'distinct' => ':attributeフィールドに重複した値があります。',
    'doesnt_end_with' => ':attributeには、:valuesのどれかで終わらない値を指定してください。',
    'doesnt_start_with' => ':attributeには、:valuesのどれかで始まらない値を指定してください。',
    'email' => ':attributeには、有効なメールアドレスを指定してください。',
    'ends_with' => ':attributeには、:valuesのどれかで終わる値を指定してください。',
    'enum' => '選択された:attributeは正しくありません。',
    'exists' => '選択された:attributeは正しくありません。',
    'extensions' => ':attributeには:extensionsのファイルを指定してください。',
    'file' => ':attributeにはファイルを指定してください。',
    'filled' => ':attributeに値を指定してください。',
    'gt' => [
        'array' => ':attributeには:value個より多くのアイテムを指定してください。',
        'file' => ':attributeには:valueKBより大きなファイルを指定してください。',
        'numeric' => ':attributeには:valueより大きな値を指定してください。',
        'string' => ':attributeは:value文字より長く指定してください。',
    ],
    'gte' => [
        'array' => ':attributeには:value個以上のアイテムを指定してください。',
        'file' => ':attributeには:valueKB以上のファイルを指定してください。',
        'numeric' => ':attributeには:value以上の値を指定してください。',
        'string' => ':attributeは:value文字以上で指定してください。',
    ],
    'hex_color' => ':attributeには有効な16進数カラーを指定してください。',
    'image' => ':attributeには画像ファイルを指定してください。',
    'in' => '選択された:attributeは正しくありません。',
    'in_array' => ':attributeには:otherの値を指定してください。',
    'integer' => ':attributeは整数で指定してください。',
    'ip' => ':attributeには、有効なIPアドレスを指定してください。',
    'ipv4' => ':attributeには、有効なIPv4アドレスを指定してください。',
    'ipv6' => ':attributeには、有効なIPv6アドレスを指定してください。',
    'json' => ':attributeには、有効なJSON文字列を指定してください。',
    'list' => ':attributeはリストでなければなりません。',
    'lowercase' => ':attributeは小文字にしてください。',
    'lt' => [
        'array' => ':attributeは:value個未満のアイテムを指定してください。',
        'file' => ':attributeには:valueKB未満のファイルを指定してください。',
        'numeric' => ':attributeには:value未満の値を指定してください。',
        'string' => ':attributeは:value文字未満で指定してください。',
    ],
    'lte' => [
        'array' => ':attributeは:value個以下のアイテムを指定してください。',
        'file' => ':attributeには:valueKB以下のファイルを指定してください。',
        'numeric' => ':attributeには:value以下の値を指定してください。',
        'string' => ':attributeは:value文字以下で指定してください。',
    ],
    'mac_address' => ':attributeは有効なMACアドレスでなければなりません。',
    'max' => [
        'array' => ':attributeは:max個以下のアイテムを指定してください。',
        'file' => ':attributeには、:maxKB以下のファイルを指定してください。',
        'numeric' => ':attributeには、:max以下の数字を指定してください。',
        'string' => ':attributeは、:max文字以下で指定してください。',
    ],
    'max_digits' => ':attributeは:max桁以下で指定してください。',
    'mimes' => ':attributeには:valuesタイプのファイルを指定してください。',
    'mimetypes' => ':attributeには:valuesタイプのファイルを指定してください。',
    'min' => [
        'array' => ':attributeは:min個以上のアイテムを指定してください。',
        'file' => ':attributeには、:minKB以上のファイルを指定してください。',
        'numeric' => ':attributeには、:min以上の数字を指定してください。',
        'string' => ':attributeは、:min文字以上で指定してください。',
    ],
    'min_digits' => ':attributeは:min桁以上で指定してください。',
    'missing' => ':attributeフィールドは存在しない必要があります。',
    'missing_if' => ':otherが:valueの場合、:attributeフィールドは存在しない必要があります。',
    'missing_unless' => ':otherが:valueでない場合、:attributeフィールドは存在しない必要があります。',
    'missing_with' => ':valuesが存在する場合、:attributeフィールドは存在しない必要があります。',
    'missing_with_all' => ':valuesが存在する場合、:attributeフィールドは存在しない必要があります。',
    'multiple_of' => ':attributeには、:valueの倍数を指定してください。',
    'not_in' => '選択された:attributeは正しくありません。',
    'not_regex' => ':attributeの形式が正しくありません。',
    'numeric' => ':attributeには、数字を指定してください。',
    'password' => [
        'letters' => ':attributeは最低1つの文字を含む必要があります。',
        'mixed' => ':attributeは最低1つの大文字と小文字を含む必要があります。',
        'numbers' => ':attributeは最低1つの数字を含む必要があります。',
        'symbols' => ':attributeは最低1つの記号を含む必要があります。',
        'uncompromised' => '指定された:attributeはデータリークに含まれています。別の:attributeを選択してください。',
    ],
    'present' => ':attributeフィールドが存在していません。',
    'present_if' => ':otherが:valueの場合、:attributeフィールドが存在している必要があります。',
    'present_unless' => ':otherが:valueでない場合、:attributeフィールドが存在している必要があります。',
    'present_with' => ':valuesが存在する場合、:attributeフィールドが存在している必要があります。',
    'present_with_all' => ':valuesが存在する場合、:attributeフィールドが存在している必要があります。',
    'prohibited' => ':attributeフィールドは禁止されています。',
    'prohibited_if' => ':otherが:valueの場合、:attributeフィールドは禁止されています。',
    'prohibited_unless' => ':otherが:valuesでない場合、:attributeフィールドは禁止されています。',
    'prohibits' => ':attributeフィールドは:otherの存在を禁じています。',
    'regex' => ':attributeに正しい形式を指定してください。',
    'required' => ':attributeは必ず指定してください。',
    'required_array_keys' => ':attributeには:valuesのエントリを含める必要があります。',
    'required_if' => ':otherが:valueの場合、:attributeも指定してください。',
    'required_if_accepted' => ':otherが受け入れられた場合、:attributeを指定してください。',
    'required_if_declined' => ':otherが拒否された場合、:attributeを指定してください。',
    'required_unless' => ':otherが:valuesでない場合、:attributeを指定してください。',
    'required_with' => ':valuesを指定する場合は、:attributeも指定してください。',
    'required_with_all' => ':valuesを指定する場合は、:attributeも指定してください。',
    'required_without' => ':valuesを指定しない場合は、:attributeを指定してください。',
    'required_without_all' => ':valuesのどれも指定しない場合は、:attributeを指定してください。',
    'same' => ':attributeと:otherには同じ値を指定してください。',
    'size' => [
        'array' => ':attributeは:size個指定してください。',
        'file' => ':attributeのファイルは、:sizeKBにしてください。',
        'numeric' => ':attributeは:sizeを指定してください。',
        'string' => ':attributeは:size文字で指定してください。',
    ],
    'starts_with' => ':attributeには、:valuesのどれかで始まる値を指定してください。',
    'string' => ':attributeは文字列を指定してください。',
    'timezone' => ':attributeには、有効なタイムゾーンを指定してください。',
    'unique' => ':attributeの値は既に存在しています。',
    'uploaded' => ':attributeのアップロードに失敗しました。',
    'uppercase' => ':attributeは大文字にしてください。',
    'url' => ':attributeは有効なURLを指定してください。',
    'ulid' => ':attributeは有効なULIDを指定してください。',
    'uuid' => ':attributeは有効なUUIDを指定してください。',

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],
    ],

    'attributes' => [
        'name' => '氏名',
        'username' => 'ログインID',
        'email' => 'メールアドレス',
        'password' => 'パスワード',
        'password_confirmation' => 'パスワード（確認）',
        'department_id' => '所属部署',
        'role' => '権限',
        'room_number' => '部屋番号',
        'gender' => '性別',
        'birth_date' => '生年月日',
        'medical_info' => '医療情報',
        'title' => 'タイトル',
        'description' => '説明',
        'date' => '日付',
        'start_time' => '開始時刻',
        'end_time' => '終了時刻',
        'schedule_type_id' => 'スケジュール種別',
        'resident_id' => '対象住民',
    ],
];
```

---

### 🛠️ 実装手順 2-3: React コンポーネントのカスタマイズ

#### 1. ログインフォームの変更

```jsx
// resources/js/Pages/Auth/Login.jsx
import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="ログイン" />

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">介護施設カレンダーシステム</h1>
                <p className="text-gray-600 mt-2">ログインIDとパスワードを入力してください</p>
            </div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="username" value="ログインID" />

                    <TextInput
                        id="username"
                        type="text"
                        name="username"
                        value={data.username}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('username', e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                document.getElementById('password').focus();
                            }
                        }}
                    />

                    <InputError message={errors.username} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="パスワード" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="block mt-4">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="ms-2 text-sm text-gray-600">ログイン状態を保持する</span>
                    </label>
                </div>

                <div className="flex items-center justify-end mt-4">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            パスワードを忘れた場合
                        </Link>
                    )}

                    <PrimaryButton className="ms-4" disabled={processing}>
                        ログイン
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
```

#### 2. 登録フォームの変更

```jsx
// resources/js/Pages/Auth/Register.jsx
import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import SelectInput from '@/Components/SelectInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register({ departments }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        department_id: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <GuestLayout>
            <Head title="職員登録" />

            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">新規職員登録</h1>
                <p className="text-gray-600 mt-2">職員情報を入力してください</p>
            </div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="氏名" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="username" value="ログインID" />

                    <TextInput
                        id="username"
                        name="username"
                        value={data.username}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('username', e.target.value)}
                        required
                    />

                    <InputError message={errors.username} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-1">
                        ログイン時に使用するIDです。半角英数字で設定してください。
                    </p>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="メールアドレス（任意）" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="email"
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-1">
                        メールアドレスは任意です。パスワードリセット時に使用されます。
                    </p>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="department_id" value="所属部署" />

                    <select
                        id="department_id"
                        name="department_id"
                        value={data.department_id}
                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        onChange={(e) => setData('department_id', e.target.value)}
                        required
                    >
                        <option value="">部署を選択してください</option>
                        {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                                {department.department_name}
                            </option>
                        ))}
                    </select>

                    <InputError message={errors.department_id} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="パスワード" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password_confirmation" value="パスワード（確認）" />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />

                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="flex items-center justify-end mt-4">
                    <Link
                        href={route('login')}
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        すでにアカウントをお持ちですか？
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        登録
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
```

---

### 🛠️ 実装手順 2-4: コントローラーの変更

```php
// app/Http/Controllers/Auth/RegisteredUserController.php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Department;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register', [
            'departments' => Department::orderBy('department_name')->get(['id', 'department_name']),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:'.User::class,
            'email' => 'nullable|string|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'department_id' => 'required|exists:departments,id',
        ], [], [
            'name' => '氏名',
            'username' => 'ログインID',
            'email' => 'メールアドレス',
            'password' => 'パスワード',
            'department_id' => '所属部署',
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'department_id' => $request->department_id,
            'role' => 'staff', // デフォルトは一般職員
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
```

---

### 動作確認

```bash
# Sailを起動
./vendor/bin/sail up -d
npm run dev

# 確認項目
# 1. /register でユーザー名ベースの登録ができる
# 2. /login でユーザー名ベースのログインができる
# 3. エラーメッセージが日本語で表示される
# 4. 部署選択が正常に動作する
```

### よくあるエラーと解決方法

**エラー1: `Call to undefined method App\Models\User::getAuthIdentifierName()`**
```
原因: メソッド名のスペルミス
解決: getAuthIdentifierName() の正確な実装を確認
```

**エラー2: `SQLSTATE[23000]: Integrity constraint violation`**
```
原因: username カラムのユニーク制約違反
解決: 既存データを確認し、重複するusernameを修正
```

---

### Phase 2 完了チェックリスト

- [ ] ユーザー名ベースの認証が動作する
- [ ] 日本語でのエラーメッセージが表示される
- [ ] 職員登録で部署選択ができる
- [ ] ログイン・ログアウトが正常に動作する
- [ ] 権限（role）が正しく設定される

### 学習の振り返り

Phase 2では以下を学習しました：
- **Laravel認証システムのカスタマイズ方法**
- **多言語対応の実装手法**
- **Reactコンポーネントの実践的なカスタマイズ**
- **実際の業務要件に応じた設計変更**

Phase 3では、これらの基盤の上にスケジュールのサンプルデータとUIの第一版を構築していきます。

---

## Phase 3: スケジュールサンプルデータ（PR #3相当）

### この段階の目標
- **実際のアプリケーションで使用するサンプルデータを作成する**
- **シーダーの実践的な使い方を学ぶ**
- **テストデータの重要性を理解する**

実際の開発ではこのフェーズが非常に短時間（3コミットのみ）で完了しており、データドリブン開発の重要性が分かります。

### 実装する機能
1. 実用的なスケジュールサンプルデータ
2. 日付範囲での一括データ生成
3. テストシナリオに基づくデータ設計

### 学習ポイント
- **Factory パターンの活用**
- **リアルなテストデータの作成手法**
- **開発効率を向上させるシーダー設計**

### 🛠️ 実装手順 3-1: スケジュールファクトリー作成

#### 1. ScheduleFactory作成

```bash
./vendor/bin/sail artisan make:factory ScheduleFactory
```

```php
// database/factories/ScheduleFactory.php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\ScheduleType;
use App\Models\Resident;
use App\Models\User;
use Carbon\Carbon;

class ScheduleFactory extends Factory
{
    public function definition(): array
    {
        $date = $this->faker->dateTimeBetween('now', '+30 days');
        $startTime = $this->faker->time('H:i', '18:00');
        $endTime = Carbon::parse($startTime)->addHours(1)->format('H:i');

        return [
            'title' => $this->faker->randomElement([
                '入浴サービス',
                '午前入浴',
                '午後入浴',
                '夕方入浴',
            ]),
            'description' => $this->faker->optional(0.3)->sentence(),
            'date' => $date->format('Y-m-d'),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'all_day' => false,
            'schedule_type_id' => ScheduleType::factory(),
            'resident_id' => Resident::factory(),
            'created_by' => User::factory(),
        ];
    }

    /**
     * 入浴スケジュール専用
     */
    public function bathingSchedule(): static
    {
        return $this->state(function (array $attributes) {
            $bathType = ScheduleType::where('name', '入浴')->first();
            
            return [
                'title' => $this->faker->randomElement([
                    '一般浴槽',
                    '特浴（リフト浴）',
                    'シャワー浴',
                    '清拭',
                ]),
                'schedule_type_id' => $bathType ? $bathType->id : ScheduleType::factory(),
                'start_time' => $this->faker->randomElement(['09:00', '10:00', '14:00', '15:00']),
                'end_time' => $this->faker->randomElement(['10:00', '11:00', '15:00', '16:00']),
            ];
        });
    }

    /**
     * 特定の日付範囲
     */
    public function forDateRange(string $startDate, string $endDate): static
    {
        return $this->state(function (array $attributes) use ($startDate, $endDate) {
            return [
                'date' => $this->faker->dateTimeBetween($startDate, $endDate)->format('Y-m-d'),
            ];
        });
    }

    /**
     * 週間スケジュール生成用
     */
    public function weeklyPattern(): static
    {
        return $this->state(function (array $attributes) {
            $dayOfWeek = Carbon::parse($attributes['date'])->dayOfWeek;
            
            // 月・水・金は入浴日
            if (in_array($dayOfWeek, [Carbon::MONDAY, Carbon::WEDNESDAY, Carbon::FRIDAY])) {
                return [
                    'title' => '定期入浴',
                    'start_time' => '14:00',
                    'end_time' => '15:00',
                ];
            }
            
            return $attributes;
        });
    }
}
```

#### 2. ResidentFactory作成

```bash
./vendor/bin/sail artisan make:factory ResidentFactory
```

```php
// database/factories/ResidentFactory.php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Department;
use Carbon\Carbon;

class ResidentFactory extends Factory
{
    public function definition(): array
    {
        $names = [
            '田中 太郎', '佐藤 花子', '山田 次郎', '鈴木 一郎', '高橋 美子',
            '伊藤 三郎', '渡辺 久子', '中村 良子', '小林 正雄', '加藤 和子',
            '吉田 春雄', '山本 秋子', '佐々木 冬美', '松本 夏男', '井上 光子',
        ];

        $medicalInfos = [
            '糖尿病、高血圧症の既往歴あり。血糖値管理が必要。',
            '認知症初期段階。見守りが必要。',
            '脳梗塞の既往歴。右半身に軽度の麻痺あり。',
            '特記事項なし。自立度高い。',
            'アルツハイマー型認知症。徘徊リスクあり。',
            '関節リウマチ。歩行時に介助が必要。',
            '骨粗鬆症。転倒リスクあり。',
            '心房細動。抗凝固薬服用中。',
            '慢性腎臓病。水分制限あり。',
            '誤嚥性肺炎の既往。食事時要注意。',
        ];

        return [
            'name' => $this->faker->randomElement($names),
            'room_number' => $this->faker->unique()->numerify('##0'),
            'gender' => $this->faker->randomElement(['male', 'female']),
            'birth_date' => $this->faker->dateTimeBetween('-100 years', '-65 years'),
            'medical_info' => $this->faker->randomElement($medicalInfos),
            'department_id' => Department::factory(),
            'is_active' => true,
        ];
    }

    /**
     * 入居中の住民
     */
    public function active(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'is_active' => true,
            ];
        });
    }

    /**
     * 男性住民
     */
    public function male(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'gender' => 'male',
            ];
        });
    }

    /**
     * 女性住民
     */
    public function female(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'gender' => 'female',
            ];
        });
    }
}
```

---

### 🛠️ 実装手順 3-2: 実用的なスケジュールシーダー

```bash
./vendor/bin/sail artisan make:seeder ScheduleSeeder
```

```php
// database/seeders/ScheduleSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Schedule;
use App\Models\ScheduleType;
use App\Models\Resident;
use App\Models\User;
use Carbon\Carbon;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        // 必要なデータを取得
        $bathType = ScheduleType::where('name', '入浴')->first();
        $residents = Resident::active()->get();
        $staff = User::where('role', 'staff')->first();

        if (!$bathType || $residents->isEmpty() || !$staff) {
            $this->command->warn('必要なデータが不足しています。DepartmentSeeder, UserSeeder, ResidentSeeder, ScheduleTypeSeederを先に実行してください。');
            return;
        }

        $this->command->info('スケジュールサンプルデータを生成中...');

        // 今日から30日間のスケジュール生成
        $startDate = Carbon::today();
        $endDate = Carbon::today()->addDays(30);

        $scheduleCount = 0;

        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            // 月・水・金は入浴日として設定
            if (in_array($date->dayOfWeek, [Carbon::MONDAY, Carbon::WEDNESDAY, Carbon::FRIDAY])) {
                
                // 各住民の入浴スケジュールを作成（全員ではなくランダムに選択）
                $selectedResidents = $residents->random(min(8, $residents->count()));
                
                foreach ($selectedResidents as $index => $resident) {
                    // 時間をずらして入浴スケジュール作成
                    $startTime = Carbon::parse('09:00')->addMinutes($index * 30);
                    $endTime = $startTime->copy()->addMinutes(30);

                    Schedule::create([
                        'title' => $this->getBathTitle($resident),
                        'description' => $this->getBathDescription($resident),
                        'date' => $date->format('Y-m-d'),
                        'start_time' => $startTime->format('H:i'),
                        'end_time' => $endTime->format('H:i'),
                        'all_day' => false,
                        'schedule_type_id' => $bathType->id,
                        'resident_id' => $resident->id,
                        'created_by' => $staff->id,
                    ]);

                    $scheduleCount++;
                }
            }

            // 土曜日には一部の住民のみ入浴
            if ($date->dayOfWeek === Carbon::SATURDAY) {
                $selectedResidents = $residents->random(min(3, $residents->count()));
                
                foreach ($selectedResidents as $index => $resident) {
                    $startTime = Carbon::parse('10:00')->addMinutes($index * 45);
                    $endTime = $startTime->copy()->addMinutes(30);

                    Schedule::create([
                        'title' => '週末入浴',
                        'description' => '週末の追加入浴サービス',
                        'date' => $date->format('Y-m-d'),
                        'start_time' => $startTime->format('H:i'),
                        'end_time' => $endTime->format('H:i'),
                        'all_day' => false,
                        'schedule_type_id' => $bathType->id,
                        'resident_id' => $resident->id,
                        'created_by' => $staff->id,
                    ]);

                    $scheduleCount++;
                }
            }
        }

        // 追加：その他のスケジュール種別のサンプルデータ
        $this->createOtherSchedules($residents, $staff, $startDate, $endDate);

        $this->command->info("合計 {$scheduleCount} 件の入浴スケジュールを生成しました。");
    }

    /**
     * 住民に応じた入浴タイトルを生成
     */
    private function getBathTitle(Resident $resident): string
    {
        $titles = [
            '一般浴槽',
            '特浴（リフト浴）',
            'シャワー浴',
        ];

        // 医療情報に基づいて適切な入浴方法を選択
        if (str_contains($resident->medical_info, '麻痺') || str_contains($resident->medical_info, '関節')) {
            return '特浴（リフト浴）';
        }

        if (str_contains($resident->medical_info, '自立度高い')) {
            return '一般浴槽';
        }

        return collect($titles)->random();
    }

    /**
     * 住民に応じた入浴説明を生成
     */
    private function getBathDescription(Resident $resident): string
    {
        $descriptions = [
            '通常の入浴介助を実施',
            '血圧測定後に入浴開始',
            '見守りレベルでの入浴支援',
            'リフト使用での安全入浴',
            '時間をかけてゆっくりと入浴',
        ];

        if (str_contains($resident->medical_info, '高血圧')) {
            return '血圧測定後に入浴開始。長湯に注意。';
        }

        if (str_contains($resident->medical_info, '麻痺')) {
            return 'リフト使用での安全入浴。転倒リスクに注意。';
        }

        if (str_contains($resident->medical_info, '認知症')) {
            return '見守りレベルでの入浴支援。声かけを多めに。';
        }

        return collect($descriptions)->random();
    }

    /**
     * その他のスケジュール生成
     */
    private function createOtherSchedules(
        $residents, 
        User $staff, 
        Carbon $startDate, 
        Carbon $endDate
    ): void {
        $rehaType = ScheduleType::where('name', 'リハビリ')->first();
        $recreationType = ScheduleType::where('name', 'レクリエーション')->first();

        if (!$rehaType || !$recreationType) {
            return;
        }

        // 週2回のリハビリスケジュール（火・木）
        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            if (in_array($date->dayOfWeek, [Carbon::TUESDAY, Carbon::THURSDAY])) {
                $selectedResidents = $residents->random(min(5, $residents->count()));
                
                foreach ($selectedResidents as $index => $resident) {
                    $startTime = Carbon::parse('10:00')->addMinutes($index * 20);
                    $endTime = $startTime->copy()->addMinutes(20);

                    Schedule::create([
                        'title' => 'リハビリテーション',
                        'description' => '理学療法・作業療法の実施',
                        'date' => $date->format('Y-m-d'),
                        'start_time' => $startTime->format('H:i'),
                        'end_time' => $endTime->format('H:i'),
                        'all_day' => false,
                        'schedule_type_id' => $rehaType->id,
                        'resident_id' => $resident->id,
                        'created_by' => $staff->id,
                    ]);
                }
            }
        }

        // 週1回のレクリエーション（日曜午後）
        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            if ($date->dayOfWeek === Carbon::SUNDAY) {
                Schedule::create([
                    'title' => '集団レクリエーション',
                    'description' => '歌唱・体操・ゲーム等の集団活動',
                    'date' => $date->format('Y-m-d'),
                    'start_time' => '14:00',
                    'end_time' => '15:30',
                    'all_day' => false,
                    'schedule_type_id' => $recreationType->id,
                    'resident_id' => null, // 全体対象のため住民IDはnull
                    'created_by' => $staff->id,
                ]);
            }
        }
    }
}
```

---

### 🛠️ 実装手順 3-3: DatabaseSeederの更新

```php
// database/seeders/DatabaseSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DepartmentSeeder::class,
            UserSeeder::class,
            ResidentSeeder::class,
            ScheduleTypeSeeder::class,
            ScheduleSeeder::class, // 追加
        ]);
    }
}
```

---

### 🛠️ 実装手順 3-4: 実行とテスト

```bash
# データベースリセットと再構築
./vendor/bin/sail artisan migrate:fresh --seed

# または個別にスケジュールシーダーのみ実行
./vendor/bin/sail artisan db:seed --class=ScheduleSeeder

# データ確認
./vendor/bin/sail artisan tinker
```

```php
// Tinkerでのデータ確認
>> Schedule::with(['scheduleType', 'resident', 'creator'])->count()
>> Schedule::with(['scheduleType', 'resident'])->where('date', today())->get()
>> Schedule::byType(1)->count() // 入浴スケジュールの数
>> $today = Schedule::byDate(today())->get()
>> $today->each(function($s) { echo $s->title . ' - ' . $s->resident->name . "\n"; })
```

---

### 🛠️ 動作確認用コマンド作成

カレンダーデータを簡単に確認できるコマンドを作成します。

```bash
./vendor/bin/sail artisan make:command ShowScheduleCommand
```

```php
// app/Console/Commands/ShowScheduleCommand.php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Schedule;
use Carbon\Carbon;

class ShowScheduleCommand extends Command
{
    protected $signature = 'schedule:show {date?}';
    protected $description = 'Show schedules for a specific date';

    public function handle()
    {
        $date = $this->argument('date') ?? today()->format('Y-m-d');
        
        try {
            $targetDate = Carbon::parse($date);
        } catch (\Exception $e) {
            $this->error('Invalid date format. Please use YYYY-MM-DD format.');
            return 1;
        }

        $schedules = Schedule::with(['scheduleType', 'resident', 'creator'])
            ->byDate($targetDate->format('Y-m-d'))
            ->orderBy('start_time')
            ->get();

        if ($schedules->isEmpty()) {
            $this->info("No schedules found for {$targetDate->format('Y-m-d')}");
            return 0;
        }

        $this->info("Schedules for {$targetDate->format('Y-m-d')} ({$targetDate->format('l')}):");
        $this->line('');

        $headers = ['Time', 'Title', 'Type', 'Resident', 'Created By'];
        $rows = [];

        foreach ($schedules as $schedule) {
            $rows[] = [
                $schedule->formatted_time,
                $schedule->title,
                $schedule->scheduleType->name,
                $schedule->resident ? $schedule->resident->name : '全体',
                $schedule->creator->name,
            ];
        }

        $this->table($headers, $rows);
        $this->info("Total: {$schedules->count()} schedules");

        return 0;
    }
}
```

### コマンド使用例

```bash
# 今日のスケジュールを表示
./vendor/bin/sail artisan schedule:show

# 特定の日付のスケジュールを表示
./vendor/bin/sail artisan schedule:show 2024-01-15

# 明日のスケジュールを表示
./vendor/bin/sail artisan schedule:show $(date -d tomorrow +%Y-%m-%d)
```

---

### Phase 3 完了チェックリスト

- [ ] ScheduleFactory が正常に作成された
- [ ] ResidentFactory が正常に作成された
- [ ] ScheduleSeeder で実用的なデータが生成される
- [ ] 入浴スケジュールが月・水・金に適切に配置される
- [ ] 住民の医療情報に応じた入浴方法が選択される
- [ ] その他のスケジュール（リハビリ・レクリエーション）も生成される
- [ ] schedule:show コマンドでデータ確認ができる

### 学習の振り返り

Phase 3では以下を学習しました：
- **Factory パターンの実践的活用**
- **ビジネスロジックを含むシーダー設計**
- **実際の運用を想定したテストデータ作成**
- **Artisan コマンドによる開発支援ツール作成**

---

## Phase 4: ダッシュボードUI実装（PR #4相当）

### この段階の目標
- **Reactを使ったダッシュボード画面の構築**
- **Inertia.jsでのデータ受け渡しを学ぶ**
- **Tailwind CSSによるレスポンシブデザイン実装**
- **コンポーネント設計の基礎を身につける**

### 実装する機能
1. 認証後のダッシュボード画面
2. 今日のスケジュール表示
3. 住民一覧カード表示
4. 基本的なナビゲーション

### 学習ポイント
- **React コンポーネントの設計パターン**
- **Inertia.js でのデータフェッチング**
- **Tailwind CSS Grid/Flexbox レイアウト**
- **条件分岐によるUIの出し分け**

---

### 🛠️ 実装手順 4-1: ダッシュボードコントローラー作成

```bash
./vendor/bin/sail artisan make:controller DashboardController
```

```php
// app/Http/Controllers/DashboardController.php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Schedule;
use App\Models\Resident;
use App\Models\User;
use Carbon\Carbon;

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

        // 統計データ
        $stats = [
            'total_residents' => $residents->count(),
            'today_schedules' => $todaySchedules->count(),
            'bath_schedules_today' => $todaySchedules->where('scheduleType.name', '入浴')->count(),
            'total_staff' => User::where('role', '!=', 'viewer')->count(),
        ];

        // 週間スケジュール概要（今日含む7日間）
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

---

### 🛠️ 実装手順 4-2: ルート設定

```php
// routes/web.php に追加
<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    // 他の認証必須ルート
});

require __DIR__.'/auth.php';
```

---

### 🛠️ 実装手順 4-3: ダッシュボードコンポーネント作成

```jsx
// resources/js/Pages/Dashboard.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import TodaySchedules from '@/Components/Dashboard/TodaySchedules';
import ResidentsList from '@/Components/Dashboard/ResidentsList';
import StatCards from '@/Components/Dashboard/StatCards';
import WeeklyOverview from '@/Components/Dashboard/WeeklyOverview';

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
        <AuthenticatedLayout
            user={user}
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            ダッシュボード
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {currentDateFormatted}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">
                            ログイン中: {user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {user.department?.department_name}
                        </p>
                    </div>
                </div>
            }
        >
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

---

### 🛠️ 実装手順 4-4: ダッシュボードコンポーネント作成

#### 1. 統計カードコンポーネント

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

#### 2. 今日のスケジュールコンポーネント

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

#### 3. 住民一覧コンポーネント

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

#### 4. 週間概要コンポーネント

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

---

### 🛠️ 実装手順 4-5: 動作確認

```bash
# 開発サーバー起動
./vendor/bin/sail up -d
npm run dev

# ブラウザで確認
# http://localhost/login でログイン
# http://localhost/dashboard でダッシュボード表示
```

### 確認項目
- [ ] ログイン後にダッシュボードが表示される
- [ ] 統計カードに正しい数値が表示される
- [ ] 今日のスケジュールが時系列で表示される
- [ ] 住民一覧がカード形式で表示される
- [ ] 週間概要で7日間のスケジュール件数が確認できる
- [ ] レスポンシブデザインが機能する

---

### Phase 4 完了チェックリスト

- [ ] DashboardController が正常に動作する
- [ ] Inertia.js でデータが正しく渡される
- [ ] React コンポーネントが適切に分割されている
- [ ] Tailwind CSS でレスポンシブレイアウトが実装されている
- [ ] 各コンポーネントが再利用可能な設計になっている

### 学習の振り返り

Phase 4では以下を学習しました：
- **Inertia.js を使ったデータ受け渡し**
- **React コンポーネントの分割と再利用設計**
- **Tailwind CSS による効率的なスタイリング**
- **条件分岐を使った動的UI表示**
- **Laravel Eloquent のリレーション活用**

Phase 5では、このダッシュボードを基にカレンダー機能の実装に進みます。

---

## Phase 5: カレンダーUI基盤実装（PR #5相当）

### この段階の目標
- **フルカレンダー表示機能を実装する**
- **スケジュールの月別・週別表示を学ぶ**
- **ドラッグ&ドロップによる操作基盤を構築する**
- **カレンダーライブラリの統合手法を身につける**

### 実装する機能
1. 月間カレンダー表示
2. 週間カレンダー表示
3. スケジュール表示とイベント管理
4. 基本的なスケジュール操作

### 学習ポイント
- **React Calendar ライブラリの活用**
- **日付操作とフォーマット処理**
- **イベントデータの効率的な管理**
- **レスポンシブカレンダーの実装**

---

### 🛠️ 実装手順 5-1: カレンダーライブラリのインストール

```bash
# React Calendar とユーティリティライブラリをインストール
npm install react-big-calendar moment react-dnd react-dnd-html5-backend
npm install date-fns  # 日付操作用
```

### ライブラリ選択の理由
- **react-big-calendar**: 高機能で拡張性の高いカレンダーライブラリ
- **moment**: 日付操作の標準ライブラリ
- **react-dnd**: ドラッグ&ドロップ機能の実装
- **date-fns**: 軽量な日付ユーティリティ

---

### 🛠️ 実装手順 5-2: カレンダーコントローラー作成

```bash
./vendor/bin/sail artisan make:controller CalendarController
```

```php
// app/Http/Controllers/CalendarController.php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Schedule;
use App\Models\Resident;
use App\Models\ScheduleType;
use Carbon\Carbon;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // クエリパラメータから年月を取得、デフォルトは今月
        $year = $request->get('year', Carbon::now()->year);
        $month = $request->get('month', Carbon::now()->month);
        
        // 月の開始日と終了日
        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        
        // カレンダー表示用に前後の日付も含める（週の始まりから終わりまで）
        $startOfCalendar = $startOfMonth->copy()->startOfWeek(Carbon::SUNDAY);
        $endOfCalendar = $endOfMonth->copy()->endOfWeek(Carbon::SATURDAY);

        // スケジュール取得
        $schedules = Schedule::with(['scheduleType', 'resident', 'creator'])
            ->byDateRange($startOfCalendar->format('Y-m-d'), $endOfCalendar->format('Y-m-d'))
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        // アクティブな住民取得
        $residents = Resident::with('department')
            ->active()
            ->orderByRoom()
            ->get();

        // スケジュール種別取得
        $scheduleTypes = ScheduleType::active()->get();

        // カレンダー用にスケジュールを整形
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
                // react-big-calendar用のスタイル設定
                'style' => [
                    'backgroundColor' => $schedule->scheduleType->color_code ?? '#3B82F6',
                    'borderColor' => $schedule->scheduleType->color_code ?? '#3B82F6',
                ],
            ];
        });

        // 月間統計
        $monthStats = [
            'total_schedules' => $schedules->count(),
            'bath_schedules' => $schedules->where('scheduleType.name', '入浴')->count(),
            'rehabilitation_schedules' => $schedules->where('scheduleType.name', 'リハビリ')->count(),
            'recreation_schedules' => $schedules->where('scheduleType.name', 'レクリエーション')->count(),
        ];

        return Inertia::render('Calendar/Index', [
            'user' => $user->load('department'),
            'events' => $events,
            'residents' => $residents,
            'scheduleTypes' => $scheduleTypes,
            'currentMonth' => [
                'year' => $year,
                'month' => $month,
                'formatted' => $startOfMonth->format('Y年n月'),
            ],
            'monthStats' => $monthStats,
            'dateRange' => [
                'start' => $startOfCalendar->format('Y-m-d'),
                'end' => $endOfCalendar->format('Y-m-d'),
            ],
        ]);
    }

    public function show(Request $request, $date)
    {
        $user = $request->user();
        $targetDate = Carbon::parse($date);

        // 指定日のスケジュール取得
        $schedules = Schedule::with(['scheduleType', 'resident', 'creator'])
            ->byDate($targetDate->format('Y-m-d'))
            ->orderBy('start_time')
            ->get();

        // アクティブな住民取得
        $residents = Resident::with('department')
            ->active()
            ->orderByRoom()
            ->get();

        // スケジュール種別取得
        $scheduleTypes = ScheduleType::active()->get();

        return Inertia::render('Calendar/DayView', [
            'user' => $user->load('department'),
            'schedules' => $schedules,
            'residents' => $residents,
            'scheduleTypes' => $scheduleTypes,
            'targetDate' => [
                'date' => $targetDate->format('Y-m-d'),
                'formatted' => $targetDate->format('Y年n月j日（D）'),
                'dayOfWeek' => $targetDate->format('D'),
            ],
        ]);
    }

    public function week(Request $request)
    {
        $user = $request->user();
        
        // クエリパラメータから日付を取得、デフォルトは今日
        $baseDate = $request->get('date', Carbon::now()->format('Y-m-d'));
        $targetDate = Carbon::parse($baseDate);
        
        // 週の開始日と終了日（日曜日始まり）
        $startOfWeek = $targetDate->copy()->startOfWeek(Carbon::SUNDAY);
        $endOfWeek = $targetDate->copy()->endOfWeek(Carbon::SATURDAY);

        // スケジュール取得
        $schedules = Schedule::with(['scheduleType', 'resident', 'creator'])
            ->byDateRange($startOfWeek->format('Y-m-d'), $endOfWeek->format('Y-m-d'))
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        // アクティブな住民取得
        $residents = Resident::with('department')
            ->active()
            ->orderByRoom()
            ->get();

        // スケジュール種別取得
        $scheduleTypes = ScheduleType::active()->get();

        // 週間スケジュールを日付別にグループ化
        $weekSchedules = $schedules->groupBy('date');

        return Inertia::render('Calendar/WeekView', [
            'user' => $user->load('department'),
            'weekSchedules' => $weekSchedules,
            'residents' => $residents,
            'scheduleTypes' => $scheduleTypes,
            'weekRange' => [
                'start' => $startOfWeek->format('Y-m-d'),
                'end' => $endOfWeek->format('Y-m-d'),
                'formatted' => $startOfWeek->format('Y年n月j日') . ' - ' . $endOfWeek->format('n月j日'),
            ],
            'targetDate' => $targetDate->format('Y-m-d'),
        ]);
    }
}
```

---

### 🛠️ 実装手順 5-3: ルート設定の追加

```php
// routes/web.php に追加

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // カレンダー関連ルート
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::get('/calendar/week', [CalendarController::class, 'week'])->name('calendar.week');
    Route::get('/calendar/{date}', [CalendarController::class, 'show'])->name('calendar.show');
});
```

---

### 🛠️ 実装手順 5-4: メインカレンダーコンポーネント作成

```jsx
// resources/js/Pages/Calendar/Index.jsx
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CalendarToolbar from '@/Components/Calendar/CalendarToolbar';
import EventComponent from '@/Components/Calendar/EventComponent';
import MonthStats from '@/Components/Calendar/MonthStats';

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
    monthStats,
    dateRange 
}) {
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    // イベントクリック時の処理
    const handleSelectEvent = (event) => {
        console.log('Selected event:', event);
        // 詳細表示やモーダルを開く処理
    };

    // 日付クリック時の処理
    const handleSelectSlot = (slotInfo) => {
        console.log('Selected slot:', slotInfo);
        const selectedDate = moment(slotInfo.start).format('YYYY-MM-DD');
        router.get(route('calendar.show', selectedDate));
    };

    // 月変更時の処理
    const handleNavigate = (newDate) => {
        setDate(newDate);
        const year = moment(newDate).year();
        const month = moment(newDate).month() + 1; // momentは0始まり
        
        router.get(route('calendar.index'), {
            year: year,
            month: month,
        });
    };

    // ビュー変更時の処理
    const handleViewChange = (newView) => {
        setView(newView);
        if (newView === 'week') {
            const dateStr = moment(date).format('YYYY-MM-DD');
            router.get(route('calendar.week'), { date: dateStr });
        }
    };

    // イベントスタイルのカスタマイズ
    const eventStyleGetter = (event, start, end, isSelected) => {
        const backgroundColor = event.resource?.type?.color_code || '#3B82F6';
        
        return {
            style: {
                backgroundColor: backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: '#fff',
                border: 'none',
                fontSize: '12px',
                padding: '2px 4px',
            }
        };
    };

    // 日付セルのスタイル
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
        <AuthenticatedLayout
            user={user}
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            スケジュールカレンダー
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {currentMonth.formatted}
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <Link
                            href={route('dashboard')}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            ダッシュボード
                        </Link>
                        <Link
                            href={route('calendar.week')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            週表示
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="カレンダー" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* 統計カード */}
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
                                onView={handleViewChange}
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
                                    dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
                                        localizer.format(start, 'M/D', culture) + ' - ' + 
                                        localizer.format(end, 'M/D', culture),
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

---

### 🛠️ 実装手順 5-5: カレンダー関連コンポーネント作成

#### 1. カスタムツールバー

```jsx
// resources/js/Components/Calendar/CalendarToolbar.jsx
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function CalendarToolbar({ label, onNavigate, onView, view }) {
    return (
        <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
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

            <h3 className="text-xl font-bold text-gray-900">
                {label}
            </h3>

            <div className="flex space-x-2">
                <button
                    onClick={() => onView('month')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                        view === 'month' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    月
                </button>
                <button
                    onClick={() => onView('week')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                        view === 'week' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    週
                </button>
                <button
                    onClick={() => onView('day')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                        view === 'day' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    日
                </button>
            </div>
        </div>
    );
}
```

#### 2. イベントコンポーネント

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

#### 3. 月間統計コンポーネント

```jsx
// resources/js/Components/Calendar/MonthStats.jsx
export default function MonthStats({ stats, currentMonth }) {
    const statCards = [
        {
            title: '総スケジュール数',
            value: stats.total_schedules,
            icon: '📅',
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700'
        },
        {
            title: '入浴予定',
            value: stats.bath_schedules,
            icon: '🛁',
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700'
        },
        {
            title: 'リハビリ',
            value: stats.rehabilitation_schedules,
            icon: '🏃‍♀️',
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700'
        },
        {
            title: 'レクリエーション',
            value: stats.recreation_schedules,
            icon: '🎯',
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-700'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, index) => (
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

---

### 🛠️ 実装手順 5-6: 週表示コンポーネント作成

```jsx
// resources/js/Pages/Calendar/WeekView.jsx
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import moment from 'moment';
import 'moment/locale/ja';

moment.locale('ja');

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

    // スケジュールの時間でソート
    const getSortedSchedules = (date) => {
        const daySchedules = weekSchedules[date] || [];
        return daySchedules.sort((a, b) => {
            return a.start_time.localeCompare(b.start_time);
        });
    };

    // スケジュール種別の色を取得
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
        <AuthenticatedLayout
            user={user}
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            週間スケジュール
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {weekRange.formatted}
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <Link
                            href={route('dashboard')}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            ダッシュボード
                        </Link>
                        <Link
                            href={route('calendar.index')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            月表示
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="週間カレンダー" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        
                        {/* ナビゲーション */}
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
                                    const daySchedules = getSortedSchedules(dayInfo.date);
                                    
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
                                                {dayInfo.isToday && (
                                                    <div className="mt-1">
                                                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                                    </div>
                                                )}
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
                                                            className={`p-2 rounded border text-xs cursor-pointer transition-colors hover:shadow-sm ${getTypeColor(schedule.schedule_type.name)}`}
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

---

### 🛠️ 実装手順 5-7: CSS カスタマイズ

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

.rbc-date-cell {
    padding: 8px 4px;
    text-align: right;
}

.rbc-date-cell.rbc-off-range-bg {
    background-color: #f8fafc;
    color: #a0aec0;
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

.rbc-show-more {
    background-color: transparent;
    color: #3182ce;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    padding: 2px 4px;
    border: none;
}

.rbc-show-more:hover {
    background-color: #ebf8ff;
    border-radius: 4px;
}

/* 月表示でのイベント間隔調整 */
.rbc-month-view .rbc-event {
    margin-bottom: 1px;
}

/* 週・日表示での時間軸調整 */
.rbc-time-slot {
    border-top: 1px solid #f1f5f9;
}

.rbc-timeslot-group {
    min-height: 60px;
}

/* カスタム色設定 */
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

```jsx
// resources/js/app.jsx に CSS インポートを追加
import '../css/app.css';
import '../css/calendar.css'; // 追加
```

---

### 🛠️ 実装手順 5-8: ナビゲーション更新

```jsx
// resources/js/Layouts/AuthenticatedLayout.jsx を更新
// ナビゲーションにカレンダーリンクを追加

<NavLink href={route('dashboard')} active={route().current('dashboard')}>
    ダッシュボード
</NavLink>
<NavLink href={route('calendar.index')} active={route().current('calendar.*')}>
    カレンダー
</NavLink>
```

---

### 🛠️ 実装手順 5-9: 動作確認

```bash
# パッケージ再インストール（必要に応じて）
npm install

# 開発サーバー起動
./vendor/bin/sail up -d
npm run dev

# ブラウザで確認
# http://localhost/calendar でカレンダー表示
# http://localhost/calendar/week で週表示
```

### 確認項目
- [ ] 月間カレンダーが正常に表示される
- [ ] スケジュールがカレンダー上に表示される
- [ ] 週表示への切り替えができる
- [ ] 前月・次月のナビゲーションが動作する
- [ ] 日付クリックで詳細表示に遷移する
- [ ] イベントの色分けが正しく表示される
- [ ] 日本語表示が正常に動作する

---

### Phase 5 完了チェックリスト

- [ ] react-big-calendar が正常に動作する
- [ ] カレンダーコントローラーでデータが正しく取得される
- [ ] 月間・週間表示が切り替えできる
- [ ] スケジュールが適切にカレンダー上に表示される
- [ ] 日本語ローカライゼーションが動作する
- [ ] レスポンシブデザインが機能する
- [ ] カスタムスタイルが適用される

### 学習の振り返り

Phase 5では以下を学習しました：
- **React Calendar ライブラリの統合と設定**
- **Moment.js による日付操作と日本語化**
- **カレンダーイベントの効率的な管理**
- **カスタムコンポーネントによるUI拡張**
- **CSS-in-JS とカスタムスタイリング**

Phase 6では、スケジュール作成・編集機能の実装に進みます。