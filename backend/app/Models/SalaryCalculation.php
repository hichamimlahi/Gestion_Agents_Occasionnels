<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryCalculation extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'worked_days',
        'day_rate',
        'gross_amount',
        'rcar_rate',
        'rcar_amount',
        'net_amount',
        'calculated_at',
    ];

    protected $casts = [
        'calculated_at' => 'datetime',
        'day_rate' => 'float',
        'gross_amount' => 'float',
        'rcar_rate' => 'float',
        'rcar_amount' => 'float',
        'net_amount' => 'float',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
