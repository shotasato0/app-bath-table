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
        'age',
        'room_number',
        'care_level',
        'status',
        'medical_notes',
        'special_requirements',
        'primary_staff_id',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function primaryStaff()
    {
        return $this->belongsTo(User::class, 'primary_staff_id');
    }
}
