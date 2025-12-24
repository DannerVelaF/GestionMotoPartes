<?php

namespace App\Http\Controllers\Products;

use App\Enums\GenericStatus;
use App\Http\Controllers\Controller;
use App\Http\Services\Products\ProductService;
use App\Models\Brand;
use App\Models\ProductCategory;
use App\Models\Products;
use App\Models\ProductType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    protected $service;

    public function __construct(ProductService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 20);
        $groupBy = $request->input('group_by'); // Nuevo parámetro

        if (!is_numeric($perPage) || $perPage < 1) {
            $perPage = 20;
        }

        $query = Products::query()
            ->with(['category:id_product_category,name_product_category', 'brand:id_brand,name_brand', 'productType:id_product_type,name_product_type'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('product_name', 'like', "%{$search}%")
                        ->orWhere('product_code', 'like', "%{$search}%");
                });
            });

        // Lógica de Agrupamiento (Ordenamiento)
        if ($groupBy === 'brand') {
            // Unimos con brands para ordenar por nombre de marca, no por ID
            $query->join('brands', 'products.id_brand', '=', 'brands.id_brand')
                ->orderBy('brands.name_brand', 'asc')
                ->select('products.*'); // Importante para no traer IDs de marca como ID de producto
        } elseif ($groupBy === 'category') {
            $query->join('product_categories', 'products.id_category', '=', 'product_categories.id_product_category')
                ->orderBy('product_categories.name_product_category', 'asc')
                ->select('products.*');
        } elseif ($groupBy === 'type') {
            $query->join('product_types', 'products.id_product_type', '=', 'product_types.id_product_type')
                ->orderBy('product_types.name_product_type', 'asc')
                ->select('products.*');
        } elseif ($groupBy === 'status') {
            $query->orderBy('status', 'asc');
        } else {
            // Orden por defecto
            $query->orderBy('created_at', 'desc');
        }

        $products = $query->paginate((int)$perPage)->withQueryString();

        return Inertia::render("Products/ListProducts", [
            'products' => $products,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'group_by' => $groupBy, // Enviamos el filtro actual a la vista
            ]
        ]);
    }

    public function create()
    {
        $categories = ProductCategory::select("id_product_category", "name_product_category")->where("status", GenericStatus::ACTIVE)->get();
        $brands = Brand::select("id_brand", "name_brand")->where("status", GenericStatus::ACTIVE)->get();
        $types = ProductType::select("id_product_type", "name_product_type")->where("status", GenericStatus::ACTIVE)->get();

        return Inertia::render("Products/CreateProduct", [
            'categories' => $categories,
            'brands' => $brands,
            "types" => $types
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'product_name'    => 'required|string|max:255',
            'product_code'    => 'nullable|string|max:100|unique:products,product_code',
            'sale_price'      => 'required|numeric|min:0',
            'id_category'     => 'required|exists:product_categories,id_product_category',
            'id_brand'        => 'required|exists:brands,id_brand',
            'id_product_type' => 'required|exists:product_types,id_product_type',
            'notes'           => 'nullable|string',
            'status'          => ['required', Rule::enum(GenericStatus::class)],
            'image'           => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ];

        $messages = [
            'product_name.required'    => 'El nombre del producto es obligatorio.',
            'product_name.max'         => 'El nombre no puede exceder los 255 caracteres.',
            'product_code.unique'      => 'Este código de referencia ya está en uso.',
            'product_code.max'         => 'El código no puede exceder los 100 caracteres.',
            'sale_price.required'      => 'El precio de venta es obligatorio.',
            'sale_price.numeric'       => 'El precio debe ser un número válido.',
            'sale_price.min'           => 'El precio no puede ser negativo.',
            'id_category.required'     => 'Debes seleccionar una categoría.',
            'id_category.exists'       => 'La categoría seleccionada no es válida.',
            'id_brand.required'        => 'Debes seleccionar una marca.',
            'id_brand.exists'          => 'La marca seleccionada no es válida.',
            'id_product_type.required' => 'Debes seleccionar un tipo de producto.',
            'id_product_type.exists'   => 'El tipo de producto seleccionado no es válido.',
            'status.required'          => 'El estado es obligatorio.',
            'status.enum'              => 'El estado seleccionado no es válido.',
            'image.image'              => 'El archivo debe ser una imagen.',
            'image.max'                => 'La imagen no debe pesar más de 2MB.',
            'image.mimes'              => 'El formato debe ser jpeg, png, jpg o webp.',
        ];

        $validatedData = $request->validate($rules, $messages);

        // Generar código si viene vacío para evitar error SQL 1048
        if (empty($validatedData['product_code'])) {
            $validatedData['product_code'] = 'PROD-' . strtoupper(Str::random(8));
        }

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validatedData['url_image'] = $path;
        }
        unset($validatedData['image']);

        $this->service->createProduct($validatedData);

        return to_route('products.index')->with('success', 'Producto creado correctamente.');
    }

    public function show($id)
    {
        // 1. Cargamos movimientos con su usuario y su referencia polimórfica
        $product = Products::with(['movements' => function ($query) {
            $query->with(['user', 'reference']) // <--- AGREGAR 'reference' AQUÍ
                ->orderBy('created_at', 'desc')
                ->orderBy('id_movement', 'desc')
                ->take(20);
        }])->findOrFail($id);

        // 2. Mapeamos los movimientos para generar el label que el componente React necesita
        $mappedMovements = $product->movements->map(function ($move) {
            $refLabel = $move->notes ?? 'Movimiento manual';

            if ($move->reference) {
                // Si la referencia es una Venta
                if ($move->reference_type === \App\Models\Sales::class) {
                    $refLabel = "Venta " . ($move->reference->code_sales ?? "#{$move->reference_id}");
                }
                // Si la referencia es un Recibo (Compra o Devolución)
                elseif ($move->reference_type === \App\Models\Receipt::class) {
                    $tipo = ($move->reference->document_type === 'nota_credito') ? 'Devolución' : 'Compra';
                    $refLabel = $tipo . " " . ($move->reference->receipt_code ?? "#{$move->reference_id}");
                }
            }

            return [
                'id_movement'    => $move->id_movement,
                'type'           => $move->type,
                'quantity'       => $move->quantity,
                'unit_cost'      => $move->unit_cost,
                'balance'        => $move->balance,
                'reference_label' => $refLabel, // <--- ESTO ES LO QUE LEERÁ TU TABLA
                'reference_type' => $move->reference_type,
                'reference_id'   => $move->reference_id,
                'created_at'     => $move->created_at,
                'user'           => $move->user,
                'notes'          => $move->notes,
            ];
        });

        // 3. (Analítica - Mantén tu lógica anterior aquí)
        $salesAnalytics = DB::table('sale_details')
            ->where('id_product', $id)
            ->select(DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(quantity * unit_price) as total_revenue'), DB::raw('AVG(unit_price) as avg_price'))
            ->first();

        $purchasesAnalytics = DB::table('receipt_details')
            ->where('id_product', $id)
            ->select(DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(quantity * unit_price) as total_investment'), DB::raw('AVG(unit_price) as avg_cost'))
            ->first();

        // 4. Datos maestros
        $categories = ProductCategory::where("status", GenericStatus::ACTIVE)->get();
        $brands = Brand::where("status", GenericStatus::ACTIVE)->get();
        $types = ProductType::where("status", GenericStatus::ACTIVE)->get();

        return Inertia::render("Products/EditProduct", [
            'product' => array_merge($product->only(['id_product', 'product_name', 'product_code', 'sale_price', 'id_category', 'id_brand', 'id_product_type', 'notes', 'status', 'url_image', 'purchase_price', 'stock']), [
                'movements' => $mappedMovements, // <--- ENVIAMOS LOS MOVIMIENTOS MAPEADOS
                'analytics' => [
                    'sales_qty' => (float)($salesAnalytics->total_qty ?? 0),
                    'sales_revenue' => (float)($salesAnalytics->total_revenue ?? 0),
                    'sales_avg_price' => (float)($salesAnalytics->avg_price ?? 0),
                    'purchases_qty' => (float)($purchasesAnalytics->total_qty ?? 0),
                    'purchases_investment' => (float)($purchasesAnalytics->total_investment ?? 0),
                    'purchases_avg_cost' => (float)($purchasesAnalytics->avg_cost ?? 0),
                ]
            ]),
            'categories' => $categories,
            'brands' => $brands,
            'types' => $types
        ]);
    }

    public function update(Request $request, $id)
    {
        $product = Products::findOrFail($id);

        $rules = [
            'product_name'    => 'required|string|max:255',
            'product_code'    => ['nullable', 'string', 'max:100', Rule::unique('products', 'product_code')->ignore($product->id_product, 'id_product')],
            'sale_price'      => 'required|numeric|min:0',
            'id_category'     => 'required|exists:product_categories,id_product_category',
            'id_brand'        => 'required|exists:brands,id_brand',
            'id_product_type' => 'required|exists:product_types,id_product_type',
            'notes'           => 'nullable|string',
            'status'          => ['required', Rule::enum(GenericStatus::class)],
            'image'           => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ];

        // RESTAURADO: Mensajes completos para update
        $messages = [
            'product_name.required'    => 'El nombre del producto es obligatorio.',
            'product_name.max'         => 'El nombre no puede exceder los 255 caracteres.',
            'product_code.unique'      => 'Este código de referencia ya está en uso.',
            'product_code.max'         => 'El código no puede exceder los 100 caracteres.',
            'sale_price.required'      => 'El precio de venta es obligatorio.',
            'sale_price.numeric'       => 'El precio debe ser un número válido.',
            'sale_price.min'           => 'El precio no puede ser negativo.',
            'id_category.required'     => 'Debes seleccionar una categoría.',
            'id_brand.required'        => 'Debes seleccionar una marca.',
            'id_product_type.required' => 'Debes seleccionar un tipo de producto.',
            'status.required'          => 'El estado es obligatorio.',
            'image.max'                => 'La imagen no debe pesar más de 2MB.',
            'image.mimes'              => 'El formato debe ser jpeg, png, jpg o webp.',
        ];

        $validatedData = $request->validate($rules, $messages);

        // LÓGICA IMPORTANTE: Evitar error NULL en product_code al actualizar
        if (empty($validatedData['product_code'])) {
            // Si el usuario borra el código, mantenemos el que tenía antes
            $validatedData['product_code'] = $product->product_code;
        }

        // 1. Eliminar imagen si se solicitó
        if ($request->boolean('delete_image')) {
            if ($product->url_image && Storage::disk('public')->exists($product->url_image)) {
                Storage::disk('public')->delete($product->url_image);
            }
            $validatedData['url_image'] = null;
        }

        // 2. Reemplazar imagen si viene nueva
        if ($request->hasFile('image')) {
            if ($product->url_image && Storage::disk('public')->exists($product->url_image)) {
                Storage::disk('public')->delete($product->url_image);
            }
            $path = $request->file('image')->store('products', 'public');
            $validatedData['url_image'] = $path;
        }

        unset($validatedData['image']);
        unset($validatedData['delete_image']);

        $product->update($validatedData);

        return back()->with('success', 'Producto actualizado correctamente.');
    }

    public function destroy($id)
    {
        $product = Products::findOrFail($id);

        if ($product->url_image && Storage::disk('public')->exists($product->url_image)) {
            Storage::disk('public')->delete($product->url_image);
        }

        $this->service->deleteProduct($id);

        return to_route('products.index')->with('success', 'Producto eliminado correctamente.');
    }

    public function bulkDestroy(Request $request)
    {
        $messages = [
            'ids.required' => 'Debes seleccionar al menos un producto.',
            'ids.array'    => 'Formato de datos inválido.',
            'ids.*.exists' => 'Uno de los productos seleccionados no existe.'
        ];

        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:products,id_product'
        ], $messages);

        // Nota: Si quieres borrar imágenes en bulk, deberías hacerlo iterando en el servicio
        $this->service->deleteProducts($data['ids']);

        return back()->with('success', 'Productos seleccionados eliminados correctamente.');
    }
}
