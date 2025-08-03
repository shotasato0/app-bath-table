# 🐳 Laravel Sail による環境構築

このガイドでは、Laravel Sailを使用したDocker環境でのプロジェクトセットアップを説明します。

## 🚀 クイックスタート

### 1. プロジェクトクローン

```bash
# GitHubからクローン
git clone <repository-url>
cd app-bath-table

# または、新規プロジェクトの場合
composer create-project laravel/laravel app-bath-table
cd app-bath-table
```

### 2. 環境設定ファイルの準備

```bash
# .envファイルをコピー
cp .env.example .env
```

### 3. Docker環境の起動

```bash
# Sailを使ってDockerコンテナを起動
./vendor/bin/sail up -d
```

**初回起動時の注意**：
- Dockerイメージのダウンロードに時間がかかります（5-10分程度）
- インターネット接続が必要です

### 4. 依存関係のインストール

```bash
# PHP依存関係（Composer）
./vendor/bin/sail composer install

# Node.js依存関係（npm）
npm install
```

### 5. アプリケーションキーの生成

```bash
./vendor/bin/sail artisan key:generate
```

### 6. データベースのセットアップ

```bash
# マイグレーション実行
./vendor/bin/sail artisan migrate

# サンプルデータの投入
./vendor/bin/sail artisan db:seed
```

### 7. フロントエンド開発サーバーの起動

```bash
# Vite開発サーバー起動
npm run dev
```

## 🔧 詳細な設定

### .envファイルの設定

プロジェクトルートの `.env` ファイルを以下のように設定してください：

```env
# アプリケーション基本設定
APP_NAME="介護施設カレンダー"
APP_ENV=local
APP_KEY=base64:xxx  # artisan key:generate で自動生成
APP_DEBUG=true
APP_TIMEZONE=Asia/Tokyo
APP_URL=http://localhost

# データベース設定（Sail用）
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=care_facility_calendar
DB_USERNAME=sail
DB_PASSWORD=password

# メール設定（開発用）
MAIL_MAILER=log
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

# Laravel Sail設定
SAIL_XDEBUG_MODE=develop,debug
SAIL_SKIP_CHECKS=true
```

### Docker Composeサービス

このプロジェクトには以下のサービスが含まれています：

| サービス | ポート | 用途 |
|---------|--------|------|
| **app** | - | Laravel アプリケーション |
| **mysql** | 3306 | MySQL データベース |
| **redis** | 6379 | Redis キャッシュ・セッション |
| **mailpit** | 1025, 8025 | メール送信テスト |
| **selenium** | 4444 | ブラウザテスト自動化 |

### アクセス確認

環境構築完了後、以下のURLにアクセスして動作を確認してください：

```bash
# アプリケーション
http://localhost

# メール送信確認（Mailpit）
http://localhost:8025

# データベース管理（phpMyAdmin）※追加が必要
http://localhost:8080
```

## 📝 よく使用するコマンド

### Sailエイリアスの設定（推奨）

毎回 `./vendor/bin/sail` と入力するのは面倒なので、エイリアスを設定しましょう：

```bash
# ~/.bashrc または ~/.zshrc に追加
alias sail='./vendor/bin/sail'

# 設定を反映
source ~/.bashrc  # または source ~/.zshrc
```

### 日常的な開発コマンド

```bash
# コンテナの起動・停止
sail up -d          # バックグラウンドで起動
sail down           # 停止

# データベース操作
sail artisan migrate              # マイグレーション実行
sail artisan migrate:fresh --seed # DB初期化+シーダー実行
sail artisan migrate:rollback     # マイグレーション巻き戻し

# Artisanコマンド
sail artisan make:model Post      # モデル作成
sail artisan make:controller PostController  # コントローラー作成
sail artisan make:migration create_posts_table  # マイグレーション作成

# テスト実行
sail test                         # 全テスト実行
sail test --filter=UserTest       # 特定のテストのみ

# パッケージ管理
sail composer install            # Composer依存関係インストール
sail composer require package    # パッケージ追加
npm install                      # Node.js依存関係インストール
npm run dev                      # 開発用ビルド
npm run build                    # 本番用ビルド

# ログ確認
sail logs                        # 全サービスのログ
sail logs app                    # アプリケーションのログのみ

# データベース接続
sail mysql                       # MySQLに直接接続
sail redis                       # Redisに直接接続
```

## 🎯 開発ワークフロー

### 日々の開発サイクル

```bash
# 1. 開発開始
sail up -d
npm run dev

# 2. コード変更・実装

# 3. マイグレーション（必要に応じて）
sail artisan migrate

# 4. テスト実行
sail test

# 5. 開発終了
sail down
```

### 新しい機能開発時

```bash
# 1. フィーチャーブランチ作成
git checkout -b feature/new-feature

# 2. マイグレーション作成
sail artisan make:migration create_new_table

# 3. モデル・コントローラー作成
sail artisan make:model NewModel
sail artisan make:controller NewController

# 4. 実装・テスト
sail test

# 5. コミット・プッシュ
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### ポートが既に使用されている

**エラー**: `port is already allocated`

**解決方法**:
```bash
# 使用中のポートを確認
lsof -i :3306
lsof -i :80

# 該当プロセスを停止するか、docker-compose.ymlでポート番号を変更
sail down
sail up -d
```

#### パーミッションエラー

**エラー**: `Permission denied`

**解決方法**:
```bash
# ストレージディレクトリの権限修正
sudo chown -R $USER:$USER storage
sudo chown -R $USER:$USER bootstrap/cache

# または、Sailコンテナ内で実行
sail shell
chown -R sail:sail /var/www/html/storage
chown -R sail:sail /var/www/html/bootstrap/cache
exit
```

#### npm installが失敗する

**エラー**: `npm ERR! peer dep missing`

**解決方法**:
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install

# または、依存関係の強制インストール
npm install --force
```

#### データベース接続エラー

**エラー**: `SQLSTATE[HY000] [2002] Connection refused`

**解決方法**:
```bash
# MySQLコンテナが起動しているか確認
sail ps

# MySQLコンテナを再起動
sail down
sail up -d

# .envファイルの設定確認
cat .env | grep DB_
```

### ログの確認方法

```bash
# 全サービスのログを表示
sail logs

# 特定のサービスのログを表示
sail logs app
sail logs mysql
sail logs redis

# リアルタイムでログを監視
sail logs -f

# Laravelアプリケーションログ
sail logs app | grep ERROR
```

## 🔒 セキュリティ設定

### 本番環境との違い

開発環境では以下のセキュリティ機能が無効化されています：

- HTTPS の強制
- CSRFトークンの厳密な検証
- デバッグモードの有効化

### 開発環境でのベストプラクティス

```bash
# 1. 定期的なセキュリティアップデート
sail composer update
npm update

# 2. 環境変数の管理
# .envファイルをGitにコミットしない
echo ".env" >> .gitignore

# 3. 不要なサービスの停止
sail down  # 使用しない時は停止
```

## 📚 次のステップ

環境構築が完了したら、以下に進んでください：

1. [データベース設計](../development/database.md) - DB構造の理解
2. [認証システム](../features/auth.md) - ログイン機能の詳細
3. [ダッシュボード機能](../features/dashboard.md) - メイン画面の実装

---

**💡 ヒント**: 
- コンテナを停止する際は `sail down` を実行してリソースを解放しましょう
- 定期的に `sail composer update` と `npm update` でパッケージを更新しましょう
- 問題が発生した場合は、まず `sail logs` でログを確認しましょう