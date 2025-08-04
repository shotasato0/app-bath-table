# 🌱 シーダーとテストデータ

このドキュメントでは、介護施設カレンダーアプリのシーダー機能とテストデータ生成について説明します。

## 📋 シーダー概要

シーダーは、データベースに初期データやテストデータを効率的に投入するための機能です。開発・テスト・デモ環境で一貫したデータセットを提供します。

### 主な目的

- **初期データ投入**: 部署、スケジュール種別などのマスタデータ
- **テストデータ生成**: 開発・テスト用の大量サンプルデータ
- **デモ環境構築**: 実際の運用をシミュレートするリアルなデータ

## 🏗️ シーダー構成

### 実行順序

依存関係に基づいて以下の順序で実行されます：

```php
// database/seeders/DatabaseSeeder.php

public function run(): void
{
    $this->call([
        DepartmentSeeder::class,        // 1. 部署マスタ
        UserSeeder::class,              // 2. 職員データ
        ResidentSeeder::class,          // 3. 住民データ
        ScheduleTypeSeeder::class,      // 4. スケジュール種別
        ScheduleSeeder::class,          // 5. スケジュールデータ
    ]);
}
```

### ディレクトリ構成

```
database/
├── seeders/
│   ├── DatabaseSeeder.php          # メインシーダー
│   ├── DepartmentSeeder.php        # 部署データ
│   ├── UserSeeder.php              # 職員データ
│   ├── ResidentSeeder.php          # 住民データ
│   ├── ScheduleTypeSeeder.php      # スケジュール種別
│   └── ScheduleSeeder.php          # スケジュールデータ
└── factories/
    ├── UserFactory.php             # 職員ファクトリー
    ├── ResidentFactory.php         # 住民ファクトリー
    ├── ScheduleFactory.php         # スケジュールファクトリー
    └── ScheduleTypeFactory.php     # 種別ファクトリー
```

## 🏢 部署シーダー

### DepartmentSeeder

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

**実行結果**:
- 看護部
- 介護部
- リハビリテーション部
- 栄養管理部
- 事務部

## 👥 職員シーダー

### UserSeeder

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

        // 一般職員ユーザー
        $departments = Department::all();
        $staffMembers = [
            [
                'name' => '看護師 花子',
                'username' => 'nurse01',
                'department' => '看護部',
                'role' => 'staff'
            ],
            [
                'name' => '介護士 次郎',
                'username' => 'care01',
                'department' => '介護部',
                'role' => 'staff'
            ],
            [
                'name' => '理学療法士 三郎',
                'username' => 'pt01',
                'department' => 'リハビリテーション部',
                'role' => 'staff'
            ],
            [
                'name' => '栄養士 四郎',
                'username' => 'nutrition01',
                'department' => '栄養管理部',
                'role' => 'staff'
            ],
            [
                'name' => '閲覧者 五郎',
                'username' => 'viewer01',
                'department' => '事務部',
                'role' => 'viewer'
            ],
        ];

        foreach ($staffMembers as $staff) {
            $dept = Department::where('department_name', $staff['department'])->first();
            
            User::create([
                'name' => $staff['name'],
                'username' => $staff['username'],
                'email' => $staff['username'] . '@example.com',
                'password' => Hash::make('password'),
                'role' => $staff['role'],
                'department_id' => $dept->id,
            ]);
        }

        $this->command->info('職員データを投入しました: ' . (count($staffMembers) + 1) . '件');
    }
}
```

**デフォルトユーザー**:
| ユーザー名 | パスワード | 権限 | 部署 |
|-----------|----------|------|------|
| admin | password | 管理者 | 事務部 |
| nurse01 | password | 職員 | 看護部 |
| care01 | password | 職員 | 介護部 |
| pt01 | password | 職員 | リハビリテーション部 |
| nutrition01 | password | 職員 | 栄養管理部 |
| viewer01 | password | 閲覧者 | 事務部 |

## 🏠 住民シーダー

### ResidentSeeder（Factoryベース）

```php
// database/seeders/ResidentSeeder.php

class ResidentSeeder extends Seeder
{
    public function run(): void
    {
        $caregiverDept = Department::where('department_name', '介護部')->first();
        
        // 固定の住民データ（リアルなサンプル）
        $fixedResidents = [
            [
                'name' => '田中 太郎',
                'room_number' => '101',
                'gender' => 'male',
                'birth_date' => Carbon::parse('1935-03-15'),
                'medical_info' => '糖尿病、高血圧症の既往歴あり。血糖値管理が必要。',
            ],
            [
                'name' => '佐藤 花子',
                'room_number' => '102',
                'gender' => 'female',
                'birth_date' => Carbon::parse('1940-07-22'),
                'medical_info' => '認知症初期段階。見守りが必要。',
            ],
            [
                'name' => '山田 次郎',
                'room_number' => '103',
                'gender' => 'male',
                'birth_date' => Carbon::parse('1938-11-08'),
                'medical_info' => '脳梗塞の既往歴。右半身に軽度の麻痺あり。',
            ],
            [
                'name' => '鈴木 一郎',
                'room_number' => '104',
                'gender' => 'male',
                'birth_date' => Carbon::parse('1942-01-30'),
                'medical_info' => '特記事項なし。自立度高い。',
            ],
            [
                'name' => '高橋 美子',
                'room_number' => '105',
                'gender' => 'female',
                'birth_date' => Carbon::parse('1936-05-12'),
                'medical_info' => 'アルツハイマー型認知症。徘徊リスクあり。',
            ],
        ];

        // 固定データの投入
        foreach ($fixedResidents as $resident) {
            Resident::create(array_merge($resident, [
                'department_id' => $caregiverDept->id,
                'is_active' => true,
            ]));
        }

        // 追加のランダムデータ（Factory使用）
        Resident::factory()->count(15)->create([
            'department_id' => $caregiverDept->id,
        ]);

        $this->command->info('住民データを投入しました: ' . (count($fixedResidents) + 15) . '件');
    }
}
```

### ResidentFactory

```php
// database/factories/ResidentFactory.php

class ResidentFactory extends Factory
{
    public function definition(): array
    {
        $japaneseNames = [
            '田中 太郎', '佐藤 花子', '山田 次郎', '鈴木 一郎', '高橋 美子',
            '伊藤 三郎', '渡辺 久子', '中村 良子', '小林 正雄', '加藤 和子',
            '吉田 春雄', '山本 秋子', '佐々木 冬美', '松本 夏男', '井上 光子',
            '木村 健一', '林 静香', '清水 武', '山口 恵子', '森 義明',
        ];

        $medicalConditions = [
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
            'パーキンソン病。動作緩慢。',
            '高血圧、脂質異常症。食事療法中。',
        ];

        return [
            'name' => $this->faker->randomElement($japaneseNames),
            'room_number' => $this->faker->unique()->numberBetween(106, 300),
            'gender' => $this->faker->randomElement(['male', 'female']),
            'birth_date' => $this->faker->dateTimeBetween('-100 years', '-65 years'),
            'medical_info' => $this->faker->randomElement($medicalConditions),
            'department_id' => Department::factory(),
            'is_active' => $this->faker->boolean(95), // 95%がアクティブ
        ];
    }

    public function active(): static
    {
        return $this->state(['is_active' => true]);
    }

    public function male(): static
    {
        return $this->state(['gender' => 'male']);
    }

    public function female(): static
    {
        return $this->state(['gender' => 'female']);
    }
}
```

## 📅 スケジュール種別シーダー

### ScheduleTypeSeeder

```php
// database/seeders/ScheduleTypeSeeder.php

class ScheduleTypeSeeder extends Seeder
{
    public function run(): void
    {
        $scheduleTypes = [
            [
                'name' => '入浴',
                'color_code' => '#3B82F6', // 青
                'description' => '住民の入浴スケジュール',
                'is_active' => true,
            ],
            [
                'name' => '医療行為',
                'color_code' => '#EF4444', // 赤
                'description' => '医師による診察・治療',
                'is_active' => true,
            ],
            [
                'name' => 'リハビリ',
                'color_code' => '#10B981', // 緑
                'description' => '理学療法・作業療法',
                'is_active' => true,
            ],
            [
                'name' => 'レクリエーション',
                'color_code' => '#F59E0B', // 黄
                'description' => '集団活動・娯楽',
                'is_active' => true,
            ],
            [
                'name' => '面会',
                'color_code' => '#8B5CF6', // 紫
                'description' => '家族・友人との面会',
                'is_active' => true,
            ],
        ];

        foreach ($scheduleTypes as $type) {
            ScheduleType::create($type);
        }

        $this->command->info('スケジュール種別データを投入しました: ' . count($scheduleTypes) . '件');
    }
}
```

## 📋 スケジュールシーダー

### ScheduleSeeder（高度なビジネスロジック）

```php
// database/seeders/ScheduleSeeder.php

class ScheduleSeeder extends Seeder
{
    // スケジュールタイプ名の定数定義
    const SCHEDULE_TYPE_BATH = '入浴';
    const SCHEDULE_TYPE_REHAB = 'リハビリ';
    const SCHEDULE_TYPE_RECREATION = 'レクリエーション';
    const SCHEDULE_TYPE_MEDICAL = '医療行為';

    public function run(): void
    {
        // 必要なデータを取得
        $bathType = ScheduleType::where('name', self::SCHEDULE_TYPE_BATH)->first();
        $rehaType = ScheduleType::where('name', self::SCHEDULE_TYPE_REHAB)->first();
        $recreationType = ScheduleType::where('name', self::SCHEDULE_TYPE_RECREATION)->first();
        
        $residents = Resident::active()->get();
        $staff = User::where('role', 'staff')->first();

        if ($residents->isEmpty() || !$staff) {
            $this->command->warn('必要なデータが不足しています。');
            return;
        }

        $this->command->info('スケジュールサンプルデータを生成中...');

        // 今日から30日間のスケジュール生成
        $startDate = Carbon::today();
        $endDate = Carbon::today()->addDays(30);
        $scheduleCount = 0;

        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            // 月・水・金は入浴日
            if (in_array($date->dayOfWeek, [Carbon::MONDAY, Carbon::WEDNESDAY, Carbon::FRIDAY])) {
                $scheduleCount += $this->createBathSchedules($date, $bathType, $residents, $staff);
            }

            // 火・木はリハビリ日
            if (in_array($date->dayOfWeek, [Carbon::TUESDAY, Carbon::THURSDAY]) && $rehaType) {
                $scheduleCount += $this->createRehabSchedules($date, $rehaType, $residents, $staff);
            }

            // 日曜日はレクリエーション
            if ($date->dayOfWeek === Carbon::SUNDAY && $recreationType) {
                $scheduleCount += $this->createRecreationSchedules($date, $recreationType, $staff);
            }
        }

        $this->command->info("合計 {$scheduleCount} 件のスケジュールを生成しました。");
    }

    /**
     * 入浴スケジュール生成
     */
    private function createBathSchedules(Carbon $date, ScheduleType $bathType, $residents, User $staff): int
    {
        // ランダムに住民を選択（全員ではなく7-10名程度）
        $selectedResidents = $residents->random(min(rand(7, 10), $residents->count()));
        $count = 0;

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

            $count++;
        }

        return $count;
    }

    /**
     * リハビリスケジュール生成
     */
    private function createRehabSchedules(Carbon $date, ScheduleType $rehaType, $residents, User $staff): int
    {
        $selectedResidents = $residents->random(min(5, $residents->count()));
        $count = 0;

        foreach ($selectedResidents as $index => $resident) {
            $startTime = Carbon::parse('10:00')->addMinutes($index * 20);
            $endTime = $startTime->copy()->addMinutes(20);

            Schedule::create([
                'title' => 'リハビリテーション',
                'description' => $this->getRehabDescription($resident),
                'date' => $date->format('Y-m-d'),
                'start_time' => $startTime->format('H:i'),
                'end_time' => $endTime->format('H:i'),
                'all_day' => false,
                'schedule_type_id' => $rehaType->id,
                'resident_id' => $resident->id,
                'created_by' => $staff->id,
            ]);

            $count++;
        }

        return $count;
    }

    /**
     * レクリエーションスケジュール生成
     */
    private function createRecreationSchedules(Carbon $date, ScheduleType $recreationType, User $staff): int
    {
        $activities = [
            '集団レクリエーション',
            '歌唱会',
            '体操教室',
            '手工芸',
            'ゲーム大会',
        ];

        Schedule::create([
            'title' => collect($activities)->random(),
            'description' => '全住民対象の集団活動',
            'date' => $date->format('Y-m-d'),
            'start_time' => '14:00',
            'end_time' => '15:30',
            'all_day' => false,
            'schedule_type_id' => $recreationType->id,
            'resident_id' => null, // 全体対象
            'created_by' => $staff->id,
        ]);

        return 1;
    }

    /**
     * 住民に応じた入浴タイトル生成
     */
    private function getBathTitle(Resident $resident): string
    {
        // 医療情報に基づいて適切な入浴方法を選択
        if (str_contains($resident->medical_info, '麻痺') || str_contains($resident->medical_info, '関節')) {
            return '特浴（リフト浴）';
        }

        if (str_contains($resident->medical_info, '自立度高い')) {
            return '一般浴槽';
        }

        $titles = ['一般浴槽', '特浴（リフト浴）', 'シャワー浴'];
        return collect($titles)->random();
    }

    /**
     * 住民に応じた入浴説明生成
     */
    private function getBathDescription(Resident $resident): string
    {
        if (str_contains($resident->medical_info, '高血圧')) {
            return '血圧測定後に入浴開始。長湯に注意。';
        }

        if (str_contains($resident->medical_info, '麻痺')) {
            return 'リフト使用での安全入浴。転倒リスクに注意。';
        }

        if (str_contains($resident->medical_info, '認知症')) {
            return '見守りレベルでの入浴支援。声かけを多めに。';
        }

        $descriptions = [
            '通常の入浴介助を実施',
            '血圧測定後に入浴開始',
            '見守りレベルでの入浴支援',
            'リフト使用での安全入浴',
            '時間をかけてゆっくりと入浴',
        ];

        return collect($descriptions)->random();
    }

    /**
     * 住民に応じたリハビリ説明生成
     */
    private function getRehabDescription(Resident $resident): string
    {
        if (str_contains($resident->medical_info, '麻痺')) {
            return '機能訓練・歩行練習を中心とした理学療法';
        }

        if (str_contains($resident->medical_info, '関節')) {
            return '関節可動域訓練・筋力強化';
        }

        $descriptions = [
            '理学療法・作業療法の実施',
            '歩行訓練・バランス練習',
            '筋力強化・関節可動域訓練',
            '日常生活動作の練習',
        ];

        return collect($descriptions)->random();
    }
}
```

## 🔧 実行方法

### 全シーダー実行

```bash
# データベースリセット＋シーダー実行
./vendor/bin/sail artisan migrate:fresh --seed

# シーダーのみ実行
./vendor/bin/sail artisan db:seed
```

### 個別シーダー実行

```bash
# 特定のシーダーのみ実行
./vendor/bin/sail artisan db:seed --class=DepartmentSeeder
./vendor/bin/sail artisan db:seed --class=UserSeeder
./vendor/bin/sail artisan db:seed --class=ResidentSeeder
./vendor/bin/sail artisan db:seed --class=ScheduleTypeSeeder
./vendor/bin/sail artisan db:seed --class=ScheduleSeeder
```

### 開発用のデータリセット

```bash
# 開発中によく使うコマンド
./vendor/bin/sail artisan migrate:fresh --seed && npm run dev
```

## 📊 データ確認コマンド

### Artisanコマンドでの確認

```bash
# 今日のスケジュール確認
./vendor/bin/sail artisan schedule:show

# 特定日のスケジュール確認
./vendor/bin/sail artisan schedule:show 2024-01-15

# データ統計確認
./vendor/bin/sail artisan tinker
```

### Tinkerでの確認

```php
// 全体データ数確認
>> Department::count()
=> 5

>> User::count()
=> 6

>> Resident::count()
=> 20

>> Schedule::count()
=> 150

// 今日のスケジュール確認
>> Schedule::whereDate('date', today())->with(['resident', 'scheduleType'])->get()

// 入浴スケジュール数
>> Schedule::whereHas('scheduleType', fn($q) => $q->where('name', '入浴'))->count()

// 部署別住民数
>> Resident::join('departments', 'residents.department_id', '=', 'departments.id')
     ->selectRaw('departments.department_name, count(*) as count')
     ->groupBy('departments.department_name')
     ->get()
```

## 🧪 テスト用データセット

### 小規模テスト用

```bash
# テスト用の最小データセット
./vendor/bin/sail artisan migrate:fresh
./vendor/bin/sail artisan db:seed --class=DepartmentSeeder
./vendor/bin/sail artisan db:seed --class=UserSeeder

# Factoryで少量データ生成
./vendor/bin/sail artisan tinker
>> Resident::factory()->count(5)->create()
>> Schedule::factory()->count(10)->create()
```

### パフォーマンステスト用

```bash
# 大量データ生成（パフォーマンステスト用）
./vendor/bin/sail artisan tinker
>> Resident::factory()->count(100)->create()
>> Schedule::factory()->count(1000)->create()
```

## 🎯 カスタムシーダー作成

### 新しいシーダーの作成

```bash
# 新しいシーダー生成
./vendor/bin/sail artisan make:seeder CustomDataSeeder
```

### カスタムシーダーの例

```php
// database/seeders/CustomDataSeeder.php

class CustomDataSeeder extends Seeder
{
    public function run(): void
    {
        // 特定の期間のスケジュール生成
        $this->createSpecificPeriodSchedules();
        
        // 特殊ケースのテストデータ
        $this->createEdgeCaseData();
    }

    private function createSpecificPeriodSchedules(): void
    {
        // 来月1ヶ月分のスケジュール生成
        $startDate = Carbon::now()->addMonth()->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();
        
        // 実装...
    }

    private function createEdgeCaseData(): void
    {
        // 境界値テスト用のデータ
        // 例：終日スケジュール、重複スケジュール等
    }
}
```

## 📚 関連ドキュメント

- [データベース設計](database.md) - テーブル構造の詳細
- [テスト実行方法](testing.md) - シーダーを使ったテスト
- [環境構築](../setup/environment.md) - 初期セットアップ

---

**💡 設計のポイント**: 
- 実際の介護施設運用を想定したリアルなデータ設計
- 住民の医療情報に基づくスケジュール生成ロジック
- 開発・テスト・デモ環境それぞれに適したデータセット提供
- Factory パターンによる柔軟なテストデータ生成