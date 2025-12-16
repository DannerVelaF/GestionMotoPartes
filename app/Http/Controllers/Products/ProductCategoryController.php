<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Http\Services\Products\ProductCategoryService;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use App\Enums\GenericStatus;
use Illuminate\Support\Str;

class ProductCategoryController extends Controller
{
    protected $service;

    public function __construct(ProductCategoryService $service)
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

        $categories = ProductCategory::query()
            ->when($search, function ($query, $search) {
                $query->where('name_product_category', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate((int)$perPage)
            ->withQueryString();

        return Inertia::render("Products/Categories/ListCategories", [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render("Products/Categories/CreateCategory");
    }

    public function store(Request $request)
    {
        $request->merge(['name_product_category' => Str::lower($request->name_product_category)]);

        // 1. Reglas
        $rules = [
            'name_product_category' => 'required|string|max:255|unique:product_categories,name_product_category',
            'status' => ['required', Rule::enum(GenericStatus::class)],
        ];

        // 2. Mensajes en Español
        $messages = [
            'name_product_category.required' => 'El nombre de la categoría es obligatorio.',
            'name_product_category.unique'   => 'Esta categoría ya se encuentra registrada.',
            'name_product_category.max'      => 'El nombre no puede tener más de 255 caracteres.',
            'status.required'                => 'El estado es obligatorio.',
            'status.enum'                    => 'El estado seleccionado no es válido.'
        ];

        // 3. Validación
        $validatedData = $request->validate($rules, $messages);

        $category = $this->service->createProductCategory($validatedData);

        return to_route('product-categories.show', $category->id_product_category)
            ->with('success', 'Categoría creada correctamente.');
    }

    public function show($id)
    {
        $category = \App\Models\ProductCategory::findOrFail($id);

        return Inertia::render("Products/Categories/EditCategory", [
            'category' => $category
        ]);
    }

    public function update(Request $request, $id)
    {
        $category = \App\Models\ProductCategory::findOrFail($id);

        $request->merge(['name_product_category' => Str::lower($request->name_product_category)]);

        // 1. Reglas
        $rules = [
            'name_product_category' => [
                'required',
                'string',
                'max:255',
                Rule::unique('product_categories', 'name_product_category')->ignore($category->id_product_category, 'id_product_category')
            ],
            'status' => ['required', Rule::enum(GenericStatus::class)],
        ];

        // 2. Mensajes en Español
        $messages = [
            'name_product_category.required' => 'El nombre de la categoría es obligatorio.',
            'name_product_category.unique'   => 'Esta categoría ya se encuentra registrada.',
            'name_product_category.max'      => 'El nombre no puede tener más de 255 caracteres.',
            'status.required'                => 'El estado es obligatorio.',
            'status.enum'                    => 'El estado seleccionado no es válido.'
        ];

        $validatedData = $request->validate($rules, $messages);

        $category->update($validatedData);

        return back()->with('success', 'Categoría actualizada correctamente.');
    }

    public function destroy($id)
    {
        $this->service->deleteProductCategory($id);

        return to_route('product-categories.index')
            ->with('success', 'Categoría eliminada correctamente.');
    }

    public function bulkDestroy(Request $request)
    {
        // Mensajes personalizados para la eliminación masiva
        $messages = [
            'ids.required' => 'Debes seleccionar al menos un registro.',
            'ids.array'    => 'Formato de datos inválido.',
            'ids.*.exists' => 'Uno de los registros seleccionados no existe.'
        ];

        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:product_categories,id_product_category'
        ], $messages);

        $this->service->deleteProductCategories($data['ids']);

        return back()->with('success', 'Registros seleccionados eliminados.');
    }
}
