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
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->after('id');
            $table->enum('role', ['admin', 'care_worker', 'nurse', 'manager', 'staff', 'care_manager', 'nutritionist'])->after('name');
            $table->foreignId('department_id')->nullable()->after('role')->constrained('departments')->onDelete('set null');
            $table->string('email')->nullable()->change();
            
            $table->index('username');
            $table->index('role');
            $table->index('department_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropIndex(['username']);
            $table->dropIndex(['role']);
            $table->dropIndex(['department_id']);
            
            $table->dropColumn(['username', 'role', 'department_id']);
            $table->string('email')->nullable(false)->change();
        });
    }
};
