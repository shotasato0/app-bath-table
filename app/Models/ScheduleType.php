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
    ];

    protected function casts(): array
    {
        return [];
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}
