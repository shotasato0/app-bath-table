# ⚙️ 運用コマンド

このドキュメントでは、介護施設カレンダーアプリの日常運用で使用する各種コマンドについて説明します。

## 📋 コマンド概要

アプリケーションの運用では、以下のカテゴリに分けてコマンドを整理しています：

- **開発・デバッグ**: 開発中やトラブルシューティング用
- **データベース**: データ管理・バックアップ用
- **システム管理**: パフォーマンス・メンテナンス用
- **デプロイ**: 本番環境展開用

## 🚀 基本操作コマンド

### アプリケーション起動・停止

```bash
# アプリケーション起動
./vendor/bin/sail up -d

# 特定サービスのみ起動
./vendor/bin/sail up mysql -d

# アプリケーション停止
./vendor/bin/sail down

# ボリュームも含めて完全削除
./vendor/bin/sail down --volumes
```

### ログ確認

```bash
# 全サービスのログ確認
./vendor/bin/sail logs

# 特定サービスのログ確認
./vendor/bin/sail logs laravel.test
./vendor/bin/sail logs mysql

# リアルタイムログ監視
./vendor/bin/sail logs -f

# Laravelアプリケーションログ
./vendor/bin/sail artisan log:show
tail -f storage/logs/laravel.log
```

## 🗃️ データベース管理コマンド

### マイグレーション

```bash
# マイグレーション実行
./vendor/bin/sail artisan migrate

# マイグレーション状況確認
./vendor/bin/sail artisan migrate:status

# マイグレーションロールバック
./vendor/bin/sail artisan migrate:rollback

# マイグレーション完全リセット
./vendor/bin/sail artisan migrate:fresh --seed

# 特定マイグレーションの実行
./vendor/bin/sail artisan migrate --path=database/migrations/specific_migration.php
```

### シーダー実行

```bash
# 全シーダー実行
./vendor/bin/sail artisan db:seed

# 特定シーダー実行
./vendor/bin/sail artisan db:seed --class=DepartmentSeeder
./vendor/bin/sail artisan db:seed --class=UserSeeder
./vendor/bin/sail artisan db:seed --class=ResidentSeeder
./vendor/bin/sail artisan db:seed --class=ScheduleTypeSeeder
./vendor/bin/sail artisan db:seed --class=ScheduleSeeder

# 本番環境でのシーダー実行（強制）
./vendor/bin/sail artisan db:seed --force
```

### データベース直接操作

```bash
# MySQLコンソール接続
./vendor/bin/sail mysql

# データベース構造確認
./vendor/bin/sail artisan db:show

# テーブル一覧とレコード数
./vendor/bin/sail artisan db:show --counts

# 特定テーブルの構造確認
./vendor/bin/sail artisan db:table schedules
./vendor/bin/sail artisan db:table residents

# データベースバックアップ
./vendor/bin/sail exec mysql mysqldump -u sail -p care_facility_calendar > backup_$(date +%Y%m%d_%H%M%S).sql

# データベースリストア
./vendor/bin/sail exec -T mysql mysql -u sail -p care_facility_calendar < backup_20240115_143000.sql
```

## 🧹 キャッシュ・最適化コマンド

### キャッシュクリア

```bash
# 全キャッシュクリア
./vendor/bin/sail artisan cache:clear

# 設定キャッシュクリア
./vendor/bin/sail artisan config:clear

# ルートキャッシュクリア
./vendor/bin/sail artisan route:clear

# ビューキャッシュクリア
./vendor/bin/sail artisan view:clear

# 全キャッシュを一括クリア
./vendor/bin/sail artisan optimize:clear
```

### パフォーマンス最適化

```bash
# 本番環境用最適化
./vendor/bin/sail artisan optimize

# 設定キャッシュ生成
./vendor/bin/sail artisan config:cache

# ルートキャッシュ生成
./vendor/bin/sail artisan route:cache

# ビューキャッシュ生成
./vendor/bin/sail artisan view:cache

# イベントキャッシュ生成
./vendor/bin/sail artisan event:cache
```

## 📊 データ確認・統計コマンド

### データ確認用Artisanコマンド

```bash
# 今日のスケジュール確認
./vendor/bin/sail artisan schedule:show

# 特定日のスケジュール確認
./vendor/bin/sail artisan schedule:show 2024-01-15

# 住民一覧確認
./vendor/bin/sail artisan residents:list

# 部署別統計確認
./vendor/bin/sail artisan stats:departments

# スケジュール種別別統計
./vendor/bin/sail artisan stats:schedule-types
```

### Tinkerでのデータ確認

```bash
# Tinker起動
./vendor/bin/sail artisan tinker

# 基本統計確認
>> App\Models\Department::count()
>> App\Models\User::count()
>> App\Models\Resident::count()
>> App\Models\Schedule::count()

# 今日のスケジュール
>> App\Models\Schedule::whereDate('date', today())->with(['resident', 'scheduleType'])->get()

# アクティブ住民一覧
>> App\Models\Resident::active()->with('department')->get()

# 部署別住民数
>> App\Models\Resident::join('departments', 'residents.department_id', '=', 'departments.id')
     ->selectRaw('departments.department_name, count(*) as count')
     ->groupBy('departments.department_name')
     ->get()

# 今週のスケジュール統計
>> App\Models\Schedule::whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()])
     ->join('schedule_types', 'schedules.schedule_type_id', '=', 'schedule_types.id')
     ->selectRaw('schedule_types.name, count(*) as count')
     ->groupBy('schedule_types.name')
     ->get()
```

## 🧪 テスト実行コマンド

### PHPUnitテスト

```bash
# 全テスト実行
./vendor/bin/sail artisan test

# 特定テストクラス実行
./vendor/bin/sail artisan test tests/Feature/DashboardTest.php

# 特定テストメソッド実行
./vendor/bin/sail artisan test --filter test_dashboard_displays_correctly

# テストカバレッジ確認
./vendor/bin/sail artisan test --coverage

# 並列テスト実行
./vendor/bin/sail artisan test --parallel
```

### Pestテスト（使用している場合）

```bash
# Pestテスト実行
./vendor/bin/sail pest

# 特定ファイルのテスト
./vendor/bin/sail pest tests/Feature/CalendarTest.php

# テストカバレッジ付き実行
./vendor/bin/sail pest --coverage
```

## 🛠️ メンテナンスコマンド

### ストレージ管理

```bash
# ストレージリンク作成
./vendor/bin/sail artisan storage:link

# 不要ファイル削除
./vendor/bin/sail artisan app:cleanup-files

# ログファイルローテーション
./vendor/bin/sail artisan app:rotate-logs

# 一時ファイル削除
rm -rf storage/app/tmp/*
rm -rf storage/framework/cache/data/*
rm -rf storage/framework/sessions/*
rm -rf storage/framework/views/*
```

### 権限・依存関係管理

```bash
# ファイル権限修正
./vendor/bin/sail exec laravel.test chmod -R 775 storage
./vendor/bin/sail exec laravel.test chmod -R 775 bootstrap/cache

# Composer依存関係更新
./vendor/bin/sail composer update

# npm依存関係更新
./vendor/bin/sail npm update

# セキュリティ脆弱性チェック
./vendor/bin/sail composer audit
./vendor/bin/sail npm audit
```

## 📦 アセット管理コマンド

### フロントエンド開発

```bash
# 開発サーバー起動
./vendor/bin/sail npm run dev

# 本番用ビルド
./vendor/bin/sail npm run build

# ウォッチモード（ファイル変更検知）
./vendor/bin/sail npm run dev -- --watch

# アセット削除
./vendor/bin/sail npm run clean
rm -rf public/build/*
```

## 🔧 カスタムArtisanコマンド

プロジェクト固有のコマンドを作成・実行できます。

### カスタムコマンド作成

```bash
# 新しいコマンド作成
./vendor/bin/sail artisan make:command CreateMonthlyReport

# スケジュール済みコマンド一覧
./vendor/bin/sail artisan schedule:list

# スケジュール手動実行
./vendor/bin/sail artisan schedule:run
```

### 使用例：月次レポート生成

```php
// app/Console/Commands/CreateMonthlyReport.php

class CreateMonthlyReport extends Command
{
    protected $signature = 'report:monthly {month?}';
    protected $description = '月次レポートを生成します';

    public function handle()
    {
        $month = $this->argument('month') ?? date('Y-m');
        
        // レポート生成ロジック
        $this->info("月次レポート生成中: {$month}");
        
        // 実装...
        
        $this->info('月次レポート生成完了');
    }
}
```

```bash
# 月次レポート生成実行
./vendor/bin/sail artisan report:monthly
./vendor/bin/sail artisan report:monthly 2024-01
```

## 🚨 緊急時対応コマンド

### 緊急メンテナンス

```bash
# メンテナンスモード開始
./vendor/bin/sail artisan down --message="定期メンテナンス中です" --retry=60

# 特定IPのみアクセス許可
./vendor/bin/sail artisan down --secret="emergency-access-2024"

# メンテナンスモード解除
./vendor/bin/sail artisan up
```

### システム復旧

```bash
# 設定リセット
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan cache:clear
./vendor/bin/sail artisan route:clear

# 権限リセット
./vendor/bin/sail exec laravel.test chown -R sail:sail /var/www/html
./vendor/bin/sail exec laravel.test chmod -R 755 /var/www/html

# データベース接続確認
./vendor/bin/sail artisan migrate:status
./vendor/bin/sail mysql -e "SELECT 1"

# アプリケーション正常性チェック
./vendor/bin/sail artisan app:health-check
```

## 📋 定期実行コマンド

### 日次バッチ処理

```bash
# 日次データクリーンアップ（cron設定）
0 2 * * * /var/www/html/vendor/bin/sail artisan app:daily-cleanup

# 週次レポート生成（日曜日）
0 6 * * 0 /var/www/html/vendor/bin/sail artisan report:weekly

# 月次統計集計（月初）
0 3 1 * * /var/www/html/vendor/bin/sail artisan stats:monthly
```

### Laravel Scheduler設定

```php
// app/Console/Kernel.php

protected function schedule(Schedule $schedule)
{
    // 日次データクリーンアップ
    $schedule->command('app:daily-cleanup')
             ->daily()
             ->at('02:00');
    
    // 週次バックアップ
    $schedule->command('backup:run')
             ->weekly()
             ->sundays()
             ->at('03:00');
    
    // 月次レポート生成
    $schedule->command('report:monthly')
             ->monthly()
             ->at('06:00');
}
```

## 📚 関連ドキュメント

- [トラブルシューティング](troubleshooting.md) - 問題解決の詳細手順
- [環境構築](../setup/environment.md) - 初期セットアップ手順
- [データベース設計](../development/database.md) - テーブル構造とクエリ最適化

---

**💡 運用のポイント**: 
- 定期的なバックアップとヘルスチェックの実施
- ログ監視によるプロアクティブなトラブル対応
- パフォーマンス最適化の定期実行
- セキュリティアップデートの適用