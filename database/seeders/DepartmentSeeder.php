<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            ['department_name' => '事務所'],
            ['department_name' => 'デイサービス'],
            ['department_name' => '訪問介護'],
            ['department_name' => '居宅介護支援'],
            ['department_name' => '看護部'],
            ['department_name' => '栄養管理'],
            ['department_name' => '相談支援'],
        ];

        foreach ($departments as $department) {
            Department::create($department);
        }
    }
}
