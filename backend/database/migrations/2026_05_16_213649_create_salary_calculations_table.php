<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('salary_calculations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('worked_days');
            $table->decimal('day_rate', 8, 2);
            $table->decimal('gross_amount', 12, 4);
            $table->decimal('rcar_rate', 5, 2)->default(6.00);
            $table->decimal('rcar_amount', 12, 4);
            $table->decimal('net_amount', 12, 4);
            $table->timestamp('calculated_at');
            $table->timestamps();

            $table->unique('application_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('salary_calculations');
    }
};
