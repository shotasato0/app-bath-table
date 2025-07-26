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

    public function messages(): array
    {
        return [
            'date_id.required' => '日付を選択してください。',
            'date_id.exists' => '有効な日付を選択してください。',
            'title.required' => 'タイトルを入力してください。',
            'title.max' => 'タイトルは255文字以内で入力してください。',
            'description.max' => '説明は1000文字以内で入力してください。',
            'start_time.required' => '開始時刻を入力してください。',
            'start_time.date_format' => '開始時刻は時:00の形式で入力してください。',
            'end_time.required' => '終了時刻を入力してください。',
            'end_time.date_format' => '終了時刻は時:00の形式で入力してください。',
            'end_time.after' => '終了時刻は開始時刻より後に設定してください。',
            'schedule_type_id.required' => 'スケジュールタイプを選択してください。',
            'schedule_type_id.exists' => '有効なスケジュールタイプを選択してください。',
            'resident_id.required' => '入居者を選択してください。',
            'resident_id.exists' => '有効な入居者を選択してください。',
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
                $query->where(function ($q) {
                    // 既存スケジュールの開始時刻が新規の時間範囲内（境界除く）
                    $q->where('start_time', '>', $this->start_time)
                      ->where('start_time', '<', $this->end_time);
                })
                ->orWhere(function ($q) {
                    // 既存スケジュールの終了時刻が新規の時間範囲内（境界除く）
                    $q->where('end_time', '>', $this->start_time)
                      ->where('end_time', '<', $this->end_time);
                })
                ->orWhere(function ($q) {
                    // 既存スケジュールが新規スケジュールを完全に包含
                    $q->where('start_time', '<=', $this->start_time)
                      ->where('end_time', '>=', $this->end_time);
                })
                ->orWhere(function ($q) {
                    // 新規スケジュールが既存スケジュールを完全に包含
                    $q->where('start_time', '>', $this->start_time)
                      ->where('end_time', '<', $this->end_time);
                });
            })
            ->exists();
    }
}
