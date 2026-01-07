<?php

namespace App\Http\Controllers\Receipt;

use App\Exports\SupplierTemplateExport;
use App\Http\Controllers\Controller;
use App\Http\Services\Receipt\SupplierService;
use App\Imports\SuppliersImport;
use App\Models\BusinessConfig;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // Importante para las transacciones
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class SupplierController extends Controller
{
    protected $service;

    public function __construct(SupplierService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $search = $request->input('search');

        $perPage = $request->input('per_page', 20);
        if (!is_numeric($perPage) || $perPage < 1) {
            $perPage = 20;
        }

        $suppliers = Supplier::query()
            ->when($search, function ($query, $search) {
                $query->where("suppliers.company_name", "like", "%{$search}%");
                $query->orWhere("suppliers.ruc", "like", "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate((int)$perPage)
            ->withQueryString();

        return Inertia::render("Receipts/Suppliers/LIstSuppliers", [
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render("Receipts/Suppliers/CreateSupplier");
    }

    public function store(Request $request)
    {
        // Normalización
        $request->merge([
            'company_name' => Str::upper($request->company_name),
            'supplier_email' => Str::lower($request->supplier_email),
        ]);

        // 1. Definir Reglas
        $rules = [
            'type' => 'required|in:nacional,extranjero',
            'company_name'   => 'required|string|max:255',
            'supplier_name'  => 'nullable|string|max:255',
            'supplier_email' => 'nullable|email|max:255|unique:suppliers,supplier_email',
            'supplier_phone' => 'nullable|string|max:20',
            'ruc' => [
                'required',
                'string',
                'unique:suppliers,ruc',
                // Si es PERÚ (Nacional): 11 dígitos numéricos
                Rule::when($request->type === 'nacional', ['digits:11', 'numeric']),
                // Si es EXTRANJERO: Hasta 25 caracteres (letras, guiones, números)
                Rule::when($request->type === 'extranjero', ['max:25']),
            ],
        ];

        // 2. Definir Mensajes
        $messages = [
            'company_name.required'  => 'La razón social es obligatoria.',
            'ruc.required' => 'El RUC o Tax ID es obligatorio.',
            'ruc.digits' => 'Para proveedores nacionales, el RUC debe tener 11 dígitos.',
            'ruc.unique' => 'Este número de identificación ya está registrado.',
            'supplier_email.email'   => 'El formato del correo electrónico no es válido.',
            'supplier_email.unique'  => 'Este correo electrónico ya está registrado con otro proveedor.',
        ];

        // 3. Validar
        $validatedData = $request->validate($rules, $messages);

        // 4. Transacción de Base de Datos
        try {
            $supplier = DB::transaction(function () use ($validatedData) {
                // Aquí llamamos al servicio. Si el servicio falla, se hace rollback automático.
                return $this->service->createSupplier($validatedData);
            });

            return to_route("suppliers.show", $supplier->id_supplier)
                ->with('success', 'Proveedor creado correctamente.');
        } catch (\Exception $e) {
            // Log del error si es necesario: Log::error($e->getMessage());
            return back()->withErrors(['error' => 'Ocurrió un error al guardar el proveedor: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $supplier = Supplier::findOrFail($id);

        return Inertia::render("Receipts/Suppliers/EditSupplier", [
            'supplier' => $supplier
        ]);
    }

    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);

        $request->merge([
            'company_name' => Str::upper($request->company_name),
            'supplier_email' => Str::lower($request->supplier_email),
        ]);

        $rules = [
            'type' => 'required|in:nacional,extranjero',
            'company_name' => 'required|string|max:255',
            'supplier_name' => 'nullable|string|max:255',
            'supplier_phone' => 'nullable|string|max:20',
            'supplier_email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('suppliers', 'supplier_email')->ignore($supplier->id_supplier, 'id_supplier')
            ],
            'ruc' => [
                'required',
                'string',
                Rule::unique('suppliers', 'ruc')->ignore($supplier->id_supplier, 'id_supplier'),
                // Misma lógica condicional
                Rule::when($request->type === 'nacional', ['digits:11', 'numeric']),
                Rule::when($request->type === 'extranjero', ['max:25']),
            ],
        ];

        $messages = [
            'company_name.required' => 'La razón social es obligatoria.',
            'ruc.required'          => 'El RUC es obligatorio.',
            'ruc.digits'            => 'El RUC debe tener exactamente 11 dígitos.',
            'ruc.unique'            => 'Este RUC ya pertenece a otro proveedor.',
            'supplier_email.email'  => 'El formato del correo electrónico no es válido.',
            'supplier_email.unique' => 'Este correo electrónico ya pertenece a otro proveedor.',
        ];

        $validatedData = $request->validate($rules, $messages);

        try {
            DB::transaction(function () use ($supplier, $validatedData) {
                // CORRECCIÓN: Usamos $supplier->update(), no $this->update()
                // Si tu lógica compleja está en el servicio, usa:
                $supplier->update($validatedData);
            });

            return back()->with('success', 'Proveedor actualizado correctamente.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al actualizar: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $this->service->deleteSupplier($id);
            });

            return to_route('suppliers.index')
                ->with('success', 'Proveedor eliminado correctamente.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'No se pudo eliminar el proveedor. Verifique que no tenga compras asociadas.']);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:suppliers,id_supplier'
        ]);
        $this->service->deleteSuppliers($data['ids']);

        return back()->with('success', 'Registros seleccionados eliminados.');
    }

    public function template()
    {
        return Excel::download(new SupplierTemplateExport, 'plantilla_proveedores.xlsx');
    }

    public function import(Request $request)
    {
        // Aumentar tiempo de ejecución a 5 minutos (300 segundos) para dar tiempo a las APIs
        set_time_limit(300);

        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:2048',
        ]);

        try {
            $import = new SuppliersImport;

            // Importa el archivo
            Excel::import($import, $request->file('file'));

            if ($import->rows === 0) {
                return back()->withErrors(['error' => 'El archivo subido está vacío o no contiene registros válidos.']);
            }

            return back()->with('success', 'Proveedores importados correctamente (' . $import->rows . ' registros).');
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            // ... (Tu código de manejo de errores de validación igual que antes) ...
            $failures = $e->failures();
            $errorMessages = [];

            foreach ($failures as $failure) {
                $row = $failure->row();
                $attribute = $failure->attribute();
                $errors = $failure->errors();
                $errorMessages[] = "Fila {$row}: " . implode(', ', $errors);
            }

            $displayErrors = array_slice($errorMessages, 0, 3);
            if (count($errorMessages) > 3) {
                $displayErrors[] = '... y ' . (count($errorMessages) - 3) . ' errores más.';
            }

            return back()->withErrors(['error' => implode("\n", $displayErrors)]);
        } catch (\Exception $e) {
            // Aquí caerá el error manual que lanzamos en el Import si la API no encuentra el nombre
            Log::error($e->getMessage());
            // Mostramos el mensaje exacto de la excepción (ej: "El RUC ... no tiene Razón Social...")
            return back()->withErrors(['error' => 'Error en la importación: ' . $e->getMessage()]);
        }
    }


    public function buscarSunatProveedor(Request $request)
    {
        $ruc = $request->input('numero');
        if (!$ruc) return response()->json(['error' => 'RUC requerido'], 400);

        // Usamos el servicio centralizado
        $razonSocial = $this->service->getRazonSocialFromSunat($ruc);

        if ($razonSocial) {
            return response()->json(['razon_social' => $razonSocial]);
        }

        return response()->json(['error' => 'No encontrado en SUNAT'], 404);
    }
}
