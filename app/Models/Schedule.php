<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'date_id',
        'title',
        'description',
        'start_time',
        'end_time',
        'all_day',
        'schedule_type_id',
        'resident_id',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'all_day' => 'boolean',
        ];
    }

    public function calendarDate()
    {
        return $this->belongsTo(CalendarDate::class, 'date_id');
    }

    public function scheduleType()
    {
        return $this->belongsTo(ScheduleType::class);
    }

    public function resident()
    {
        return $this->belongsTo(Resident::class);
    }

    public function scopeForDate($query, $date)
    {
        return $query->whereHas('calendarDate', function ($q) use ($date) {
            $q->where('calendar_date', $date);
        });
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereHas('calendarDate', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('calendar_date', [$startDate, $endDate]);
        });
    }

    public function scopeWithRelations($query)
    {
        return $query->with(['calendarDate', 'scheduleType', 'resident']);
    }
}
