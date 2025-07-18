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
        'schedule_type_id',
        'resident_id',
        'date',
        'type',
        'column_type',
        'priority',
        'status',
        'location',
        'notes',
        'created_by',
        'updated_by',
        'staff_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
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

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
