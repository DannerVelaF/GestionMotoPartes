<?php

namespace App\Http\Services\Settings;

use App\Http\Repositories\Eloquent\Settings\BusinessConfigRepository;
use App\Http\Services\BaseService;

class BusinessConfigService extends BaseService
{

    public function __construct(BusinessConfigRepository $repo)
    {
        parent::__construct($repo);
    }
    public function updateSettings(array $data)
    {
        // Buscamos el primer registro (usualmente el único con ID 1)
        $config = $this->repo->all()->first();

        if ($config) {
            return $this->repo->update($config->id_business_config, $data);
        }

        return $this->repo->create($data);
    }
}
