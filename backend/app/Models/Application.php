<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Application extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_RH_REVIEW = 'rh_review';
    public const STATUS_PRESIDENT_REVIEW = 'president_review';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_FINALIZED = 'finalized';
    public const STATUS_ON_HOLD = 'on_hold';

    protected $fillable = [
        'candidate_id',
        'reference',
        'season_label',
        'desired_position',
        'requested_start_date',
        'requested_end_date',
        'status',
        'current_step',
        'days_requested',
        'age_at_submission',
        'is_age_eligible',
        'requires_consultation',
        'alerts',
        'rh_decision_note',
        'president_comment',
        'submitted_at',
        'rh_reviewed_at',
        'president_reviewed_at',
        'finalized_at',
    ];

    protected $casts = [
        'requested_start_date' => 'date',
        'requested_end_date' => 'date',
        'is_age_eligible' => 'boolean',
        'requires_consultation' => 'boolean',
        'alerts' => 'array',
        'submitted_at' => 'datetime',
        'rh_reviewed_at' => 'datetime',
        'president_reviewed_at' => 'datetime',
        'finalized_at' => 'datetime',
    ];

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function uploadedDocuments(): HasMany
    {
        return $this->hasMany(UploadedDocument::class);
    }

    public function workPeriods(): HasMany
    {
        return $this->hasMany(WorkPeriod::class);
    }

    public function salaryCalculation(): HasOne
    {
        return $this->hasOne(SalaryCalculation::class);
    }

    public function administrativeDocuments(): HasMany
    {
        return $this->hasMany(AdministrativeDocument::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function affectation(): HasOne
    {
        return $this->hasOne(Affectation::class);
    }
}
