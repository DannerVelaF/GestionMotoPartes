<?php

namespace App\Http\Services\Receipt;

use App\Http\Repositories\Eloquent\Receipt\SupplierRepository;
use App\Http\Services\BaseService;

class SupplierService extends BaseService
{

    public function __construct(SupplierRepository $repo)
    {
        parent::__construct($repo);
    }

    public function createSupplier(array $data){
        return $this->repo->create($data);
    }

    public function updateSupplier(array $data){
        return $this->repo->update($data);
    }

    public function deleteSupplier($id){
        return $this->repo->delete($id);
    }

    public function getSupplierById($id){
        return $this->repo->find($id);
    }

    public function deleteSuppliers($ids){
        return $this->repo->deleteMany($ids);
    }

    public function getRazonSocialFromSunat($ruc)
    {
        $config = \App\Models\BusinessConfig::first();

        try {
            $response = \Illuminate\Support\Facades\Http::withToken($config->api_service_token)
                ->timeout(10)
                ->get($config->api_service_url, ['numero' => $ruc]);

            if ($response->successful()) {
                return $response->json()['razon_social'] ?? null;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error importando RUC {$ruc}: " . $e->getMessage());
        }

        return null;
    }

}
