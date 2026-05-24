<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_id',
        'application_id',
        'start_date',
        'end_date',
        'worked_days',
        'non_working_days',
        'mandatory_pause_start',
        'mandatory_pause_end',
        'is_compliant',
        'compliance_note',
        'is_completed',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'mandatory_pause_start' => 'date',
        'mandatory_pause_end' => 'date',
        'is_compliant' => 'boolean',
        'is_completed' => 'boolean',
    ];

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
