<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessConfig extends Model
{
    protected $table = 'business_configs';
    protected $primaryKey = 'id_business_config';

    protected $fillable = [
        'company_name',
        'ruc',
        'address',
        'phone',
        'email',
        'city',
        'ticket_footer',
        'api_service_token',
        'api_service_url',
        "logo_path"
    ];

    protected function casts(): array
    {
        return [
            'api_service_token' => 'encrypted',
        ];
    }
}
