<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'username' => 'admin',
                'password' => Hash::make('password'),
                'name' => '管理者',
                'role' => 'admin',
                'department_id' => 1, // 事務所
                'email' => 'admin@example.com',
            ],
            [
                'username' => 'tanaka',
                'password' => Hash::make('password'),
                'name' => '田中太郎',
                'role' => 'care_worker',
                'department_id' => 2, // デイサービス
                'email' => 'tanaka@example.com',
            ],
            [
                'username' => 'sato',
                'password' => Hash::make('password'),
                'name' => '佐藤花子',
                'role' => 'nurse',
                'department_id' => 5, // 看護部
                'email' => 'sato@example.com',
            ],
            [
                'username' => 'suzuki',
                'password' => Hash::make('password'),
                'name' => '鈴木次郎',
                'role' => 'manager',
                'department_id' => 2, // デイサービス
                'email' => 'suzuki@example.com',
            ],
            [
                'username' => 'yamada',
                'password' => Hash::make('password'),
                'name' => '山田美代子',
                'role' => 'care_worker',
                'department_id' => 3, // 訪問介護
                'email' => 'yamada@example.com',
            ],
            [
                'username' => 'takahashi',
                'password' => Hash::make('password'),
                'name' => '高橋健一',
                'role' => 'care_manager',
                'department_id' => 4, // 居宅介護支援
                'email' => 'takahashi@example.com',
            ],
            [
                'username' => 'watanabe',
                'password' => Hash::make('password'),
                'name' => '渡辺栄養',
                'role' => 'nutritionist',
                'department_id' => 6, // 栄養管理
                'email' => 'watanabe@example.com',
            ],
            [
                'username' => 'ito',
                'password' => Hash::make('password'),
                'name' => '伊藤相談',
                'role' => 'staff',
                'department_id' => 7, // 相談支援
                'email' => 'ito@example.com',
            ],
        ];

        foreach ($users as $user) {
            User::create($user);
        }
    }
}
