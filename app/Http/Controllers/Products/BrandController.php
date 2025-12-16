<?php

namespace App\Http\Controllers\Products;

use App\Enums\GenericStatus;
use App\Http\Controllers\Controller;
use App\Http\Services\Products\ProductBrandService;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BrandController extends Controller
{
    protected $service;

    public function __construct(ProductBrandService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request){
        $search = $request->input('search');

        $perPage = $request->input('per_page', 20);
        if (!is_numeric($perPage) || $perPage < 1) {
            $perPage = 20;
        }
        $brands = Brand::query()
            ->when($search, function ($query, $search) {
                $query->where("brands.name_brand", "like", "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate((int)$perPage)
            ->withQueryString();

        return Inertia::render("Products/Brands/ListBrands", [
            'brands' => $brands,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage
            ]
        ]);
    }

    public function create(){
        return Inertia::render("Products/Brands/CreateBrand");
    }

    public function store(Request $request){
        $request->merge(['name_brand' => Str::lower($request->name_brand)]);

        // 1. Definir Reglas
        $rules = [
            "name_brand" => "required|string|max:255|unique:brands,name_brand",
            "status" => ['required', Rule::enum(GenericStatus::class)],
        ];

        // 2. Definir Mensajes en Español
        $messages = [
            'name_brand.required' => 'El nombre de la marca es obligatorio.',
            'name_brand.unique'   => 'Esta marca ya se encuentra registrada.', // <--- ESTO SOLUCIONA EL MENSAJE EN INGLÉS
            'name_brand.max'      => 'El nombre no puede tener más de 255 caracteres.',
            'status.required'     => 'El estado es obligatorio.',
            'status.enum'         => 'El estado seleccionado no es válido.'
        ];

        // 3. Pasar mensajes como segundo argumento
        $validateDate = $request->validate($rules, $messages);

        $brand = $this->service->createProductBrand($validateDate);

        return to_route("product-brands.show", $brand->id_brand)
            ->with('success', 'Marca creada correctamente.');
    }

    public function show($id){
        $brand = Brand::findOrFail($id);
        return Inertia::render("Products/Brands/EditBrand", [
            'brand' => $brand
        ]);
    }

    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);

        $request->merge(['name_brand' => Str::lower($request->name_brand)]);

        // Reglas para update
        $rules = [
            'name_brand' => [
                'required',
                'string',
                'max:255',
                Rule::unique('brands', 'name_brand')->ignore($brand->id_brand, 'id_brand')
            ],
            'status' => ['required', Rule::enum(GenericStatus::class)],
        ];

        // Mensajes para update (puedes reutilizar el array si quieres)
        $messages = [
            'name_brand.required' => 'El nombre de la marca es obligatorio.',
            'name_brand.unique'   => 'Esta marca ya se encuentra registrada.',
            'name_brand.max'      => 'El nombre no puede tener más de 255 caracteres.',
        ];

        $validatedData = $request->validate($rules, $messages);

        $brand->update($validatedData);

        return back()->with('success', 'Marca actualizada correctamente.');
    }

    public function destroy($id)
    {
        $this->service->deleteProductBrand($id);
        return to_route('product-brands.index')
            ->with('success', 'Marca eliminada correctamente.');
    }

    public function bulkDestroy(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:brands,id_brand'
        ]);

        $this->service->deleteProductBrands($data['ids']);

        return back()->with('success', 'Registros seleccionados eliminados.');
    }
}
