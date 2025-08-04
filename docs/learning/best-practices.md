# 🌟 ベストプラクティス

このドキュメントでは、介護施設カレンダーアプリの開発経験から得られた **実践的なベストプラクティス** を紹介します。

## 📋 ベストプラクティス体系

実際の開発で重要となる実践的な指針を分野別に整理しています：

```
ベストプラクティス
├── コード品質: 読みやすく保守しやすいコード
├── セキュリティ: 安全なアプリケーション設計
├── パフォーマンス: 効率的な処理とUX
└── チーム開発: 協力しやすい開発環境
```

## 💻 コード品質のベストプラクティス

### 命名規則の統一

**原則**: コードは書く時間よりも読む時間の方が長い

```php
// ❌ 曖昧な命名
class SC  // Schedule Controller?
{
    public function get($id) // 何を取得？
    {
        $d = Carbon::now(); // 何の日付？
        $s = Schedule::find($id); // scheduleの略？
        return $s;
    }
}

// ✅ 明確で意図が伝わる命名
class ScheduleController
{
    public function show(int $scheduleId): Schedule
    {
        $currentDate = Carbon::now();
        $schedule = Schedule::findOrFail($scheduleId);
        
        // ログイン中のユーザーが閲覧権限を持つかチェック
        $this->authorize('view', $schedule);
        
        return $schedule;
    }
}
```

```jsx
// ❌ 曖昧な React コンポーネント
function Comp({ data, fn }) {
    const [s, setS] = useState(false);
    
    return (
        <div onClick={() => fn(data)}>
            {s ? 'ON' : 'OFF'}
        </div>
    );
}

// ✅ 意図が明確なコンポーネント
function ScheduleToggleButton({ schedule, onScheduleToggle }) {
    const [isActive, setIsActive] = useState(schedule.is_active);
    
    const handleToggle = () => {
        setIsActive(!isActive);
        onScheduleToggle(schedule, !isActive);
    };
    
    return (
        <button 
            onClick={handleToggle}
            className={`px-4 py-2 rounded ${
                isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
        >
            {isActive ? 'アクティブ' : '非アクティブ'}
        </button>
    );
}
```

### コメントと文書化

**原則**: なぜそのコードを書いたかを説明する

```php
// ❌ 何をしているかを説明するコメント
// IDで住民を検索する
$resident = Resident::find($id);

// ✅ なぜその実装なのかを説明するコメント
// 入浴スケジュールは月・水・金のみ作成可能（施設の運用ルール）
if (!in_array($date->dayOfWeek, [Carbon::MONDAY, Carbon::WEDNESDAY, Carbon::FRIDAY])) {
    throw new InvalidArgumentException('入浴スケジュールは月・水・金のみ作成できます');
}

/**
 * 住民の医療情報に基づいて適切な入浴方法を決定
 * 
 * 麻痺や関節の問題がある住民は安全のためリフト浴を使用
 * 自立度の高い住民は一般浴槽で時間短縮を図る
 */
private function determineBathType(Resident $resident): string
{
    if (str_contains($resident->medical_info, '麻痺') || 
        str_contains($resident->medical_info, '関節')) {
        return '特浴（リフト浴）';
    }
    
    if (str_contains($resident->medical_info, '自立度高い')) {
        return '一般浴槽';
    }
    
    return '一般浴槽'; // デフォルト
}
```

### エラーハンドリング

**原則**: 予期できるエラーには適切な対処を、予期できないエラーには分かりやすいメッセージを

```php
// ✅ 段階的なエラーハンドリング
class ScheduleService
{
    public function createSchedule(array $data): Schedule
    {
        try {
            // バリデーション（予期できるエラー）
            $validatedData = $this->validateScheduleData($data);
            
            // ビジネスルールチェック（予期できるエラー）
            $this->validateBusinessRules($validatedData);
            
            // データベース操作（予期できないエラー）
            DB::beginTransaction();
            
            $schedule = Schedule::create($validatedData);
            
            // 関連処理
            $this->sendNotificationIfNeeded($schedule);
            
            DB::commit();
            
            return $schedule;
            
        } catch (ValidationException $e) {
            // バリデーションエラー: ユーザーに修正を促す
            throw $e;
            
        } catch (BusinessRuleException $e) {
            // ビジネスルールエラー: 分かりやすいメッセージ
            throw new Exception("スケジュール作成できません: {$e->getMessage()}");
            
        } catch (Exception $e) {
            // 予期しないエラー: ログに記録してユーザーには汎用メッセージ
            DB::rollback();
            Log::error('Schedule creation failed', [
                'data' => $data,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new Exception('システムエラーが発生しました。管理者にお問い合わせください。');
        }
    }
    
    private function validateBusinessRules(array $data): void
    {
        // 入浴スケジュールの曜日チェック
        if ($data['schedule_type'] === '入浴') {
            $date = Carbon::parse($data['date']);
            if (!in_array($date->dayOfWeek, [1, 3, 5])) { // 月・水・金
                throw new BusinessRuleException(
                    '入浴スケジュールは月曜・水曜・金曜のみ作成できます'
                );
            }
        }
        
        // 重複スケジュールのチェック
        $existingSchedule = Schedule::where('resident_id', $data['resident_id'])
            ->where('date', $data['date'])
            ->where('start_time', $data['start_time'])
            ->exists();
            
        if ($existingSchedule) {
            throw new BusinessRuleException(
                '同じ時間に既にスケジュールが登録されています'
            );
        }
    }
}
```

## 🔒 セキュリティのベストプラクティス

### 認証・認可の実装

**原則**: 信頼できるのは自分のサーバーサイドの処理のみ

```php
// ✅ サーバーサイドでの認証・認可チェック
class ScheduleController extends Controller
{
    public function update(Request $request, Schedule $schedule)
    {
        // 1. 認証チェック（ミドルウェアで実行済み）
        // 2. 認可チェック（明示的に実行）
        $this->authorize('update', $schedule);
        
        // 3. バリデーション（信頼できないデータの検証）
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'date' => 'required|date|after_or_equal:today',
            'resident_id' => [
                'nullable',
                'exists:residents,id',
                // 現在のユーザーがアクセスできる住民のみ
                Rule::exists('residents', 'id')->where(function ($query) {
                    $query->where('department_id', auth()->user()->department_id);
                }),
            ],
        ]);
        
        // 4. ビジネスロジック実行
        $schedule->update($validated);
        
        return response()->json([
            'message' => 'スケジュールを更新しました',
            'schedule' => $schedule->fresh()
        ]);
    }
}

// 認可ポリシーの定義
class SchedulePolicy
{
    public function update(User $user, Schedule $schedule): bool
    {
        // 管理者は全てのスケジュールを編集可能
        if ($user->role === 'admin') {
            return true;
        }
        
        // 作成者は自分のスケジュールを編集可能
        if ($user->id === $schedule->created_by) {
            return true;
        }
        
        // 同じ部署のスタッフは編集可能
        if ($user->role === 'staff' && 
            $user->department_id === $schedule->resident->department_id) {
            return true;
        }
        
        return false;
    }
}
```

### XSS・SQLインジェクション対策

```php
// ✅ Laravel の機能を活用した安全な実装

// SQLインジェクション対策: Eloquent ORM を使用
// ❌ 生のSQL（危険）
$schedules = DB::select("SELECT * FROM schedules WHERE resident_id = {$request->resident_id}");

// ✅ Eloquent（安全）
$schedules = Schedule::where('resident_id', $request->resident_id)->get();

// XSS対策: Blade テンプレートの自動エスケープ
// ✅ 自動的にHTMLエスケープされる
{{ $resident->name }}

// ✅ HTMLを表示したい場合は明示的に許可
{!! $trustedHtmlContent !!}
```

```jsx
// React でのXSS対策
function ResidentProfile({ resident }) {
    // ✅ React は自動的にXSSを防ぐ
    return (
        <div>
            <h2>{resident.name}</h2> {/* 自動エスケープ */}
            <p>{resident.medical_info}</p>
        </div>
    );
}

// ❌ dangerouslySetInnerHTML は慎重に使用
function UnsafeComponent({ htmlContent }) {
    return (
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    );
}

// ✅ 信頼できるコンテンツのみに使用
function SafeRichTextDisplay({ trustedHtmlContent }) {
    // サーバーサイドでサニタイズ済みのコンテンツのみ
    return (
        <div dangerouslySetInnerHTML={{ __html: trustedHtmlContent }} />
    );
}
```

## ⚡ パフォーマンスのベストプラクティス

### データベースの最適化

```php
// ✅ N+1問題の解決
class CalendarController extends Controller
{
    public function index()
    {
        // ❌ N+1問題が発生
        $schedules = Schedule::all();
        foreach ($schedules as $schedule) {
            echo $schedule->resident->name; // 各scheduleに対してクエリが実行される
        }
        
        // ✅ Eager Loading で解決
        $schedules = Schedule::with(['resident', 'scheduleType', 'creator'])
            ->whereBetween('date', [$startDate, $endDate])
            ->get();
        
        return Inertia::render('Calendar/Index', [
            'schedules' => $schedules
        ]);
    }
}

// ✅ インデックスの効果的な使用
Schema::create('schedules', function (Blueprint $table) {
    $table->id();
    $table->date('date');
    $table->time('start_time');
    $table->foreignId('resident_id');
    $table->foreignId('schedule_type_id');
    
    // よく使われる検索パターンに合わせてインデックスを設定
    $table->index('date'); // 日付での検索
    $table->index(['resident_id', 'date']); // 住民の日付別スケジュール
    $table->index(['date', 'schedule_type_id']); // 日付・種別での検索
});
```

### フロントエンドの最適化

```jsx
// ✅ React のパフォーマンス最適化

// 1. memo でコンポーネントのレンダリングを最適化
const ScheduleItem = memo(function ScheduleItem({ schedule, onClick }) {
    return (
        <div onClick={() => onClick(schedule)}>
            <h3>{schedule.title}</h3>
            <p>{schedule.resident?.name}</p>
        </div>
    );
});

// 2. useMemo で重い計算をキャッシュ
function CalendarView({ schedules }) {
    const processedSchedules = useMemo(() => {
        return schedules.map(schedule => ({
            ...schedule,
            formattedDate: moment(schedule.date).format('YYYY年MM月DD日'),
            duration: moment(schedule.end_time, 'HH:mm')
                .diff(moment(schedule.start_time, 'HH:mm'), 'minutes')
        }));
    }, [schedules]);
    
    return (
        <div>
            {processedSchedules.map(schedule => (
                <ScheduleItem key={schedule.id} schedule={schedule} />
            ))}
        </div>
    );
}

// 3. useCallback でイベントハンドラーを最適化
function ScheduleList({ schedules, onScheduleUpdate }) {
    const handleScheduleClick = useCallback((schedule) => {
        // 重い処理...
        onScheduleUpdate(schedule);
    }, [onScheduleUpdate]);
    
    return (
        <div>
            {schedules.map(schedule => (
                <ScheduleItem 
                    key={schedule.id} 
                    schedule={schedule}
                    onClick={handleScheduleClick} // 毎回新しい関数を作らない
                />
            ))}
        </div>
    );
}
```

### 画像・アセットの最適化

```bash
# ✅ ビルド最適化
# package.json
{
  "scripts": {
    "build": "vite build --minify",
    "analyze": "vite-bundle-analyzer"
  }
}

# ✅ 画像の最適化
# 適切なフォーマット・サイズの画像を使用
# WebP形式の使用検討
# 遅延読み込み（lazy loading）の実装
```

## 👥 チーム開発のベストプラクティス

### Git の効果的な使用

```bash
# ✅ 意味のあるコミットメッセージ
git commit -m "feat: 入浴スケジュールの自動生成機能を追加

- 住民の医療情報に基づく入浴方法の自動判定
- 月・水・金の自動スケジュール生成
- 重複チェック機能を追加

Closes #123"

# ✅ 機能別ブランチ戦略
git checkout -b feature/schedule-auto-generation
# 開発・テスト
git checkout main
git merge --no-ff feature/schedule-auto-generation

# ✅ プルリクエストでのコードレビュー
# - 機能説明
# - テスト方法
# - 注意点・破壊的変更
```

### コードレビューの観点

```markdown
## プルリクエストレビューチェックリスト

### 機能面
- [ ] 要件を満たしているか
- [ ] エッジケースが考慮されているか
- [ ] エラーハンドリングが適切か

### セキュリティ
- [ ] 認証・認可が適切に実装されているか
- [ ] バリデーションが十分か
- [ ] 機密情報の漏洩がないか

### パフォーマンス
- [ ] N+1問題が発生していないか
- [ ] 不要な再レンダリングがないか
- [ ] データベースクエリが最適化されているか

### 保守性
- [ ] コードが読みやすいか
- [ ] 命名が適切か
- [ ] 適切にコメントされているか
- [ ] テストが書かれているか
```

### 環境の統一

```bash
# ✅ Docker での環境統一
# docker-compose.yml で開発環境を標準化
./vendor/bin/sail up -d

# ✅ 依存関係の管理
# composer.lock, package-lock.json をコミット
git add composer.lock package-lock.json

# ✅ 設定ファイルの管理
# .env.example で必要な環境変数を明示
cp .env.example .env
```

## 🧪 テストのベストプラクティス

### テスト戦略

```php
// ✅ 単体テスト（Unit Test）
class ScheduleServiceTest extends TestCase
{
    public function test_can_create_bath_schedule_on_allowed_days()
    {
        $service = new ScheduleService();
        $data = [
            'title' => '入浴',
            'date' => '2024-01-15', // 月曜日
            'schedule_type' => '入浴'
        ];
        
        $schedule = $service->createSchedule($data);
        
        $this->assertEquals('入浴', $schedule->title);
        $this->assertEquals('2024-01-15', $schedule->date);
    }
    
    public function test_cannot_create_bath_schedule_on_weekend()
    {
        $service = new ScheduleService();
        $data = [
            'title' => '入浴',
            'date' => '2024-01-14', // 日曜日
            'schedule_type' => '入浴'
        ];
        
        $this->expectException(BusinessRuleException::class);
        $service->createSchedule($data);
    }
}

// ✅ 統合テスト（Feature Test）
class CalendarTest extends TestCase
{
    public function test_user_can_view_calendar_with_schedules()
    {
        $user = User::factory()->create();
        $schedule = Schedule::factory()->create([
            'date' => today(),
            'title' => 'テストスケジュール'
        ]);
        
        $response = $this->actingAs($user)
            ->get('/calendar');
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Calendar/Index')
                 ->has('schedules', 1)
                 ->where('schedules.0.title', 'テストスケジュール')
        );
    }
}
```

## 📊 監視・ログのベストプラクティス

### ログの効果的な活用

```php
// ✅ 構造化ログ
Log::info('Schedule created', [
    'schedule_id' => $schedule->id,
    'created_by' => $user->id,
    'resident_id' => $schedule->resident_id,
    'date' => $schedule->date,
    'execution_time' => $executionTime
]);

// ✅ エラーログの詳細化
Log::error('Schedule creation failed', [
    'user_id' => $user->id,
    'input_data' => $request->all(),
    'error_message' => $exception->getMessage(),
    'stack_trace' => $exception->getTraceAsString(),
    'request_id' => $request->id()
]);

// ✅ パフォーマンス監視
$startTime = microtime(true);
// 処理実行
$executionTime = microtime(true) - $startTime;

if ($executionTime > 1.0) { // 1秒以上の場合
    Log::warning('Slow query detected', [
        'execution_time' => $executionTime,
        'query' => 'schedule_list',
        'parameters' => $parameters
    ]);
}
```

## 🔧 開発効率化のベストプラクティス

### IDE・エディタの活用

```json
// ✅ VS Code の設定例
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "blade": "html"
  },
  "files.associations": {
    "*.blade.php": "blade"
  }
}

// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "onecentlin.laravel-blade",
    "bmewburn.vscode-intelephense-client"
  ]
}
```

### 自動化の活用

```bash
# ✅ Makefile での作業自動化
# Makefile
.PHONY: setup dev test deploy

setup:
	cp .env.example .env
	./vendor/bin/sail up -d
	./vendor/bin/sail artisan key:generate
	./vendor/bin/sail artisan migrate --seed

dev:
	./vendor/bin/sail up -d
	npm run dev

test:
	./vendor/bin/sail artisan test
	npm run test

deploy:
	npm run build
	./vendor/bin/sail artisan config:cache
	./vendor/bin/sail artisan route:cache
	./vendor/bin/sail artisan view:cache
```

---

**💡 ベストプラクティスの適用**: 
- **段階的導入**: 一度にすべて適用せず、段階的に改善
- **チーム合意**: チーム全体で合意したルールを守る
- **継続的改善**: 定期的にルールを見直し、より良い方法を模索
- **実用性重視**: 理想論より実際のプロジェクトで実行可能な方法を選択