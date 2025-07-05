<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            // 外部キー制約とインデックスを削除
            $table->dropForeign(['staff_id']);
            $table->dropIndex(['staff_id']);
        });
        
        Schema::table('permissions', function (Blueprint $table) {
            // カラム名を変更
            $table->renameColumn('staff_id', 'user_id');
        });
        
        Schema::table('permissions', function (Blueprint $table) {
            // 新しい外部キー制約とインデックスを追加
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            // 外部キー制約とインデックスを削除
            $table->dropForeign(['user_id']);
            $table->dropIndex(['user_id']);
        });
        
        Schema::table('permissions', function (Blueprint $table) {
            // カラム名を元に戻す
            $table->renameColumn('user_id', 'staff_id');
        });
        
        Schema::table('permissions', function (Blueprint $table) {
            // 元の外部キー制約とインデックスを復元
            $table->foreign('staff_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('staff_id');
        });
    }
};