<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CalendarDate extends Model
{
    use HasFactory;

    protected $fillable = [
        'calendar_date',
        'day_of_week',
        'is_holiday',
        'holiday_name',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'calendar_date' => 'date',
            'is_holiday' => 'boolean',
        ];
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'date_id');
    }

    public function scopeForMonth($query, $year, $month)
    {
        return $query->whereYear('calendar_date', $year)
                    ->whereMonth('calendar_date', $month);
    }

    public function scopeWithSchedules($query)
    {
        return $query->with(['schedules.scheduleType', 'schedules.resident']);
    }
}
