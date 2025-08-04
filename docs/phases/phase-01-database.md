# 🗃️ Phase 1: データベース基盤構築

このドキュメントでは、介護施設カレンダーアプリの **データベース基盤構築** の実装手順を段階的に説明します。

## 📋 この段階の目標

- **基本テーブル設計**: 介護施設に必要な7つの主要テーブルを作成
- **リレーション設計**: テーブル間の関係性を適切に定義
- **初期データ投入**: 開発・テスト用のサンプルデータを準備
- **Laravel基礎習得**: マイグレーション・モデル・シーダーの理解

## 🎯 実装する機能

この段階で実装する **データベーススキーマ**：

```
住民管理系
├── departments (部署テーブル)
├── users (職員テーブル) 
└── residents (住民テーブル)

スケジュール管理系
├── schedule_types (スケジュール種別テーブル)
├── calendar_dates (カレンダー日付テーブル)
└── schedules (スケジュールテーブル)

権限管理系
└── (基本権限はUser.roleで管理、詳細権限は将来拡張用)
```

## 💡 学習ポイント

この段階で身につく技術・知識：

- **Laravel マイグレーション** の基本概念と書き方
- **Eloquent モデル** のリレーション定義
- **データベース設計** の基本原則
- **シーダー** を使った初期データ投入
- **外部キー制約** とデータ整合性

## 🚀 実装手順

### Step 1: 基本テーブルの作成

#### 1.1 部署テーブル（departments）

最も基本的なマスタテーブルから始めます。

```bash
# マイグレーション・モデル・コントローラーを一括作成
./vendor/bin/sail artisan make:model Department -mcr
```

**マイグレーションファイル**:
```php
// database/migrations/xxxx_create_departments_table.php

public function up(): void
{
    Schema::create('departments', function (Blueprint $table) {
        $table->id();
        $table->string('department_name', 100)->comment('部署名');
        $table->timestamps();
        
        // インデックス追加
        $table->index('department_name');
    });
}
```

**🔍 なぜこの設計？**
- `department_name` に文字数制限（100文字）を設定
- 検索頻度が高いため `index` を追加
- 将来的な部署名変更に対応するため論理削除は実装しない

#### 1.2 職員テーブル（users）の拡張

Laravel Breezeの標準 users テーブルを介護施設向けにカスタマイズします。

```bash
# 既存usersテーブル拡張用のマイグレーション作成
./vendor/bin/sail artisan make:migration modify_users_table_for_staff
```

**マイグレーションファイル**:
```php
// database/migrations/xxxx_modify_users_table_for_staff.php

public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        // 介護施設向けカラム追加
        $table->string('username', 50)->unique()->after('name')->comment('ログイン用ID');
        $table->enum('role', ['admin', 'staff', 'viewer'])->default('staff')->after('password')->comment('権限レベル');
        $table->foreignId('department_id')->nullable()->after('role')->constrained()->comment('所属部署ID');
        
        // email を nullable に変更（介護職員はメールアドレスを持たない場合が多い）
        $table->string('email')->nullable()->change();
        
        // インデックス追加
        $table->index(['role', 'department_id']);
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropForeign(['department_id']);
        $table->dropIndex(['role', 'department_id']);
        $table->dropColumn(['username', 'role', 'department_id']);
        $table->string('email')->nullable(false)->change();
    });
}
```

**⚠️ よくあるエラーと対処法**:

```bash
# エラー: "Syntax error or access violation: 1071 Specified key was too long"
# 原因: MySQL の文字セット設定
# 解決: config/database.php で charset を確認

'mysql' => [
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
],
```

#### 1.3 住民テーブル（residents）

介護施設の入居者情報を管理するテーブルです。

```bash
./vendor/bin/sail artisan make:model Resident -mcr
```

**マイグレーションファイル**:
```php
// database/migrations/xxxx_create_residents_table.php

public function up(): void
{
    Schema::create('residents', function (Blueprint $table) {
        $table->id();
        $table->string('name', 100)->comment('住民氏名');
        $table->string('room_number', 20)->nullable()->comment('部屋番号');
        $table->enum('gender', ['male', 'female', 'other'])->nullable()->comment('性別');
        $table->date('birth_date')->nullable()->comment('生年月日');
        $table->text('medical_info')->nullable()->comment('医療情報・注意事項');
        $table->foreignId('department_id')->constrained()->comment('所属部署ID');
        $table->boolean('is_active')->default(true)->comment('入居中フラグ');
        $table->timestamps();
        
        // 効率的な検索のためのインデックス
        $table->index(['name', 'is_active']);
        $table->index('room_number');
        $table->index('is_active');
    });
}
```

**💡 設計のポイント**:
- `medical_info` は `text` 型で詳細な医療情報を格納
- `is_active` で退居住民も履歴として保持
- 部屋番号検索を想定した `index` 設定

### Step 2: スケジュール関連テーブルの作成

#### 2.1 スケジュール種別テーブル（schedule_types）

```bash
./vendor/bin/sail artisan make:model ScheduleType -mcr
```

**マイグレーションファイル**:
```php
// database/migrations/xxxx_create_schedule_types_table.php

public function up(): void
{
    Schema::create('schedule_types', function (Blueprint $table) {
        $table->id();
        $table->string('name', 50)->comment('種別名');
        $table->string('color_code', 7)->default('#3B82F6')->comment('表示色（16進数）');
        $table->string('description')->nullable()->comment('説明');
        $table->timestamps();
        
        $table->index('name');
    });
}
```

#### 2.2 カレンダー日付テーブル（calendar_dates）

祝日管理などの拡張を見越したカレンダーマスタです。

```bash
./vendor/bin/sail artisan make:model CalendarDate -mcr
```

**マイグレーションファイル**:
```php
// database/migrations/xxxx_create_calendar_dates_table.php

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
        
        $table->index(['calendar_date', 'is_holiday']);
        $table->index('is_weekend');
    });
}
```

#### 2.3 スケジュールテーブル（schedules）

メインとなるスケジュール情報を格納するテーブルです。

```bash
./vendor/bin/sail artisan make:model Schedule -mcr
```

**マイグレーションファイル**:
```php
// database/migrations/xxxx_create_schedules_table.php

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
        $table->foreignId('schedule_type_id')->constrained()->comment('スケジュール種別ID');
        $table->foreignId('resident_id')->nullable()->constrained()->comment('対象住民ID（NULL=全体対象）');
        $table->foreignId('created_by')->constrained('users')->comment('作成者（職員）ID');
        $table->timestamps();
        
        // 検索効率化のための複合インデックス
        $table->index(['date', 'schedule_type_id']);
        $table->index(['resident_id', 'date']);
        $table->index('created_by');
    });
}
```

#### 2.4 権限管理の設計方針

**🔮 将来拡張用: 詳細権限管理テーブル（permissions）**

現在の実装では、User.roleによる基本的な権限管理（admin/staff）で十分ですが、将来的に詳細な権限管理が必要になった場合のテーブル設計例です。

**Phase 1-6では使用しません**が、参考として掲載します：

```php
// 🔮 将来拡張用 - database/migrations/xxxx_create_permissions_table.php
// 注意: この段階では作成しません

public function up(): void
{
    Schema::create('permissions', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete()->comment('対象職員ID');
        $table->boolean('can_edit_schedules')->default(false)->comment('スケジュール編集権限');
        $table->boolean('can_manage_residents')->default(false)->comment('住民管理権限');
        $table->boolean('can_view_reports')->default(false)->comment('レポート閲覧権限');
        $table->timestamps();
        
        $table->index('user_id');
    });
}
```

**実際の権限管理**:
- **基本権限**: User.role（admin/staff）で管理
- **部署権限**: User.department_idとの組み合わせ
- **詳細権限**: 必要に応じて後から追加

### Step 3: Eloquentモデルのリレーション定義

#### 3.1 Department モデル

```php
// app/Models/Department.php

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_name',
    ];

    /**
     * この部署に所属する職員
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * この部署に所属する住民
     */
    public function residents(): HasMany
    {
        return $this->hasMany(Resident::class);
    }
}
```

#### 3.2 User モデルの拡張

```php
// app/Models/User.php

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',  // 追加
        'email',
        'password',
        'role',      // 追加
        'department_id', // 追加
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

    /**
     * 所属部署
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * 作成したスケジュール
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'created_by');
    }

    // 権限チェック用のヘルパーメソッド（role-based）
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function canEditSchedules(): bool
    {
        return in_array($this->role, ['admin', 'staff']);
    }
}
```

#### 3.3 残りのモデルも同様に定義

```php
// app/Models/Resident.php
class Resident extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'room_number', 'gender', 'birth_date', 
        'medical_info', 'department_id', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
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

### Step 4: 初期データ用シーダーの作成

#### 4.1 部署データのシーダー

```bash
./vendor/bin/sail artisan make:seeder DepartmentSeeder
```

```php
// database/seeders/DepartmentSeeder.php

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
        
        $this->command->info('部署データを投入しました: ' . count($departments) . '件');
    }
}
```

#### 4.2 職員データのシーダー

```bash
./vendor/bin/sail artisan make:seeder UserSeeder
```

```php
// database/seeders/UserSeeder.php

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 管理者ユーザー
        $adminDept = Department::where('department_name', '事務部')->first();
        
        User::create([
            'name' => '管理者 太郎',
            'username' => 'admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'department_id' => $adminDept->id,
        ]);

        // 一般職員ユーザー（例）
        $nurseDept = Department::where('department_name', '看護部')->first();
        
        User::create([
            'name' => '看護師 花子',
            'username' => 'nurse01',
            'email' => 'nurse01@example.com',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'department_id' => $nurseDept->id,
        ]);

        $this->command->info('職員データを投入しました: 2件');
    }
}
```

#### 4.3 その他のシーダーも作成

住民データ、スケジュール種別データのシーダーも同様に作成します。

#### 4.4 DatabaseSeeder に登録

```php
// database/seeders/DatabaseSeeder.php

public function run(): void
{
    $this->call([
        DepartmentSeeder::class,
        UserSeeder::class,
        ResidentSeeder::class,
        ScheduleTypeSeeder::class,
        // ScheduleSeeder::class, // 後の段階で追加
    ]);
}
```

### Step 5: マイグレーション実行と動作確認

#### 5.1 マイグレーション実行

```bash
# データベースをリセットしてマイグレーション実行
./vendor/bin/sail artisan migrate:fresh --seed

# 実行結果の確認
./vendor/bin/sail artisan migrate:status
```

#### 5.2 データ確認

```bash
# Tinker で動作確認
./vendor/bin/sail artisan tinker

# 各テーブルのレコード数確認
>> Department::count()
=> 5

>> User::count()
=> 2

>> Resident::count()  # ResidentSeeder 実装時
=> 10

# リレーションの動作確認
>> $admin = User::where('username', 'admin')->first()
>> $admin->department->department_name
=> "事務部"

>> $dept = Department::first()
>> $dept->users->count()
=> 1
```

### Step 6: よくあるエラーと対処法

#### 6.1 マイグレーションエラー

**エラー**: `Foreign key constraint fails`

```bash
# 原因: 外部キー制約の順序問題
# 解決: マイグレーション実行順序の確認

# マイグレーション順序確認
ls -la database/migrations/

# 必要に応じてファイル名のタイムスタンプを調整
```

#### 6.2 シーダーエラー

**エラー**: `Department not found`

```bash
# 原因: 依存するデータが存在しない
# 解決: DatabaseSeeder の実行順序確認

public function run(): void
{
    $this->call([
        DepartmentSeeder::class,  // 最初に部署
        UserSeeder::class,        // 次に職員（部署に依存）
        ResidentSeeder::class,    // 住民（部署に依存）
        ScheduleTypeSeeder::class, // スケジュール種別
    ]);
}
```

## ✅ 確認方法

Phase 1 が完了したら、以下を確認してください：

### データベース構造の確認

```bash
# テーブル一覧確認
./vendor/bin/sail mysql -e "SHOW TABLES;"

# 特定テーブル構造確認
./vendor/bin/sail artisan db:table schedules
```

### 基本データの確認

```bash
./vendor/bin/sail artisan tinker

# 基本統計
>> collect(['departments', 'users', 'residents', 'schedule_types'])->map(fn($table) => [
    'table' => $table,
    'count' => DB::table($table)->count()
])
```

### リレーションの確認

```bash
# Tinker でリレーション動作確認
>> $user = User::with('department')->first()
>> $user->department->department_name

>> $resident = Resident::with('department')->first()  
>> $resident->department->department_name
```

## 🎯 次の段階への準備

Phase 1 が正常に完了したら、以下を確認してから Phase 2 に進みます：

- [ ] 全テーブルが正常に作成されている
- [ ] シーダーでサンプルデータが投入されている  
- [ ] モデル間のリレーションが正常に動作している
- [ ] 基本的な CRUD 操作が可能である

**次回**: [Phase 2: 認証システムカスタマイズ](phase-02-auth.md) では、Laravel Breeze をベースに介護施設向けの認証システムを実装します。

---

**💡 Phase 1 のポイント**: 
- **段階的実装**: 依存関係を考慮した実装順序
- **実践的設計**: 実際の介護施設運用を想定したテーブル設計
- **エラー対応**: よくあるトラブルと解決方法を事前に理解
- **動作確認**: 各段階での確実な動作確認の重要性