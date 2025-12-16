<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Http\Services\Products\ProductTypeService;
use App\Models\ProductType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use App\Enums\GenericStatus;
use Illuminate\Support\Str;

class ProductTypeController extends Controller
{
    protected $service;

    public function __construct(ProductTypeService $service)
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

        $types = ProductType::query()
            ->when($search, function ($query, $search) {
                $query->where('name_product_type', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate((int)$perPage)
            ->withQueryString();

        return Inertia::render("Products/TypeProducts/ListTypes", [
            'types' => $types,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render("Products/TypeProducts/CreateType");
    }

    public function store(Request $request)
    {
        $request->merge(['name_product_type' => Str::lower($request->name_product_type)]);

        // Reglas
        $rules = [
            'name_product_type' => 'required|string|max:255|unique:product_types,name_product_type',
            'status' => ['required', Rule::enum(GenericStatus::class)],
        ];

        // Mensajes en Español
        $messages = [
            'name_product_type.required' => 'El nombre del tipo de producto es obligatorio.',
            'name_product_type.unique'   => 'Este tipo de producto ya existe.',
            'name_product_type.max'      => 'El nombre no puede exceder los 255 caracteres.',
            'status.required'            => 'El estado es obligatorio.',
            'status.enum'                => 'El estado seleccionado no es válido.'
        ];

        $validatedData = $request->validate($rules, $messages);

        // Llamada al servicio
        $type = $this->service->createProductType($validatedData);

        return to_route('product-types.show', $type->id_product_type)
            ->with('success', 'Tipo de producto creado correctamente.');
    }

    public function show($id)
    {
        $type = ProductType::findOrFail($id);

        return Inertia::render("Products/TypeProducts/EditType", [
            'type' => $type
        ]);
    }

    public function update(Request $request, $id)
    {
        $type = ProductType::findOrFail($id);

        $request->merge(['name_product_type' => Str::lower($request->name_product_type)]);

        $rules = [
            'name_product_type' => [
                'required',
                'string',
                'max:255',
                Rule::unique('product_types', 'name_product_type')->ignore($type->id_product_type, 'id_product_type')
            ],
            'status' => ['required', Rule::enum(GenericStatus::class)],
        ];

        $messages = [
            'name_product_type.required' => 'El nombre del tipo de producto es obligatorio.',
            'name_product_type.unique'   => 'Este tipo de producto ya existe.',
            'name_product_type.max'      => 'El nombre no puede exceder los 255 caracteres.',
        ];

        $validatedData = $request->validate($rules, $messages);

        $type->update($validatedData);

        return back()->with('success', 'Tipo de producto actualizado correctamente.');
    }

    public function destroy($id)
    {
        $this->service->deleteProductType($id);

        return to_route('product-types.index')
            ->with('success', 'Tipo de producto eliminado correctamente.');
    }

    public function bulkDestroy(Request $request)
    {
        $messages = [
            'ids.required' => 'Debes seleccionar al menos un registro.',
            'ids.array'    => 'Formato de datos inválido.',
            'ids.*.exists' => 'Uno de los registros seleccionados no existe.'
        ];

        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:product_types,id_product_type'
        ], $messages);

        $this->service->deleteProductTypes($data['ids']);

        return back()->with('success', 'Registros seleccionados eliminados.');
    }
}
