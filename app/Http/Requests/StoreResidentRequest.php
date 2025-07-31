<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreResidentRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', 'in:male,female,other'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'medical_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => '名前は必須です',
            'name.max' => '名前は255文字以内で入力してください',
            'gender.in' => '性別は男性、女性、その他から選択してください',
            'birth_date.date' => '有効な生年月日を入力してください',
            'birth_date.before' => '生年月日は今日より前の日付を入力してください',
            'medical_notes.max' => '医療メモは1000文字以内で入力してください',
        ];
    }
}