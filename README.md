# 介護施設カレンダーアプリ

## 📋 プロジェクト概要

**介護施設向け入浴スケジュール管理システム**

Laravel 12 + React + Inertia.js で構築された、介護施設での住民の入浴スケジュールを効率的に管理するWebアプリケーションです。

### 🎯 主な機能

- 📅 **カレンダー型UI**でのスケジュール管理
- 👥 **住民管理機能**とドラッグ&ドロップによる直感的操作
- 🔐 **職員認証システム**と権限管理
- 📱 **レスポンシブデザイン**でモバイル対応
- 🛁 **入浴スケジュール**の最適化と重複防止

### 🏗️ 技術スタック

- **バックエンド**: Laravel 12 (PHP 8.2+)
- **フロントエンド**: React 18 + Inertia.js
- **スタイリング**: Tailwind CSS
- **データベース**: MySQL/PostgreSQL
- **認証**: Laravel Breeze
- **開発環境**: Laravel Sail (Docker)

## 🚀 クイックスタート

### 前提条件

- Docker & Docker Compose
- Node.js 20+
- Composer

### セットアップ

```bash
# リポジトリクローン
git clone <repository-url>
cd app-bath-table

# 環境設定
cp .env.example .env

# Sailによる環境構築
./vendor/bin/sail up -d

# 依存関係インストール
./vendor/bin/sail composer install
npm install

# データベース準備
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed

# 開発サーバー起動
npm run dev
```

### アクセス

- **アプリケーション**: http://localhost
- **phpMyAdmin**: http://localhost:8080

### デフォルトユーザー

- **管理者**: admin / password
- **一般職員**: nurse01 / password

## 📚 ドキュメント

### 🔧 セットアップ・環境構築

- [📋 必要な環境・ソフトウェア](docs/setup/prerequisites.md)
- [🐳 Laravel Sail による環境構築](docs/setup/environment.md)

### ⚙️ 機能仕様・実装ガイド

- [🔐 認証システム](docs/features/auth.md)
- [📊 ダッシュボード機能](docs/features/dashboard.md)
- [📅 カレンダー機能](docs/features/calendar.md)

### 👩‍💻 開発ガイド

- [🗃️ データベース設計](docs/development/database.md)
- [🌱 シーダーとテストデータ](docs/development/seeding.md)
- [🧪 テスト実行方法](docs/development/testing.md)

### 🛠️ 運用・トラブルシューティング

- [📝 Artisanコマンド一覧](docs/operations/commands.md)
- [🔧 よくあるトラブルと対処法](docs/operations/troubleshooting.md)

## 📈 開発の進め方

このプロジェクトは **段階的な実装アプローチ** を採用しています：

1. **Phase 1**: データベース基盤構築
2. **Phase 2**: 認証システムカスタマイズ  
3. **Phase 3**: サンプルデータ作成
4. **Phase 4**: ダッシュボードUI実装
5. **Phase 5**: カレンダーUI基盤実装
6. **Phase 6**: スケジュール編集機能（予定）

各段階の詳細な実装手順は [開発ガイド](docs/development/) を参照してください。

## 🔍 主要なコマンド

```bash
# 開発環境起動
./vendor/bin/sail up -d

# データベースリセット
./vendor/bin/sail artisan migrate:fresh --seed

# テスト実行
./vendor/bin/sail test

# スケジュール確認
./vendor/bin/sail artisan schedule:show

# コードスタイル修正
./vendor/bin/sail composer pint
```

## 🤝 コントリビューション

1. フィーチャーブランチを作成
2. 変更を実装
3. テストを確認
4. プルリクエストを作成

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🆘 サポート

質問や問題がある場合は、以下をご確認ください：

1. [トラブルシューティングガイド](docs/operations/troubleshooting.md)
2. [Issue](https://github.com/username/app-bath-table/issues) の作成
3. [Discussion](https://github.com/username/app-bath-table/discussions) での議論

---

**🏥 介護業界のDXを推進し、職員の皆さんがより利用者ケアに集中できる環境づくりを目指しています。**
