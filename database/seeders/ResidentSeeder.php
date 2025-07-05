<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Resident;

class ResidentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $residents = [
            [
                'name' => '田中花子',
                'gender' => 'female',
                'birth_date' => '1935-03-15',
                'medical_notes' => '高血圧のため血圧測定必要。塩分制限中。'
            ],
            [
                'name' => '佐藤太郎',
                'gender' => 'male',
                'birth_date' => '1940-07-22',
                'medical_notes' => '糖尿病のため血糖値管理必要。インスリン注射あり。'
            ],
            [
                'name' => '鈴木みどり',
                'gender' => 'female',
                'birth_date' => '1938-12-08',
                'medical_notes' => '認知症のため見守り強化。徘徊傾向あり。'
            ],
            [
                'name' => '山田一郎',
                'gender' => 'male',
                'birth_date' => '1942-05-30',
                'medical_notes' => '脳梗塞後遺症。左半身麻痺あり。車椅子使用。'
            ],
            [
                'name' => '高橋ヨシ子',
                'gender' => 'female',
                'birth_date' => '1945-01-18',
                'medical_notes' => '心疾患のため激しい運動は禁止。ペースメーカー装着。'
            ],
            [
                'name' => '伊藤健二',
                'gender' => 'male',
                'birth_date' => '1943-09-12',
                'medical_notes' => '腎臓機能低下のため水分制限あり。週3回透析。'
            ],
            [
                'name' => '渡辺美香',
                'gender' => 'female',
                'birth_date' => '1941-11-25',
                'medical_notes' => '骨粗鬆症のため転倒注意。歩行器使用。'
            ],
            [
                'name' => '中村正夫',
                'gender' => 'male',
                'birth_date' => '1939-04-03',
                'medical_notes' => '難聴のため大きな声でのコミュニケーション必要。'
            ],
            [
                'name' => '小林さくら',
                'gender' => 'female',
                'birth_date' => '1944-08-14',
                'medical_notes' => '関節リウマチのため関節可動域に制限あり。'
            ],
            [
                'name' => '加藤次郎',
                'gender' => 'male',
                'birth_date' => '1937-06-07',
                'medical_notes' => 'パーキンソン病のため動作緩慢。服薬管理必要。'
            ],
        ];

        foreach ($residents as $resident) {
            Resident::create($resident);
        }
    }
}
