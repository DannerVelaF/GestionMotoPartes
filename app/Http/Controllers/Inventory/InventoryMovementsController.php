<?php

namespace App\Http\Controllers\Inventory;

use App\Exports\InventoryExport;
use App\Exports\KardexExport;
use App\Http\Controllers\Controller;
use App\Models\BusinessConfig;
use App\Models\InventoryMovements;
use App\Models\Products;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class InventoryMovementsController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        // 1. Preparamos la consulta base
        $query = Products::query()
            ->where('status', 'active')
            ->when($search, function ($q, $search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('product_code', 'like', "%{$search}%");
            });

        // 2. Lógica de Paginación Dinámica Inicial
        // Si el usuario no ha movido el selector de 'per_page', calculamos el default
        if (!$request->has('per_page')) {
            $totalCount = (clone $query)->count();
            // Si hay más de 20, ponemos 20. Si hay menos, ponemos el total para que no salga paginado.
            $perPage = ($totalCount > 20) ? 20 : max($totalCount, 1);
        } else {
            $perPage = $request->input('per_page');
        }

        // Validación de seguridad para perPage
        if (!is_numeric($perPage) || $perPage < 1) {
            $perPage = 20;
        }

        $inventory = $query->orderBy('stock', 'asc')
            ->paginate((int)$perPage)
            ->withQueryString();

        return Inertia::render('Inventory/ListInventory', [
            'inventory' => $inventory,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage
            ]
        ]);
    }

    public function export(Request $request)
    {
        $all = $request->boolean('all'); // Recibe el flag de selección total
        $ids = $request->input('ids');
        $search = $request->input('search');

        $query = Products::query()->where('status', 'active');

        // Lógica de filtrado
        if ($all) {
            // Si es "Todo", aplicamos el filtro de búsqueda que tenía el usuario
            $query->when($search, function ($q, $search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('product_code', 'like', "%{$search}%");
            });
        } else {
            // Si no es todo, filtramos solo por los IDs seleccionados
            if (!$ids) return back();
            $query->whereIn('id_product', $ids);
        }

        $products = $query->get();

        // Configuración de BusinessConfig
        $config = BusinessConfig::first();
        $companyName = $config ? $config->company_name : 'Empresa';
        $safeName = str_replace(' ', '_', strtolower($companyName));
        $fileName = "inventario_{$safeName}_" . now()->format('Ymd_His') . ".xlsx";

        return Excel::download(new InventoryExport($products, $companyName), $fileName);
    }

    public function movements(Request $request)
    {
        $search = $request->input('search');
        $type = $request->input('type');

        $query = InventoryMovements::query()
            ->with(['product:id_product,product_name,product_code', 'user:id,name'])
            ->when($search, function ($q, $search) {
                $q->whereHas('product', function ($pq) use ($search) {
                    $pq->where('product_name', 'like', "%{$search}%")
                        ->orWhere('product_code', 'like', "%{$search}%");
                });
            })
            ->when($type, function ($q, $type) {
                $q->where('type', $type);
            });

        // Lógica dinámica inicial de paginación
        if (!$request->has('per_page')) {
            $totalCount = (clone $query)->count();
            $perPage = ($totalCount > 25) ? 25 : max($totalCount, 1);
        } else {
            $perPage = $request->input('per_page');
        }

        if (!is_numeric($perPage) || $perPage < 1) $perPage = 25;

        $movements = $query->orderBy('created_at', 'desc')
            ->paginate((int)$perPage)
            ->withQueryString();

        return Inertia::render('Inventory/Reports/GlobalMovements', [
            'movements' => $movements,
            'filters' => [
                'search' => $search,
                'per_page' => (int)$perPage,
                'type' => $type
            ]
        ]);
    }
    public function exportKardex(Request $request)
    {
        $all = $request->boolean('all');
        $ids = $request->input('ids');

        $query = InventoryMovements::with('product');

        if (!$all) {
            $query->whereIn('id_product', $ids);
        }

        $movements = $query->orderBy('id_product')
            ->orderBy('created_at', 'asc')
            ->orderBy('id_movement', 'asc')
            ->get();

        $config = BusinessConfig::first();
        $companyName = $config ? $config->company_name : 'Empresa';

        return Excel::download(new KardexExport($movements, $companyName), "kardex_" . now()->format('Ymd') . ".xlsx");
    }
}
