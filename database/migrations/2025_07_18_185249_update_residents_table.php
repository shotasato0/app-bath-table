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
        Schema::table('residents', function (Blueprint $table) {
            $table->integer('age')->nullable()->after('birth_date');
            $table->string('room_number')->nullable()->after('age');
            $table->string('care_level')->nullable()->after('room_number');
            $table->enum('status', ['active', 'inactive', 'medical_care', 'temporary_leave'])->default('active')->after('care_level');
            $table->text('special_requirements')->nullable()->after('medical_notes');
            $table->foreignId('primary_staff_id')->nullable()->after('special_requirements')->constrained('users')->onDelete('set null');
            
            $table->index('room_number');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            $table->dropForeign(['primary_staff_id']);
            $table->dropIndex(['room_number']);
            $table->dropIndex(['status']);
            $table->dropColumn(['age', 'room_number', 'care_level', 'status', 'special_requirements', 'primary_staff_id']);
        });
    }
};