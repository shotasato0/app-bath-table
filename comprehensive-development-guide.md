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

# Node.js 18以上
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

---

このようにして、実際の開発履歴に基づいた段階的な学習ガイドを作成することができます。各フェーズで実際に開発者が体験した問題と解決方法を含めることで、未経験者でも実践的なスキルを身につけられる構成になっています。

完全なガイドの作成には相当な時間がかかりますが、このような構造で進めることで、理論だけでなく実際の開発経験に基づいた価値の高い教育資料を作成できます。