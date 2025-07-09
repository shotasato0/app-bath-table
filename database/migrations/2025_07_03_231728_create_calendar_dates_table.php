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
        Schema::create('calendar_dates', function (Blueprint $table) {
            $table->id();
            $table->date('calendar_date')->unique();
            $table->tinyInteger('day_of_week');
            $table->boolean('is_holiday')->default(false);
            $table->string('holiday_name')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('is_holiday');
            $table->index('day_of_week');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calendar_dates');
    }
};
