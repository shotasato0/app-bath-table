# 📋 必要な環境・ソフトウェア

このプロジェクトを開始する前に、以下の環境・ソフトウェアが必要です。

## 🐳 Docker環境（推奨）

Laravel Sailを使用してDocker環境で開発することを強く推奨します。

### 必須ソフトウェア

| ソフトウェア | 最小バージョン | 推奨バージョン | インストール方法 |
|------------|--------------|--------------|---------------|
| **Docker** | 20.10+ | 最新安定版 | [Docker公式サイト](https://www.docker.com/get-started) |
| **Docker Compose** | 2.0+ | 最新安定版 | Dockerに同梱 |
| **Node.js** | 20.0+ | 20.x LTS | [Node.js公式サイト](https://nodejs.org/) |
| **npm** | 10.0+ | 最新 | Node.jsに同梱 |
| **Composer** | 2.4+ | 最新 | [Composer公式サイト](https://getcomposer.org/) |

### バージョン確認

以下のコマンドで現在のバージョンを確認できます：

```bash
# Docker
docker --version
docker-compose --version

# Node.js & npm
node --version
npm --version

# Composer
composer --version
```

### 期待される出力例

```bash
$ docker --version
Docker version 24.0.6, build ed223bc

$ docker-compose --version
Docker Compose version v2.21.0

$ node --version
v20.10.0

$ npm --version
10.2.3

$ composer --version
Composer version 2.6.5 2023-10-06 10:11:52
```

## 🖥️ ローカル環境（非推奨）

Dockerを使用できない場合のローカル環境セットアップです。

### 必須ソフトウェア

| ソフトウェア | バージョン | 備考 |
|------------|-----------|------|
| **PHP** | 8.2+ | 拡張モジュール必須 |
| **MySQL/PostgreSQL** | MySQL 8.0+ / PostgreSQL 13+ | どちらか一方 |
| **Node.js** | 20.0+ | フロントエンド用 |
| **Composer** | 2.4+ | PHP依存関係管理 |

### 必要なPHP拡張モジュール

```bash
# 必須拡張モジュール
- bcmath
- ctype
- curl
- dom
- fileinfo
- json
- mbstring
- openssl
- pcre
- pdo
- pdo_mysql (MySQLの場合)
- pdo_pgsql (PostgreSQLの場合)
- tokenizer
- xml
- zip
```

### PHPインストール確認

```bash
# PHP本体
php --version

# 拡張モジュール確認
php -m | grep -E "(bcmath|ctype|curl|dom|fileinfo|json|mbstring|openssl|pcre|pdo|tokenizer|xml|zip)"
```

## 🛠️ 開発ツール（推奨）

| ツール | 用途 | インストール |
|-------|------|------------|
| **VS Code** | エディタ | [VS Code公式](https://code.visualstudio.com/) |
| **Git** | バージョン管理 | [Git公式](https://git-scm.com/) |

### VS Code 推奨拡張機能

```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "bmewburn.vscode-intelephense-client",
    "MehediDracula.php-namespace-resolver"
  ]
}
```

## 🔧 OS別セットアップガイド

### macOS

```bash
# Homebrewを使用（推奨）
brew install --cask docker
brew install node composer

# Docker Desktopを起動
open -a Docker
```

### Windows

1. **Docker Desktop for Windows** をインストール
2. **Node.js** を公式サイトからダウンロード
3. **Composer** を公式サイトからダウンロード
4. **Git for Windows** をインストール

### Ubuntu/Debian

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Node.js (NodeSource経由)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

## ✅ 環境構築完了チェック

すべてのソフトウェアがインストールできたら、以下で確認してください：

```bash
# 基本コマンドが動作することを確認
docker run hello-world
node --version
npm --version
composer --version

# Docker Composeが利用可能か確認
docker-compose --version
```

## 🆘 トラブルシューティング

### よくある問題

#### Docker Desktop が起動しない

**症状**: `docker` コマンドが "Cannot connect to the Docker daemon" エラーを出す

**解決方法**:
1. Docker Desktop アプリケーションが起動しているか確認
2. システム再起動
3. Docker Desktop を再インストール

#### Node.js のバージョンが古い

**症状**: `npm install` でエラーが発生する

**解決方法**:
```bash
# Node Version Manager (nvm) を使用
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
nvm install 20
nvm use 20
```

#### Composer が SSL エラーを出す

**症状**: `composer install` で SSL 関連エラー

**解決方法**:
```bash
# SSL証明書を更新
composer self-update
composer diagnose
```

## 📚 次のステップ

環境が整ったら、[環境構築ガイド](environment.md) に進んでプロジェクトのセットアップを行ってください。

---

**💡 ヒント**: Docker環境を使用することで、環境依存の問題を大幅に削減できます。可能な限りDocker環境での開発をお勧めします。