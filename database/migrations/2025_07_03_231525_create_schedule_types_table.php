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
        Schema::create('schedule_types', function (Blueprint $table) {
            $table->id();
            $table->string('type_name');
            $table->string('color_code', 7)->default('#FF5733');
            $table->timestamps();
            
            $table->index('type_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_types');
    }
};
