<?php

namespace App\Http\Repositories\Eloquent\Settings;

use App\Http\Repositories\Contracts\Settings\BusinessConfigRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\BusinessConfig;

class BusinessConfigRepository extends BaseRepository implements BusinessConfigRepositoryInterface
{
    public function __construct(BusinessConfig $model){
        parent::__construct($model);
    }
}
