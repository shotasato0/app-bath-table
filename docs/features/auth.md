# 🔐 認証システム

このドキュメントでは、介護施設カレンダーアプリの認証システムについて説明します。

## 📋 認証システム概要

Laravel Breezeをベースにして、介護施設の職員向けにカスタマイズした認証システムです。

### 主な特徴

- **ユーザー名ベース認証**（メールアドレス不要）
- **部署別権限管理**
- **日本語対応**
- **職員向けUI/UX**

## 🏗️ システム構成

### 認証関連テーブル

```
users (職員テーブル)
├── username : ログインID（ユニーク）
├── email : メールアドレス（任意）
├── role : 権限レベル（admin/staff/viewer）
├── department_id : 所属部署
└── permissions : 詳細権限設定
```

### 権限レベル

| レベル | 説明 | できること |
|--------|------|----------|
| **admin** | 管理者 | 全機能利用、ユーザー管理、システム設定 |
| **staff** | 一般職員 | スケジュール編集、住民情報閲覧・編集 |
| **viewer** | 閲覧者 | スケジュール・住民情報の閲覧のみ |

## 🚀 認証フロー

### 1. ログイン画面

```jsx
// resources/js/Pages/Auth/Login.jsx での主な変更点

// emailフィールドをusernameに変更
<TextInput
    id="username"
    type="text"
    name="username"
    value={data.username}
    className="mt-1 block w-full"
    autoComplete="username"
    onChange={(e) => setData('username', e.target.value)}
/>
```

### 2. 認証処理

```php
// app/Http/Requests/Auth/LoginRequest.php

public function rules(): array
{
    return [
        'username' => ['required', 'string'],  // emailからusernameに変更
        'password' => ['required', 'string'],
    ];
}

public function authenticate(): void
{
    if (! Auth::attempt($this->only('username', 'password'), $this->boolean('remember'))) {
        throw ValidationException::withMessages([
            'username' => trans('auth.failed'),
        ]);
    }
}
```

### 3. 認証後の処理

```php
// app/Http/Controllers/Auth/AuthenticatedSessionController.php

public function store(LoginRequest $request): RedirectResponse
{
    $request->authenticate();
    $request->session()->regenerate();
    
    // ログイン後はダッシュボードにリダイレクト
    return redirect()->intended(route('dashboard'));
}
```

## 👥 ユーザー管理

### ユーザー登録

職員の新規登録は管理者のみが実行可能です。

```php
// app/Http/Controllers/Auth/RegisteredUserController.php

public function store(Request $request): RedirectResponse
{
    $request->validate([
        'name' => 'required|string|max:255',
        'username' => 'required|string|max:50|unique:users',
        'email' => 'nullable|string|email|max:255|unique:users',
        'password' => ['required', 'confirmed', Rules\Password::defaults()],
        'department_id' => 'required|exists:departments,id',
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

### デフォルトユーザー

システムには以下のデフォルトユーザーが用意されています：

```php
// database/seeders/UserSeeder.php

// 管理者ユーザー
User::create([
    'name' => '管理者 太郎',
    'username' => 'admin',
    'email' => 'admin@example.com',
    'password' => Hash::make('password'),
    'role' => 'admin',
    'department_id' => $adminDepartment->id,
]);

// 一般職員ユーザー
User::create([
    'name' => '看護師 花子',
    'username' => 'nurse01',
    'email' => 'nurse01@example.com',
    'password' => Hash::make('password'),
    'role' => 'staff',
    'department_id' => $nurseDepartment->id,
]);
```

## 🔒 権限制御

### ミドルウェアによる制御

```php
// app/Http/Middleware/CheckRole.php

public function handle(Request $request, Closure $next, string $role): Response
{
    if (!$request->user() || $request->user()->role !== $role) {
        abort(403, 'アクセス権限がありません');
    }

    return $next($request);
}
```

### ルートでの権限設定

```php
// routes/web.php

Route::middleware(['auth', 'verified'])->group(function () {
    // 全職員がアクセス可能
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
    
    // staff以上の権限が必要
    Route::middleware('role:staff')->group(function () {
        Route::post('/schedules', [ScheduleController::class, 'store'])->name('schedules.store');
        Route::put('/schedules/{schedule}', [ScheduleController::class, 'update'])->name('schedules.update');
    });
    
    // admin権限が必要
    Route::middleware('role:admin')->group(function () {
        Route::resource('users', UserController::class);
        Route::resource('departments', DepartmentController::class);
    });
});
```

### モデルでの権限チェック

```php
// app/Models/User.php

public function isAdmin(): bool
{
    return $this->role === 'admin';
}

public function canEditSchedules(): bool
{
    return in_array($this->role, ['admin', 'staff']);
}

public function canManageResidents(): bool
{
    return $this->role === 'admin' || 
           ($this->role === 'staff' && $this->permissions->can_manage_residents);
}

public function canViewReports(): bool
{
    return $this->role === 'admin' || 
           $this->permissions->can_view_reports;
}
```

### Bladeテンプレートでの権限制御

```php
// resources/views/layouts/navigation.blade.php

@if(auth()->user()->canEditSchedules())
    <x-nav-link :href="route('schedules.create')" :active="request()->routeIs('schedules.create')">
        スケジュール作成
    </x-nav-link>
@endif

@if(auth()->user()->isAdmin())
    <x-nav-link :href="route('users.index')" :active="request()->routeIs('users.*')">
        ユーザー管理
    </x-nav-link>
@endif
```

## 🌐 日本語化

### 言語設定

```php
// config/app.php

'locale' => 'ja',
'fallback_locale' => 'en',
'faker_locale' => 'ja_JP',
'timezone' => 'Asia/Tokyo',
```

### 認証関連の翻訳

```php
// lang/ja/auth.php

return [
    'failed' => 'ログインIDまたはパスワードが正しくありません。',
    'password' => 'パスワードが正しくありません。',
    'throttle' => 'ログイン試行回数が多すぎます。:seconds秒後に再試行してください。',
];
```

```php
// lang/ja/validation.php

'attributes' => [
    'name' => '氏名',
    'username' => 'ログインID',
    'email' => 'メールアドレス',
    'password' => 'パスワード',
    'password_confirmation' => 'パスワード（確認）',
    'department_id' => '所属部署',
    'role' => '権限',
],
```

## 🎨 UI/UXカスタマイズ

### ログイン画面の日本語化

```jsx
// resources/js/Pages/Auth/Login.jsx

export default function Login({ status, canResetPassword }) {
    return (
        <GuestLayout>
            <Head title="ログイン" />
            
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    介護施設カレンダーシステム
                </h1>
                <p className="text-gray-600 mt-2">
                    ログインIDとパスワードを入力してください
                </p>
            </div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="username" value="ログインID" />
                    <TextInput
                        id="username"
                        type="text"
                        name="username"
                        value={data.username}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('username', e.target.value)}
                    />
                    <InputError message={errors.username} className="mt-2" />
                </div>

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
        </GuestLayout>
    );
}
```

### 職員登録画面

```jsx
// resources/js/Pages/Auth/Register.jsx

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
```

## 🔧 セキュリティ設定

### パスワード要件

```php
// app/Http/Requests/Auth/RegisterRequest.php

public function rules(): array
{
    return [
        'password' => [
            'required', 
            'confirmed', 
            'min:8',                    // 最低8文字
            'regex:/[a-z]/',           // 小文字を含む
            'regex:/[A-Z]/',           // 大文字を含む
            'regex:/[0-9]/',           // 数字を含む
            'regex:/[@$!%*#?&]/',      // 特殊文字を含む
        ],
    ];
}
```

### セッション設定

```php
// config/session.php

'lifetime' => env('SESSION_LIFETIME', 480), // 8時間
'expire_on_close' => false,
'encrypt' => true,
'secure' => env('SESSION_SECURE_COOKIE', false),
'same_site' => 'lax',
```

### CSRF保護

```php
// app/Http/Middleware/VerifyCsrfToken.php

protected $except = [
    // APIエンドポイントなど、必要に応じて除外
];
```

## 🧪 テスト

### 認証テスト例

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

### 権限テスト例

```php
// tests/Feature/Auth/AuthorizationTest.php

public function test_admin_can_access_user_management(): void
{
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get('/users');
    
    $response->assertStatus(200);
}

public function test_staff_cannot_access_user_management(): void
{
    $staff = User::factory()->create(['role' => 'staff']);

    $response = $this->actingAs($staff)->get('/users');
    
    $response->assertStatus(403);
}
```

## 🛠️ トラブルシューティング

### よくある問題

#### ログインできない

**症状**: 正しいユーザー名・パスワードでもログインできない

**確認項目**:
```bash
# ユーザーデータの確認
./vendor/bin/sail artisan tinker
>> User::where('username', 'admin')->first()

# パスワードハッシュの確認
>> Hash::check('password', $user->password)

# セッション設定の確認
>> config('session')
```

#### 権限エラーが発生する

**症状**: アクセス権限がないというエラーが出る

**確認項目**:
```bash
# ユーザーの権限確認
>> auth()->user()->role
>> auth()->user()->permissions

# ミドルウェアの確認
# app/Http/Kernel.php のミドルウェア設定を確認
```

#### 日本語が表示されない

**症状**: エラーメッセージが英語で表示される

**確認項目**:
```bash
# 言語設定の確認
>> config('app.locale')

# 翻訳ファイルの存在確認
ls -la lang/ja/

# キャッシュクリア
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan cache:clear
```

## 📚 関連ドキュメント

- [データベース設計](../development/database.md) - usersテーブルの詳細
- [ダッシュボード機能](dashboard.md) - 認証後の画面遷移
- [環境構築](../setup/environment.md) - 認証環境のセットアップ

---

**💡 設計のポイント**: 
- 介護施設の職員はメールアドレスを持たない場合が多いため、ユーザー名ベース認証を採用
- 部署別の権限管理により、適切なデータアクセス制御を実現
- 日本語UIで職員の使いやすさを重視