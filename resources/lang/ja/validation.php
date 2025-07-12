<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => ':attributeを承認してください。',
    'accepted_if' => ':otherが:valueの場合、:attributeを承認してください。',
    'active_url' => ':attributeは有効なURLではありません。',
    'after' => ':attributeは:dateより後の日付を指定してください。',
    'after_or_equal' => ':attributeは:date以降の日付を指定してください。',
    'alpha' => ':attributeはアルファベットのみ使用できます。',
    'alpha_dash' => ':attributeはアルファベット、数字、ダッシュ(-)、アンダースコア(_)のみ使用できます。',
    'alpha_num' => ':attributeはアルファベットと数字のみ使用できます。',
    'array' => ':attributeは配列で指定してください。',
    'ascii' => ':attributeは半角英数字と記号のみ使用できます。',
    'before' => ':attributeは:dateより前の日付を指定してください。',
    'before_or_equal' => ':attributeは:date以前の日付を指定してください。',
    'between' => [
        'array' => ':attributeは:min個から:max個までの項目を指定してください。',
        'file' => ':attributeは:min KBから:max KBまでのファイルを指定してください。',
        'numeric' => ':attributeは:minから:maxまでの数値を指定してください。',
        'string' => ':attributeは:min文字から:max文字までで入力してください。',
    ],
    'boolean' => ':attributeはtrueかfalseを指定してください。',
    'can' => ':attributeに許可されていない値が含まれています。',
    'confirmed' => ':attributeと確認用の入力が一致しません。',
    'contains' => ':attributeに必要な値が含まれていません。',
    'current_password' => 'パスワードが正しくありません。',
    'date' => ':attributeは有効な日付ではありません。',
    'date_equals' => ':attributeは:dateと同じ日付を指定してください。',
    'date_format' => ':attributeは:format形式で入力してください。',
    'decimal' => ':attributeは:decimal桁の小数点数を指定してください。',
    'declined' => ':attributeを拒否してください。',
    'declined_if' => ':otherが:valueの場合、:attributeを拒否してください。',
    'different' => ':attributeと:otherには異なった値を指定してください。',
    'digits' => ':attributeは:digits桁で入力してください。',
    'digits_between' => ':attributeは:min桁から:max桁までで入力してください。',
    'dimensions' => ':attributeの画像サイズが無効です。',
    'distinct' => ':attributeに重複した値があります。',
    'doesnt_end_with' => ':attributeは:valuesのいずれかで終わってはいけません。',
    'doesnt_start_with' => ':attributeは:valuesのいずれかで始まってはいけません。',
    'email' => ':attributeには有効なメールアドレスを指定してください。',
    'ends_with' => ':attributeは:valuesのいずれかで終わらなければなりません。',
    'enum' => '選択された:attributeは無効です。',
    'exists' => '選択された:attributeは無効です。',
    'extensions' => ':attributeは:extensionsの拡張子を持つファイルを指定してください。',
    'file' => ':attributeはファイルを指定してください。',
    'filled' => ':attributeに値を入力してください。',
    'gt' => [
        'array' => ':attributeは:value個より多い項目を指定してください。',
        'file' => ':attributeは:value KBより大きいファイルを指定してください。',
        'numeric' => ':attributeは:valueより大きい値を指定してください。',
        'string' => ':attributeは:value文字より多く入力してください。',
    ],
    'gte' => [
        'array' => ':attributeは:value個以上の項目を指定してください。',
        'file' => ':attributeは:value KB以上のファイルを指定してください。',
        'numeric' => ':attributeは:value以上の値を指定してください。',
        'string' => ':attributeは:value文字以上で入力してください。',
    ],
    'hex_color' => ':attributeは有効な16進数カラーコードを指定してください。',
    'image' => ':attributeには画像ファイルを指定してください。',
    'in' => '選択された:attributeは無効です。',
    'in_array' => ':attributeは:otherに存在しません。',
    'integer' => ':attributeは整数で指定してください。',
    'ip' => ':attributeには有効なIPアドレスを指定してください。',
    'ipv4' => ':attributeには有効なIPv4アドレスを指定してください。',
    'ipv6' => ':attributeには有効なIPv6アドレスを指定してください。',
    'json' => ':attributeには有効なJSON文字列を指定してください。',
    'list' => ':attributeはリストである必要があります。',
    'lowercase' => ':attributeは小文字で入力してください。',
    'lt' => [
        'array' => ':attributeは:value個未満の項目を指定してください。',
        'file' => ':attributeは:value KB未満のファイルを指定してください。',
        'numeric' => ':attributeは:value未満の値を指定してください。',
        'string' => ':attributeは:value文字未満で入力してください。',
    ],
    'lte' => [
        'array' => ':attributeは:value個以下の項目を指定してください。',
        'file' => ':attributeは:value KB以下のファイルを指定してください。',
        'numeric' => ':attributeは:value以下の値を指定してください。',
        'string' => ':attributeは:value文字以下で入力してください。',
    ],
    'mac_address' => ':attributeには有効なMACアドレスを指定してください。',
    'max' => [
        'array' => ':attributeは:max個以下にしてください。',
        'file' => ':attributeは:max KB以下のファイルを指定してください。',
        'numeric' => ':attributeは:max以下の値を指定してください。',
        'string' => ':attributeは:max文字以下で入力してください。',
    ],
    'max_digits' => ':attributeは:max桁以下で入力してください。',
    'mimes' => ':attributeには:valuesタイプのファイルを指定してください。',
    'mimetypes' => ':attributeには:valuesタイプのファイルを指定してください。',
    'min' => [
        'array' => ':attributeは:min個以上指定してください。',
        'file' => ':attributeは:min KB以上のファイルを指定してください。',
        'numeric' => ':attributeは:min以上の値を指定してください。',
        'string' => ':attributeは:min文字以上で入力してください。',
    ],
    'min_digits' => ':attributeは:min桁以上で入力してください。',
    'missing' => ':attributeフィールドが不足しています。',
    'missing_if' => ':otherが:valueの場合、:attributeフィールドが不足しています。',
    'missing_unless' => ':otherが:valueでない場合、:attributeフィールドが不足しています。',
    'missing_with' => ':valuesが存在する場合、:attributeフィールドが不足しています。',
    'missing_with_all' => ':valuesが全て存在する場合、:attributeフィールドが不足しています。',
    'multiple_of' => ':attributeは:valueの倍数である必要があります。',
    'not_in' => '選択された:attributeは無効です。',
    'not_regex' => ':attributeの形式が無効です。',
    'numeric' => ':attributeには数字を指定してください。',
    'password' => [
        'letters' => ':attributeは少なくとも1つの文字を含む必要があります。',
        'mixed' => ':attributeは少なくとも1つの大文字と小文字を含む必要があります。',
        'numbers' => ':attributeは少なくとも1つの数字を含む必要があります。',
        'symbols' => ':attributeは少なくとも1つの記号を含む必要があります。',
        'uncompromised' => '指定された:attributeはデータ漏洩に含まれています。別の:attributeを選択してください。',
    ],
    'present' => ':attributeフィールドが存在している必要があります。',
    'present_if' => ':otherが:valueの場合、:attributeフィールドが存在している必要があります。',
    'present_unless' => ':otherが:valueでない場合、:attributeフィールドが存在している必要があります。',
    'present_with' => ':valuesが存在する場合、:attributeフィールドが存在している必要があります。',
    'present_with_all' => ':valuesが全て存在する場合、:attributeフィールドが存在している必要があります。',
    'prohibited' => ':attributeフィールドは禁止されています。',
    'prohibited_if' => ':otherが:valueの場合、:attributeフィールドは禁止されています。',
    'prohibited_unless' => ':otherが:valueでない場合、:attributeフィールドは禁止されています。',
    'prohibits' => ':attributeフィールドは:otherの存在を禁止しています。',
    'regex' => ':attributeの形式が無効です。',
    'required' => ':attributeは必須です。',
    'required_array_keys' => ':attributeフィールドには:valuesのエントリが含まれている必要があります。',
    'required_if' => ':otherが:valueの場合、:attributeも必須です。',
    'required_if_accepted' => ':otherが承認された場合、:attributeは必須です。',
    'required_if_declined' => ':otherが拒否された場合、:attributeは必須です。',
    'required_unless' => ':otherが:valueでない場合、:attributeを入力してください。',
    'required_with' => ':valuesを指定する場合は、:attributeも入力してください。',
    'required_with_all' => ':valuesを全て指定する場合は、:attributeも入力してください。',
    'required_without' => ':valuesを指定しない場合は、:attributeを入力してください。',
    'required_without_all' => ':valuesを全て指定しない場合は、:attributeを入力してください。',
    'same' => ':attributeと:otherには同じ値を入力してください。',
    'size' => [
        'array' => ':attributeは:size個指定してください。',
        'file' => ':attributeのファイルは:size KBにしてください。',
        'numeric' => ':attributeは:sizeを指定してください。',
        'string' => ':attributeは:size文字で入力してください。',
    ],
    'starts_with' => ':attributeは:valuesのいずれかで始まる必要があります。',
    'string' => ':attributeは文字列を指定してください。',
    'timezone' => ':attributeには有効なタイムゾーンを指定してください。',
    'unique' => ':attributeの値は既に存在しています。',
    'uploaded' => ':attributeのアップロードに失敗しました。',
    'uppercase' => ':attributeは大文字で入力してください。',
    'url' => ':attributeには有効なURLを指定してください。',
    'ulid' => ':attributeには有効なULIDを指定してください。',
    'uuid' => ':attributeには有効なUUIDを指定してください。',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom validation messages for attributes using the
    | convention "attribute.rule" to name the lines. This makes it quick to
    | specify a specific custom language line for a given attribute rule.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap our attribute placeholder
    | with something more reader friendly such as "E-Mail Address" instead
    | of "email". This simply helps us make our message more expressive.
    |
    */

    'attributes' => [
        'name' => '氏名',
        'username' => 'ユーザー名',
        'email' => 'メールアドレス',
        'password' => 'パスワード',
        'password_confirmation' => 'パスワード確認',
        'role' => '職種',
        'department_id' => '部署',
        'current_password' => '現在のパスワード',
    ],

];