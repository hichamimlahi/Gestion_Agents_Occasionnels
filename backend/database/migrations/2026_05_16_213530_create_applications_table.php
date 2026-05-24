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
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained()->cascadeOnDelete();
            $table->string('reference')->unique();
            $table->string('season_label')->nullable();
            $table->date('requested_start_date')->nullable();
            $table->date('requested_end_date')->nullable();
            $table->enum('status', [
                'draft',
                'submitted',
                'rh_review',
                'president_review',
                'approved',
                'rejected',
                'finalized',
                'on_hold',
            ])->default('draft');
            $table->string('current_step')->default('dossier');
            $table->unsignedSmallInteger('days_requested')->default(0);
            $table->unsignedTinyInteger('age_at_submission')->nullable();
            $table->boolean('is_age_eligible')->default(true);
            $table->boolean('requires_consultation')->default(false);
            $table->json('alerts')->nullable();
            $table->text('rh_decision_note')->nullable();
            $table->text('president_comment')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('rh_reviewed_at')->nullable();
            $table->timestamp('president_reviewed_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('applications');
    }
};
