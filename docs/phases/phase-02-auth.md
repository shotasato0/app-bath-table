# 🔐 Phase 2: 認証システムカスタマイズ

このドキュメントでは、Laravel Breezeの標準認証システムを **介護施設向けにカスタマイズ** する実装手順を段階的に説明します。

## 📋 この段階の目標

- **ユーザー名ベース認証**: メールアドレスからログインIDに変更
- **日本語UI対応**: 認証画面の完全日本語化
- **職員向けUX**: 介護職員が使いやすいUI設計
- **権限システム**: 管理者・職員・閲覧者の3段階権限

## 🎯 実装する機能

この段階で実装・変更する **認証システム**：

```
認証フロー
├── ログイン: username + password 方式
├── 登録: 管理者による職員登録
├── プロフィール: 日本語化された設定画面
└── 権限制御: ロールベースアクセス制御
```

## 💡 学習ポイント

この段階で身につく技術・知識：

- **Laravel認証システム** のカスタマイズ方法
- **Inertia.js** と React の連携
- **多言語化** (日本語化) の実装
- **ミドルウェア** による権限制御
- **バリデーション** のカスタマイズ

## 🚀 実装手順

### Step 1: 認証ロジックの変更

#### 1.1 ログイン処理の変更

Laravel Breezeの認証処理をemailからusernameベースに変更します。

**LoginRequest の修正**:
```php
// app/Http/Requests/Auth/LoginRequest.php

public function rules(): array
{
    return [
        'username' => ['required', 'string'], // email から username に変更
        'password' => ['required', 'string'],
    ];
}

public function authenticate(): void
{
    $this->ensureIsNotRateLimited();

    // username ベースの認証に変更
    if (! Auth::attempt($this->only('username', 'password'), $this->boolean('remember'))) {
        RateLimiter::hit($this->throttleKey());

        throw ValidationException::withMessages([
            'username' => trans('auth.failed'), // username フィールドにエラー表示
        ]);
    }

    RateLimiter::clear($this->throttleKey());
}

public function throttleKey(): string
{
    // レート制限のキーも username ベースに変更
    return Str::transliterate(Str::lower($this->input('username')).'|'.$this->ip());
}
```

**⚠️ よくあるエラーと対処法**:

```bash
# エラー: "The username field is required"（英語メッセージ）
# 原因: バリデーションメッセージの翻訳が未設定
# 解決: lang/ja/validation.php で翻訳を追加

'attributes' => [
    'username' => 'ログインID',
    'password' => 'パスワード',
],
```

#### 1.2 ユーザー登録処理の変更

```php
// app/Http/Controllers/Auth/RegisteredUserController.php

public function store(Request $request): RedirectResponse
{
    $request->validate([
        'name' => 'required|string|max:255',
        'username' => 'required|string|max:50|unique:users', // 追加
        'email' => 'nullable|string|email|max:255|unique:users', // nullable に変更
        'password' => ['required', 'confirmed', Rules\Password::defaults()],
        'department_id' => 'required|exists:departments,id', // 追加
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

    return redirect(route('dashboard'));
}
```

### Step 2: フロントエンド（React）の日本語化

#### 2.1 ログイン画面のカスタマイズ

**Login.jsx の全面的な書き換え**:

```jsx
// resources/js/Pages/Auth/Login.jsx

import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import Checkbox from '@/Components/Checkbox';
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

            {/* 介護施設向けのヘッダー */}
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    介護施設カレンダーシステム
                </h1>
                <p className="text-gray-600 mt-2">
                    ログインIDとパスワードを入力してください
                </p>
            </div>

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <form onSubmit={submit}>
                {/* ログインID フィールド（email から変更） */}
                <div>
                    <InputLabel htmlFor="username" value="ログインID" />
                    <TextInput
                        id="username"
                        type="text"
                        name="username"
                        value={data.username}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        placeholder="例: nurse01"
                        isFocused={true}
                        onChange={(e) => setData('username', e.target.value)}
                    />
                    <InputError message={errors.username} className="mt-2" />
                </div>

                {/* パスワード フィールド */}
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

                {/* ログイン状態保持 */}
                <div className="block mt-4">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            ログイン状態を保持する
                        </span>
                    </label>
                </div>

                <div className="flex items-center justify-end mt-4">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        ログイン
                    </PrimaryButton>
                </div>
            </form>

            {/* デモ用認証情報の表示 */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">デモ用アカウント</h3>
                <div className="text-xs text-blue-700">
                    <p>管理者: <span className="font-mono">admin</span> / password</p>
                    <p>職員: <span className="font-mono">nurse01</span> / password</p>
                </div>
            </div>
        </GuestLayout>
    );
}
```

**💡 実装のポイント**:
- `email` フィールドを `username` に完全置換
- 介護施設らしいタイトル・説明文を追加
- デモ用アカウント情報を表示してテストを容易化
- `placeholder` でユーザーに入力例を提示

#### 2.2 ユーザー登録画面のカスタマイズ

```jsx
// resources/js/Pages/Auth/Register.jsx

import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
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

    // ... submit handler ...

    return (
        <GuestLayout>
            <Head title="職員登録" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-gray-900">
                    新規職員登録
                </h1>
                <p className="text-gray-600 mt-2">
                    職員情報を入力してアカウントを作成してください
                </p>
            </div>

            <form onSubmit={submit}>
                {/* 氏名 */}
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

                {/* ログインID */}
                <div className="mt-4">
                    <InputLabel htmlFor="username" value="ログインID" />
                    <TextInput
                        id="username"
                        type="text"
                        name="username"
                        value={data.username}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        placeholder="半角英数字で入力（例: nurse01）"
                        onChange={(e) => setData('username', e.target.value)}
                        required
                    />
                    <InputError message={errors.username} className="mt-2" />
                </div>

                {/* 所属部署（新規追加） */}
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

                {/* メールアドレス（オプション） */}
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
                    <p className="mt-1 text-xs text-gray-500">
                        ※ パスワードリセット等で使用します（入力は任意）
                    </p>
                </div>

                {/* パスワード */}
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

                {/* パスワード確認 */}
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

                <div className="flex items-center justify-end mt-6">
                    <Link
                        href={route('login')}
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        ログイン画面に戻る
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        職員登録
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
```

### Step 3: 認証コントローラーの調整

#### 3.1 部署データの提供

```php
// app/Http/Controllers/Auth/RegisteredUserController.php

public function create()
{
    // 登録画面で部署選択を可能にする
    $departments = Department::orderBy('department_name')->get();
    
    return Inertia::render('Auth/Register', [
        'departments' => $departments,
    ]);
}
```

### Step 4: 日本語翻訳ファイルの作成

#### 4.1 認証関連の翻訳

```php
// lang/ja/auth.php

return [
    'failed' => 'ログインIDまたはパスワードが正しくありません。',
    'password' => 'パスワードが正しくありません。',
    'throttle' => 'ログイン試行回数が多すぎます。:seconds秒後に再試行してください。',
];
```

#### 4.2 バリデーション翻訳

```php
// lang/ja/validation.php

return [
    'required' => ':attributeは必須です。',
    'string' => ':attributeは文字列である必要があります。',
    'max' => [
        'string' => ':attributeは:max文字以内で入力してください。',
    ],
    'unique' => ':attributeは既に使用されています。',
    'email' => ':attributeは有効なメールアドレス形式で入力してください。',
    'confirmed' => ':attributeの確認が一致しません。',
    'exists' => '選択された:attributeは無効です。',

    'attributes' => [
        'name' => '氏名',
        'username' => 'ログインID',
        'email' => 'メールアドレス',
        'password' => 'パスワード',
        'password_confirmation' => 'パスワード（確認）',
        'department_id' => '所属部署',
        'role' => '権限',
    ],
];
```

#### 4.3 アプリケーション設定の日本語化

```php
// config/app.php

'locale' => 'ja',
'fallback_locale' => 'en',
'faker_locale' => 'ja_JP',
'timezone' => 'Asia/Tokyo',
```

### Step 5: 権限制御システムの実装

#### 5.1 権限チェック用ミドルウェア

```bash
./vendor/bin/sail artisan make:middleware CheckRole
```

```php
// app/Http/Middleware/CheckRole.php

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!$request->user() || $request->user()->role !== $role) {
            abort(403, 'アクセス権限がありません');
        }

        return $next($request);
    }
}
```

#### 5.2 ミドルウェアの登録

```php
// app/Http/Kernel.php

protected $routeMiddleware = [
    // ... 他のミドルウェア
    'role' => \App\Http\Middleware\CheckRole::class,
];
```

#### 5.3 ルートでの権限設定

```php
// routes/web.php

Route::middleware(['auth', 'verified'])->group(function () {
    // 全職員がアクセス可能
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // staff以上の権限が必要
    Route::middleware('role:staff')->group(function () {
        Route::post('/schedules', [ScheduleController::class, 'store']);
        Route::put('/schedules/{schedule}', [ScheduleController::class, 'update']);
    });
    
    // admin権限が必要
    Route::middleware('role:admin')->group(function () {
        Route::resource('users', UserController::class);
        Route::resource('departments', DepartmentController::class);
    });
});
```

### Step 6: プロフィール設定の日本語化

#### 6.1 プロフィール編集画面

```jsx
// resources/js/Pages/Profile/Edit.jsx

export default function Edit({ auth, mustVerifyEmail, status, departments }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">プロフィール設定</h2>}
        >
            <Head title="プロフィール設定" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            departments={departments}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

### Step 7: よくあるエラーと対処法

#### 7.1 認証エラー

**エラー**: ログインに失敗する

```bash
# デバッグ方法
./vendor/bin/sail artisan tinker

# ユーザーの確認
>> User::where('username', 'admin')->first()

# パスワードハッシュの確認
>> $user = User::where('username', 'admin')->first();
>> Hash::check('password', $user->password);
=> true
```

#### 7.2 翻訳が反映されない

**対処法**: 言語ファイルのキャッシュクリア

```bash
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan cache:clear
```

#### 7.3 Inertia.js のエラー

**エラー**: フォームデータが送信されない

```jsx
// 解決: useForm の適切な使用
const { data, setData, post, processing, errors } = useForm({
    username: '',
    password: '',
});

// フォーム送信
const submit = (e) => {
    e.preventDefault();
    post(route('login')); // 正確なルート名を指定
};
```

### Step 8: テスト実行と動作確認

#### 8.1 認証フローのテスト

```bash
# 開発サーバー起動
./vendor/bin/sail up -d
npm run dev

# ブラウザで確認
# http://localhost/login
```

#### 8.2 テストケースの作成（推奨）

```php
// tests/Feature/Auth/AuthenticationTest.php

public function test_login_with_username(): void
{
    $user = User::factory()->create([
        'username' => 'testuser',
        'password' => Hash::make('password'),
    ]);

    $response = $this->post('/login', [
        'username' => 'testuser',
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect('/dashboard');
}

public function test_login_with_invalid_credentials(): void
{
    $response = $this->post('/login', [
        'username' => 'invalid',
        'password' => 'invalid',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['username']);
}
```

## ✅ 確認方法

Phase 2 が完了したら、以下を確認してください：

### 認証システムの動作確認

```bash
# デフォルトユーザーでのログインテスト
# ブラウザで http://localhost/login

# 管理者: admin / password
# 職員: nurse01 / password
```

### 権限制御の確認

```bash
# 権限テスト用のルート確認
./vendor/bin/sail artisan route:list --path=admin
```

### 日本語化の確認

- ログイン画面が日本語表示されている
- エラーメッセージが日本語で表示される
- プレースホルダーテキストが適切に表示される

## 🎯 次の段階への準備

Phase 2 が正常に完了したら、以下を確認してから Phase 3 に進みます：

- [ ] username ベースのログインが動作している
- [ ] 新規職員登録が正常に動作している
- [ ] 日本語UIが適切に表示されている
- [ ] 権限制御が正常に機能している
- [ ] プロフィール設定画面が動作している

**次回**: [Phase 3: サンプルデータ作成](phase-03-sample-data.md) では、実際の介護施設運用を想定したリアルなテストデータを生成します。

---

**💡 Phase 2 のポイント**: 
- **段階的変更**: email認証から徐々にusername認証に移行
- **UX重視**: 介護職員が直感的に使えるUI設計
- **完全日本語化**: エラーメッセージからプレースホルダーまで全て日本語
- **権限設計**: 将来の機能拡張を見越した柔軟な権限システム