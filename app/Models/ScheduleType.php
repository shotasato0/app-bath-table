<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ScheduleType extends Model
{
    use HasFactory;

    protected $fillable = [
        'type_name',
        'color_code',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}
