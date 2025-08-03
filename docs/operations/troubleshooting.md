# 🔧 トラブルシューティング

このドキュメントでは、介護施設カレンダーアプリで発生する可能性のある問題と解決方法について説明します。

## 📋 トラブルシューティング概要

問題解決のアプローチを以下のカテゴリに分けて整理しています：

- **環境・インフラ**: Docker、データベース、ネットワーク関連
- **アプリケーション**: Laravel、React、Inertia.js関連
- **認証・権限**: ログイン、アクセス制御関連
- **データ**: データベース、マイグレーション関連
- **パフォーマンス**: 処理速度、メモリ使用量関連

## 🚨 一般的なトラブル解決手順

### 1. 基本情報の確認

```bash
# サービス状態確認
./vendor/bin/sail ps

# ログ確認
./vendor/bin/sail logs
./vendor/bin/sail logs laravel.test
./vendor/bin/sail logs mysql

# Laravel設定確認
./vendor/bin/sail artisan env
./vendor/bin/sail artisan config:show database
```

### 2. キャッシュクリア

```bash
# 全キャッシュクリア
./vendor/bin/sail artisan optimize:clear
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan cache:clear
./vendor/bin/sail artisan route:clear
./vendor/bin/sail artisan view:clear
```

### 3. 権限確認

```bash
# ファイル権限修正
./vendor/bin/sail exec laravel.test chmod -R 775 storage
./vendor/bin/sail exec laravel.test chmod -R 775 bootstrap/cache
./vendor/bin/sail exec laravel.test chown -R sail:sail /var/www/html
```

## 🐳 Docker・環境関連の問題

### 問題: Sailが起動しない

**症状**: `./vendor/bin/sail up` でエラーが発生する

**原因と解決方法**:

```bash
# ポート競合確認
netstat -an | grep :80
netstat -an | grep :3306

# 他のサービス停止
sudo service apache2 stop
sudo service mysql stop

# Dockerプロセス確認
docker ps -a

# 古いコンテナ削除
./vendor/bin/sail down --volumes
docker system prune -f

# 再起動
./vendor/bin/sail up -d
```

### 問題: データベース接続エラー

**症状**: `SQLSTATE[HY000] [2002] Connection refused`

**解決手順**:

```bash
# MySQLコンテナ状態確認
./vendor/bin/sail ps

# MySQL起動確認
./vendor/bin/sail logs mysql

# .env設定確認
cat .env | grep DB_

# 正しい設定例
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=care_facility_calendar
DB_USERNAME=sail
DB_PASSWORD=password

# データベース接続テスト
./vendor/bin/sail mysql -e "SELECT 1"

# 設定反映
./vendor/bin/sail artisan config:clear
./vendor/bin/sail restart
```

### 問題: コンテナ間通信の問題

**症状**: Laravel からMySQLに接続できない

**確認項目**:

```bash
# ネットワーク確認
docker network ls
docker network inspect sail

# コンテナIP確認
./vendor/bin/sail exec laravel.test hostname -i
./vendor/bin/sail exec mysql hostname -i

# Ping テスト
./vendor/bin/sail exec laravel.test ping mysql

# DNS解決確認
./vendor/bin/sail exec laravel.test nslookup mysql
```

## 💻 アプリケーション関連の問題

### 問題: ページが表示されない（500エラー）

**症状**: ブラウザで500 Internal Server Errorが表示される

**デバッグ手順**:

```bash
# エラーログ確認
./vendor/bin/sail logs laravel.test
tail -f storage/logs/laravel.log

# デバッグモード有効化
# .envファイル
APP_DEBUG=true
APP_ENV=local

# 設定反映
./vendor/bin/sail artisan config:clear

# ストレージリンク確認
./vendor/bin/sail artisan storage:link
ls -la public/storage

# Composer依存関係確認
./vendor/bin/sail composer install --no-dev --optimize-autoloader
```

### 問題: React/Inertia.jsページが表示されない

**症状**: ページが白紙、またはJSエラーが発生

**解決手順**:

```bash
# Node.js依存関係確認
./vendor/bin/sail npm install

# ビルドエラー確認
./vendor/bin/sail npm run dev

# 本番ビルド
./vendor/bin/sail npm run build

# ビルド結果確認
ls -la public/build/

# ブラウザコンソールでJSエラー確認
# F12 → Console タブで確認

# Inertia.js設定確認
cat app/Http/Middleware/HandleInertiaRequests.php
```

### 問題: CSSが適用されない

**症状**: スタイルが反映されない、レイアウトが崩れる

**確認項目**:

```bash
# Tailwind CSS設定確認
cat tailwind.config.js
cat vite.config.js

# CSS ファイルの存在確認
ls -la resources/css/
ls -la public/build/assets/

# ビルドプロセス確認
./vendor/bin/sail npm run build -- --debug

# キャッシュクリア
./vendor/bin/sail npm run clean
rm -rf public/build/*
./vendor/bin/sail npm run build
```

## 🔐 認証・権限関連の問題

### 問題: ログインできない

**症状**: 正しいユーザー名・パスワードでもログインが失敗する

**確認手順**:

```bash
# ユーザーデータ確認
./vendor/bin/sail artisan tinker
>> User::where('username', 'admin')->first()

# パスワードハッシュ確認
>> $user = User::where('username', 'admin')->first();
>> Hash::check('password', $user->password);

# セッション設定確認
cat .env | grep SESSION
./vendor/bin/sail artisan config:show session

# セッションファイル確認
ls -la storage/framework/sessions/

# セッションクリア
./vendor/bin/sail artisan cache:clear
rm -rf storage/framework/sessions/*
```

### 問題: 権限エラーが発生する

**症状**: `403 Forbidden` や `Unauthorized` エラー

**デバッグ方法**:

```bash
# 現在のユーザー権限確認
./vendor/bin/sail artisan tinker
>> auth()->user()->role
>> auth()->user()->permissions

# ミドルウェア確認
cat app/Http/Kernel.php

# ルート定義確認
./vendor/bin/sail artisan route:list --path=dashboard

# 権限チェックロジック確認
cat app/Http/Middleware/CheckRole.php
```

## 🗃️ データベース関連の問題

### 問題: マイグレーションエラー

**症状**: `./vendor/bin/sail artisan migrate` でエラーが発生

**解決手順**:

```bash
# マイグレーション状況確認
./vendor/bin/sail artisan migrate:status

# 特定マイグレーションのロールバック
./vendor/bin/sail artisan migrate:rollback --step=1

# マイグレーションファイル確認
ls -la database/migrations/

# MySQLエラーログ確認
./vendor/bin/sail logs mysql

# 手動でマイグレーション実行
./vendor/bin/sail artisan migrate --path=database/migrations/specific_migration.php

# 完全リセット（注意：データが消える）
./vendor/bin/sail artisan migrate:fresh --seed
```

### 問題: シーダーエラー

**症状**: `./vendor/bin/sail artisan db:seed` でエラーが発生

**デバッグ手順**:

```bash
# 特定シーダーを個別実行
./vendor/bin/sail artisan db:seed --class=DepartmentSeeder
./vendor/bin/sail artisan db:seed --class=UserSeeder

# シーダーファイル確認
cat database/seeders/DatabaseSeeder.php

# データ競合確認
./vendor/bin/sail artisan tinker
>> Department::count()
>> User::where('username', 'admin')->count()

# データベースリセット
./vendor/bin/sail artisan migrate:fresh
./vendor/bin/sail artisan db:seed
```

### 問題: クエリが遅い

**症状**: ページ読み込みが遅い、データベースクエリに時間がかかる

**最適化手順**:

```bash
# クエリデバッグ有効化
# .envファイル
DB_SLOW_QUERY_LOG=true
LOG_LEVEL=debug

# デバッグバーで確認（開発環境）
./vendor/bin/sail composer require barryvdh/laravel-debugbar --dev

# インデックス確認
./vendor/bin/sail mysql -e "SHOW INDEX FROM schedules;"
./vendor/bin/sail mysql -e "EXPLAIN SELECT * FROM schedules WHERE date = '2024-01-15';"

# N+1問題の確認
# コードでEager Loadingを使用しているか確認
# Schedule::with(['resident', 'scheduleType'])->get();
```

## ⚡ パフォーマンス関連の問題

### 問題: メモリ不足エラー

**症状**: `Fatal error: Allowed memory size exhausted`

**解決方法**:

```bash
# PHP メモリ制限確認
./vendor/bin/sail php -i | grep memory_limit

# 一時的な制限変更
./vendor/bin/sail php -d memory_limit=512M artisan command:name

# 永続的な設定変更
# php.ini または .env
MEMORY_LIMIT=512M

# 大量データ処理の最適化
# chunk() メソッドの使用
# Generator の使用例を確認
```

### 問題: ディスク容量不足

**症状**: 書き込みエラー、ログファイルの増大

**対処方法**:

```bash
# ディスク使用量確認
df -h
du -sh storage/logs/
du -sh storage/app/

# ログファイルローテーション
./vendor/bin/sail artisan log:clear
find storage/logs/ -name "*.log" -mtime +7 -delete

# 一時ファイル削除
rm -rf storage/framework/cache/data/*
rm -rf storage/framework/sessions/*
rm -rf storage/framework/views/*

# 不要なDockerイメージ削除
docker system prune -f
docker image prune -a -f
```

## 🌐 ネットワーク・ブラウザ関連の問題

### 問題: ページが読み込まれない

**症状**: ブラウザでページにアクセスできない

**確認項目**:

```bash
# サーバー起動確認
./vendor/bin/sail ps
curl -I http://localhost

# ポート確認
./vendor/bin/sail port laravel.test 80
netstat -an | grep :80

# ブラウザキャッシュクリア
# Ctrl+Shift+R（ハードリフレッシュ）

# HTTPS設定確認
cat .env | grep APP_URL

# プロキシ設定確認（企業環境など）
cat ~/.bashrc | grep -i proxy
```

### 問題: Ajax/API リクエストエラー

**症状**: フロントエンドからAPIリクエストが失敗する

**デバッグ方法**:

```bash
# ルート確認
./vendor/bin/sail artisan route:list

# CSRF トークン確認
cat resources/js/app.js | grep csrf

# ブラウザ開発者ツールで確認
# F12 → Network タブでリクエスト詳細を確認

# APIエンドポイントテスト
curl -X GET http://localhost/api/schedules \
  -H "Accept: application/json" \
  -H "Authorization: Bearer token"
```

## 🛠️ 開発・デプロイ関連の問題

### 問題: Composer/NPM 依存関係エラー

**症状**: パッケージインストールでエラーが発生

**解決手順**:

```bash
# Composer キャッシュクリア
./vendor/bin/sail composer clear-cache
rm -rf vendor/
./vendor/bin/sail composer install

# NPM キャッシュクリア
./vendor/bin/sail npm cache clean --force
rm -rf node_modules/
rm package-lock.json
./vendor/bin/sail npm install

# PHP拡張確認
./vendor/bin/sail php -m | grep -E "mysql|pdo|mbstring|xml"

# Node.js バージョン確認
./vendor/bin/sail node --version
./vendor/bin/sail npm --version
```

### 問題: Git関連のエラー

**症状**: マージ競合、コミットエラー

**解決方法**:

```bash
# 競合ファイル確認
git status
git diff

# マージ競合解決
git mergetool
# または手動編集後
git add conflicted_file.php
git commit -m "Resolve merge conflict"

# コミット履歴確認
git log --oneline --graph

# ブランチ確認
git branch -a
git remote -v

# 変更取り消し
git checkout -- filename.php  # 特定ファイル
git reset --hard HEAD         # 全変更
```

## 🔍 ログファイルの確認方法

### 主要ログファイルの場所

```bash
# Laravel アプリケーションログ
tail -f storage/logs/laravel.log

# MySQL エラーログ
./vendor/bin/sail logs mysql

# Nginx/Apache アクセスログ
./vendor/bin/sail logs laravel.test

# PHP エラーログ
./vendor/bin/sail exec laravel.test cat /var/log/php_errors.log
```

### ログレベル別確認

```bash
# エラーレベルのみ
grep "ERROR" storage/logs/laravel.log

# 警告以上
grep -E "(ERROR|WARNING)" storage/logs/laravel.log

# 特定時間範囲
grep "2024-01-15 14:" storage/logs/laravel.log

# 特定機能のログ
grep "auth" storage/logs/laravel.log
grep "database" storage/logs/laravel.log
```

## 📞 サポート・エスカレーション

### 問題報告時の情報収集

問題を報告する際は、以下の情報を含めてください：

```bash
# システム情報
./vendor/bin/sail php --version
./vendor/bin/sail artisan --version
./vendor/bin/sail node --version

# 環境情報
cat .env | grep -v "_PASSWORD\|_KEY"
./vendor/bin/sail artisan env

# エラー詳細
tail -n 50 storage/logs/laravel.log
./vendor/bin/sail logs --tail 50

# 実行コマンドと結果
echo "実行したコマンド: ./vendor/bin/sail artisan migrate"
echo "エラーメッセージ: [具体的なエラー内容]"
```

### 問題の優先度判定

| 優先度 | 症状 | 対応時間 |
|--------|------|----------|
| **緊急** | システム全体が停止 | 即座 |
| **高** | 主要機能が利用不可 | 2時間以内 |
| **中** | 一部機能に支障 | 1営業日以内 |
| **低** | 軽微な不具合 | 1週間以内 |

## 📚 関連ドキュメント

- [運用コマンド](commands.md) - 各種コマンドの詳細な使用方法
- [環境構築](../setup/environment.md) - 初期セットアップ時の問題解決
- [データベース設計](../development/database.md) - データベース関連の詳細

---

**💡 トラブルシューティングのポイント**: 
- 問題発生時は慌てずに、まずログを確認する
- 段階的にアプローチし、一度に複数の変更を行わない
- 問題解決後は、再発防止策を検討し文書化する
- 定期的なバックアップとモニタリングで予防に努める