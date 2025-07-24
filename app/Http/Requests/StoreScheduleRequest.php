<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Schedule;

class StoreScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date_id' => ['required', 'exists:calendar_dates,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'schedule_type_id' => ['required', 'exists:schedule_types,id'],
            'resident_id' => ['required', 'exists:residents,id'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->hasTimeConflict()) {
                $validator->errors()->add('time_conflict', '指定された時間帯に既にスケジュールが存在します。');
            }
        });
    }

    private function hasTimeConflict(): bool
    {
        if (!$this->filled(['date_id', 'start_time', 'end_time', 'resident_id'])) {
            return false;
        }

        return Schedule::where('date_id', $this->date_id)
            ->where('resident_id', $this->resident_id)
            ->where(function ($query) {
                $query->whereBetween('start_time', [$this->start_time, $this->end_time])
                      ->orWhereBetween('end_time', [$this->start_time, $this->end_time])
                      ->orWhere(function ($q) {
                          $q->where('start_time', '<=', $this->start_time)
                            ->where('end_time', '>=', $this->end_time);
                      });
            })
            ->exists();
    }
}
