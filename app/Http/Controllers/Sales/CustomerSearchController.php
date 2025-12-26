<?php

namespace App\Http\Controllers;

use App\Http\Services\Receipt\SupplierService;
use Illuminate\Http\Request;

class CustomerSearchController extends Controller
{
    protected $service;

    public function __construct(SupplierService $service)
    {
        $this->service = $service;
    }

    public function searchCustomer($documento)
    {
        $len = strlen($documento);
        $nombre = null;

        if ($len === 8) {
            $nombre = $this->service->getClienteFromReniec($documento);
        } elseif ($len === 11) {
            $nombre = $this->service->getRazonSocialFromSunat($documento);
        }

        return $nombre
            ? response()->json(['success' => true, 'nombre' => $nombre])
            : response()->json(['success' => false, 'message' => 'No encontrado'], 404);
    }
}
