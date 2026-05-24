<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UploadedDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'candidate_id',
        'document_type',
        'original_name',
        'stored_path',
        'mime_type',
        'file_size',
        'validation_status',
        'validated_by',
        'validated_at',
        'rejection_reason',
    ];

    protected $casts = [
        'validated_at' => 'datetime',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
