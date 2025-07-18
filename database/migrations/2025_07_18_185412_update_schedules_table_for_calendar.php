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
        Schema::table('schedules', function (Blueprint $table) {
            // 新しいカラムを追加
            $table->date('date')->nullable()->after('resident_id');
            $table->enum('type', ['general', 'bathing', 'medical', 'activity', 'meal'])->default('general')->after('end_time');
            $table->enum('column_type', ['general', 'bathing', 'medical', 'activity'])->default('general')->after('type');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium')->after('column_type');
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled')->after('priority');
            $table->string('location')->nullable()->after('status');
            $table->text('notes')->nullable()->after('location');
            $table->foreignId('created_by')->nullable()->after('notes')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->onDelete('set null');
            $table->foreignId('staff_id')->nullable()->after('updated_by')->constrained('users')->onDelete('set null');
            
            // インデックスを追加
            $table->index(['date', 'start_time']);
            $table->index(['resident_id', 'date']);
            $table->index(['staff_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
            $table->dropForeign(['staff_id']);
            $table->dropIndex(['date', 'start_time']);
            $table->dropIndex(['resident_id', 'date']);
            $table->dropIndex(['staff_id', 'date']);
            $table->dropColumn(['date', 'type', 'column_type', 'priority', 'status', 'location', 'notes', 'created_by', 'updated_by', 'staff_id']);
        });
    }
};