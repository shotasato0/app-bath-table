# 🌱 Phase 3: サンプルデータ作成

このドキュメントでは、介護施設カレンダーアプリの **リアルなサンプルデータ生成** の実装手順を説明します。

## 📋 この段階の目標

- **リアルなテストデータ**: 実際の介護施設運用を想定したサンプルデータ作成
- **スケジュールデータ**: 入浴・リハビリ・レクリエーション等の多様なスケジュール
- **ビジネスロジック**: 介護施設特有の業務ルールを反映したデータ生成
- **開発効率化**: 開発・テスト・デモで一貫して使えるデータセット

## 🎯 実装する機能

この段階で実装する **データ生成システム**：

```
サンプルデータ
├── 住民データ: 20名の多様な住民情報
├── スケジュールデータ: 30日分の現実的なスケジュール
├── ビジネスルール: 入浴頻度・時間配分等の実運用ルール
└── 日本語データ: 氏名・医療情報等の日本語サンプル
```

## 💡 学習ポイント

この段階で身につく技術・知識：

- **Laravel Factory** の高度な活用方法
- **ビジネスロジック** をシーダーに組み込む手法
- **日本語データ** の効果的な生成方法
- **データ関連性** を保持したサンプル作成
- **現実的なテストケース** の設計思想

## 🚀 実装手順

### Step 1: 高度な住民データファクトリー

Phase 1で基本的なファクトリーは作成済みですが、より現実的なデータ生成に改良します。

```php
// database/factories/ResidentFactory.php

class ResidentFactory extends Factory
{
    public function definition(): array
    {
        // 実際の日本人名のサンプル
        $maleNames = [
            '田中 太郎', '佐藤 一郎', '山田 次郎', '鈴木 三郎', '高橋 四郎',
            '伊藤 正雄', '渡辺 健一', '中村 義明', '小林 春雄', '加藤 秋男',
        ];
        
        $femaleNames = [
            '田中 花子', '佐藤 和子', '山田 良子', '鈴木 久子', '高橋 美子',
            '伊藤 静香', '渡辺 恵子', '中村 光子', '小林 春美', '加藤 秋子',
        ];
        
        // 介護施設で実際にある医療情報
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

        $gender = $this->faker->randomElement(['male', 'female']);
        $names = $gender === 'male' ? $maleNames : $femaleNames;

        return [
            'name' => $this->faker->randomElement($names),
            'room_number' => $this->faker->unique()->numberBetween(101, 399),
            'gender' => $gender,
            'birth_date' => $this->faker->dateTimeBetween('-100 years', '-65 years'),
            'medical_info' => $this->faker->randomElement($medicalConditions),
            'department_id' => Department::factory(),
            'is_active' => $this->faker->boolean(95), // 95%がアクティブ
        ];
    }

    // 状態別ファクトリー
    public function active(): static
    {
        return $this->state(['is_active' => true]);
    }

    public function withSpecificCondition(string $condition): static
    {
        return $this->state(['medical_info' => $condition]);
    }

    public function elderly(): static
    {
        return $this->state([
            'birth_date' => $this->faker->dateTimeBetween('-95 years', '-75 years')
        ]);
    }
}
```

### Step 2: 現実的なスケジュールシーダー

介護施設の実際の運用パターンを反映したスケジュール生成ロジックを実装します。

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
        $medicalType = ScheduleType::where('name', self::SCHEDULE_TYPE_MEDICAL)->first();
        
        $residents = Resident::active()->get();
        $staff = User::where('role', 'staff')->first();

        if ($residents->isEmpty() || !$staff) {
            $this->command->warn('必要なデータが不足しています。住民データと職員データを先に投入してください。');
            return;
        }

        $this->command->info('スケジュールサンプルデータを生成中...');

        // 今日から30日間のスケジュール生成
        $startDate = Carbon::today();
        $endDate = Carbon::today()->addDays(30);
        $scheduleCount = 0;

        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            // 月・水・金は入浴日（実際の介護施設のパターン）
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

            // ランダムで医療行為を追加
            if ($this->faker->boolean(30) && $medicalType) { // 30%の確率
                $scheduleCount += $this->createMedicalSchedules($date, $medicalType, $residents, $staff);
            }
        }

        $this->command->info("合計 {$scheduleCount} 件のスケジュールを生成しました。");
    }

    /**
     * 入浴スケジュール生成（ビジネスロジック重視）
     */
    private function createBathSchedules(Carbon $date, ScheduleType $bathType, $residents, User $staff): int
    {
        // ランダムに住民を選択（全員ではなく7-10名程度）
        $selectedResidents = $residents->random(min(rand(7, 10), $residents->count()));
        $count = 0;

        foreach ($selectedResidents as $index => $resident) {
            // 入浴時間を住民の状態に応じて調整
            $startTime = Carbon::parse('09:00')->addMinutes($index * 30);
            $duration = $this->getBathDuration($resident);
            $endTime = $startTime->copy()->addMinutes($duration);

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
        // リハビリが必要な住民を優先的に選択
        $needsRehab = $residents->filter(function ($resident) {
            return str_contains($resident->medical_info, '麻痺') || 
                   str_contains($resident->medical_info, '関節') ||
                   str_contains($resident->medical_info, 'パーキンソン');
        });

        $selectedResidents = $needsRehab->isEmpty() 
            ? $residents->random(min(5, $residents->count()))
            : $needsRehab->take(5);

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
            '手工芸教室',
            'ゲーム大会',
            '映画鑑賞会',
            '読書会',
            '園芸活動',
        ];

        Schedule::create([
            'title' => collect($activities)->random(),
            'description' => '全住民対象の集団活動。参加は任意です。',
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
     * 医療行為スケジュール生成
     */
    private function createMedicalSchedules(Carbon $date, ScheduleType $medicalType, $residents, User $staff): int
    {
        // 医療ケアが必要な住民を選択
        $needsMedical = $residents->filter(function ($resident) {
            return str_contains($resident->medical_info, '糖尿病') || 
                   str_contains($resident->medical_info, '血圧') ||
                   str_contains($resident->medical_info, '薬');
        });

        if ($needsMedical->isEmpty()) {
            return 0;
        }

        $selectedResident = $needsMedical->random();
        
        Schedule::create([
            'title' => $this->getMedicalTitle($selectedResident),
            'description' => $this->getMedicalDescription($selectedResident),
            'date' => $date->format('Y-m-d'),
            'start_time' => '08:30',
            'end_time' => '09:00',
            'all_day' => false,
            'schedule_type_id' => $medicalType->id,
            'resident_id' => $selectedResident->id,
            'created_by' => $staff->id,
        ]);

        return 1;
    }

    /**
     * 住民の状態に応じた入浴タイトル生成
     */
    private function getBathTitle(Resident $resident): string
    {
        if (str_contains($resident->medical_info, '麻痺') || str_contains($resident->medical_info, '関節')) {
            return '特浴（リフト浴）';
        }

        if (str_contains($resident->medical_info, '自立度高い')) {
            return '一般浴槽';
        }

        return collect(['一般浴槽', '特浴（リフト浴）', 'シャワー浴'])->random();
    }

    /**
     * 住民の状態に応じた入浴時間算出
     */
    private function getBathDuration(Resident $resident): int
    {
        // 基本30分、状態に応じて調整
        $baseDuration = 30;

        if (str_contains($resident->medical_info, '麻痺') || str_contains($resident->medical_info, '介助')) {
            return $baseDuration + 15; // 45分
        }

        if (str_contains($resident->medical_info, '自立度高い')) {
            return $baseDuration - 10; // 20分
        }

        return $baseDuration;
    }

    /**
     * 住民の状態に応じた入浴説明生成
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
     * 住民の状態に応じたリハビリ説明生成
     */
    private function getRehabDescription(Resident $resident): string
    {
        if (str_contains($resident->medical_info, '麻痺')) {
            return '機能訓練・歩行練習を中心とした理学療法';
        }

        if (str_contains($resident->medical_info, '関節')) {
            return '関節可動域訓練・筋力強化';
        }

        if (str_contains($resident->medical_info, 'パーキンソン')) {
            return 'パーキンソン病に対応した作業療法・歩行訓練';
        }

        $descriptions = [
            '理学療法・作業療法の実施',
            '歩行訓練・バランス練習',
            '筋力強化・関節可動域訓練',
            '日常生活動作の練習',
        ];

        return collect($descriptions)->random();
    }

    /**
     * 医療行為のタイトル生成
     */
    private function getMedicalTitle(Resident $resident): string
    {
        if (str_contains($resident->medical_info, '糖尿病')) {
            return '血糖値測定・インスリン注射';
        }

        if (str_contains($resident->medical_info, '血圧')) {
            return '血圧測定・投薬管理';
        }

        return '健康チェック・投薬管理';
    }

    /**
     * 医療行為の説明生成
     */
    private function getMedicalDescription(Resident $resident): string
    {
        if (str_contains($resident->medical_info, '糖尿病')) {
            return '朝食前の血糖値測定。必要に応じてインスリン注射を実施。';
        }

        if (str_contains($resident->medical_info, '血圧')) {
            return '血圧測定後、処方薬の服薬確認・介助。';
        }

        return 'バイタルチェックと処方薬の服薬管理。';
    }
}
```

### Step 3: 住民データの拡充

```php
// database/seeders/ResidentSeeder.php

class ResidentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = Department::all();
        $caregiverDept = $departments->where('department_name', '介護部')->first();
        
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
        foreach ($fixedResidents as $residentData) {
            Resident::create(array_merge($residentData, [
                'department_id' => $caregiverDept->id,
                'is_active' => true,
            ]));
        }

        // 追加のランダムデータ（Factory使用）
        Resident::factory()
            ->count(15)
            ->create([
                'department_id' => $caregiverDept->id,
            ]);

        $this->command->info('住民データを投入しました: ' . (count($fixedResidents) + 15) . '件');
    }
}
```

### Step 4: データ確認用のコマンド作成

開発効率を向上させるため、データ確認用のArtisanコマンドを作成します。

```bash
./vendor/bin/sail artisan make:command ShowSchedules
```

```php
// app/Console/Commands/ShowSchedules.php

class ShowSchedules extends Command
{
    protected $signature = 'schedule:show {date?}';
    protected $description = '指定日のスケジュールを表示します';

    public function handle()
    {
        $date = $this->argument('date') ?? Carbon::today()->format('Y-m-d');
        
        try {
            $targetDate = Carbon::parse($date);
        } catch (Exception $e) {
            $this->error('無効な日付形式です。YYYY-MM-DD形式で入力してください。');
            return 1;
        }

        $schedules = Schedule::with(['scheduleType', 'resident', 'creator'])
            ->whereDate('date', $targetDate)
            ->orderBy('start_time')
            ->get();

        if ($schedules->isEmpty()) {
            $this->info("{$targetDate->format('Y年n月j日')} のスケジュールはありません。");
            return 0;
        }

        $this->info("{$targetDate->format('Y年n月j日（D）')} のスケジュール: {$schedules->count()}件");
        $this->line('');

        $headers = ['時間', '種別', 'タイトル', '対象者', '作成者'];
        $rows = [];

        foreach ($schedules as $schedule) {
            $time = $schedule->all_day 
                ? '終日' 
                : $schedule->start_time . '-' . $schedule->end_time;
                
            $rows[] = [
                $time,
                $schedule->scheduleType->name,
                $schedule->title,
                $schedule->resident ? $schedule->resident->name : '全体',
                $schedule->creator->name,
            ];
        }

        $this->table($headers, $rows);
        
        return 0;
    }
}
```

### Step 5: データベース更新と確認

#### 5.1 シーダー実行

```bash
# データベースを完全リセットして新しいサンプルデータを投入
./vendor/bin/sail artisan migrate:fresh --seed

# または、スケジュールデータのみ再生成
./vendor/bin/sail artisan db:seed --class=ScheduleSeeder
```

#### 5.2 生成されたデータの確認

```bash
# 今日のスケジュール確認
./vendor/bin/sail artisan schedule:show

# 特定日のスケジュール確認
./vendor/bin/sail artisan schedule:show 2024-01-15

# データ統計確認
./vendor/bin/sail artisan tinker
```

```php
// Tinker でのデータ確認
>> Schedule::count()
=> 150

>> Schedule::whereHas('scheduleType', fn($q) => $q->where('name', '入浴'))->count()
=> 60

>> Resident::count()
=> 20

// 今日のスケジュール種別別集計
>> Schedule::whereDate('date', today())
     ->join('schedule_types', 'schedules.schedule_type_id', '=', 'schedule_types.id')
     ->selectRaw('schedule_types.name, count(*) as count')
     ->groupBy('schedule_types.name')
     ->get()
```

### Step 6: よくあるエラーと対処法

#### 6.1 シーダー実行エラー

**エラー**: `Class "Carbon\Carbon" not found`

```php
// 解決: ファイル冒頭にuse文追加
use Carbon\Carbon;
```

#### 6.2 データ関連性エラー

**エラー**: 住民が存在しない場合のスケジュール生成エラー

```php
// 解決: データ存在チェックの強化
if ($residents->isEmpty()) {
    $this->command->warn('住民データが存在しません。ResidentSeederを先に実行してください。');
    return;
}
```

#### 6.3 重複データエラー

**エラー**: 部屋番号の重複

```php
// 解決: シーダー実行前のデータクリア
public function run(): void
{
    // 既存データをクリア（開発環境のみ）
    if (app()->environment('local')) {
        Resident::truncate();
    }
    
    // データ生成処理...
}
```

## ✅ 確認方法

Phase 3 が完了したら、以下を確認してください：

### サンプルデータの確認

```bash
# データ数の確認
./vendor/bin/sail artisan tinker
>> collect(['departments', 'users', 'residents', 'schedule_types', 'schedules'])->map(fn($table) => [
    'table' => $table,
    'count' => DB::table($table)->count()
])
```

### スケジュールの現実性確認

- 入浴スケジュールが月・水・金に集中している
- リハビリスケジュールが火・木に配置されている
- レクリエーションが日曜日に設定されている
- 医療情報に応じた適切なスケジュール内容

### ビジネスロジックの動作確認

```bash
# 麻痺のある住民の入浴スケジュール確認
./vendor/bin/sail artisan tinker
>> $resident = Resident::where('medical_info', 'like', '%麻痺%')->first();
>> $schedules = Schedule::where('resident_id', $resident->id)->with('scheduleType')->get();
>> $schedules->where('scheduleType.name', '入浴')->first()->title
=> "特浴（リフト浴）"
```

## 🎯 次の段階への準備

Phase 3 が正常に完了したら、以下を確認してから Phase 4 に進みます：

- [ ] 20名以上の住民データが生成されている
- [ ] 30日分のスケジュールが生成されている
- [ ] ビジネスロジックが適切に動作している
- [ ] 日本語のサンプルデータが自然である
- [ ] データ確認コマンドが正常に動作している

**次回**: [Phase 4: カレンダーUI実装](phase-04-calendar-ui.md) では、React + Inertia.js を使ったモダンなカレンダーUIを実装します。

---

**💡 Phase 3 のポイント**: 
- **現実性重視**: 実際の介護施設運用パターンを反映
- **ビジネスロジック**: 住民の状態に応じた適切なスケジュール生成
- **開発効率化**: 確認コマンドによる迅速なデータ検証
- **日本語データ**: 自然な日本語サンプルデータの重要性