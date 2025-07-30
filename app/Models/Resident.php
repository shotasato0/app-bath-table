<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Resident extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'gender',
        'birth_date',
        'medical_notes',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    // リレーション
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    // スコープ
    public function scopeWithRelations($query)
    {
        return $query->withCount('schedules');
    }

    public function scopeActive($query)
    {
        return $query->whereNotNull('name');
    }

    // アクセサ
    public function getRoomNumberAttribute()
    {
        // 将来的に部屋番号フィールドを追加する場合の準備
        return $this->room ?? null;
    }

    public function getAgeAttribute()
    {
        return $this->birth_date ? $this->birth_date->age : null;
    }
}
