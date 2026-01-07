<?php

namespace App\Http\Controllers\Sales;

use App\Enums\GenericStatus;
use App\Http\Controllers\Controller;
use App\Http\Services\Sales\MethodPaymentService;
use App\Models\MethodPayment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MethodPaymentController extends Controller
{

    protected $service;

    public function __construct(MethodPaymentService $service)
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
        $methods = MethodPayment::query()
            ->when($search, function ($query, $search) {
                $query->where("method_payments.name_method_payment", "like", "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate((int)$perPage)
            ->withQueryString();

        return Inertia::render("Sales/MethodPayment/ListMethods", [
            'methods' => $methods,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render("Sales/MethodPayment/CreateMethodPayment");
    }

    public function store(Request $request)
    {
        $rules = [
            'name_method_payment' => 'required|string|max:255|unique:method_payments,name_method_payment',
            "status" => ['required', Rule::enum(GenericStatus::class)],
        ];

        $messages = [
            'name_method_payment.required' => 'El nombre del método de pago es obligatorio.',
            'name_method_payment.unique'   => 'Este método de pago ya se encuentra registrado.', // <--- ESTO SOLUCIONA EL MENSAJE EN INGLÉS
            'name_method_payment.max'      => 'El nombre no puede tener más de 255 caracteres.',
            'status.required'     => 'El estado es obligatorio.',
            'status.enum'         => 'El estado seleccionado no es válido.'
        ];

        $validateDate = $request->validate($rules, $messages);
        $method = $this->service->createMethodPayment($validateDate);
        return to_route("sales.methodPayments.show", $method)
            ->with('success', 'Método de pago creado correctamente.');
    }


    public function show($id)
    {
        $method = MethodPayment::findOrFail($id);
        return Inertia::render("Sales/MethodPayment/EditMethodPayment", [
            'methodPayment' => $method
        ]);
    }

    public function update(Request $request, $id)
    {
        $rules = [
            'name_method_payment' => 'required|string|max:255|unique:method_payments,name_method_payment,' . $id,
            "status" => ['required', Rule::enum(GenericStatus::class)],
        ];

        $messages = [
            'name_method_payment.required' => 'El nombre del método de pago es obligatorio.',
            'name_method_payment.unique'   => 'Este método de pago ya se encuentra registrado.', // <---
            'name_method_payment.max'      => 'El nombre no puede tener más de 255 caracteres.',
            'status.required'     => 'El estado es obligatorio.',
            'status.enum'         => 'El estado seleccionado no es válido.'
        ];

        $validatedData = $request->validate($rules, $messages);

        $method = $this->service->findMethodPaymentById($id);
        $method->update($validatedData);

        return back()->with('success', 'Método de pago actualizado correctamente.');
    }

    public function destroy($id)
    {
        $this->service->deleteMethodPayment($id);

        return to_route("sales.methodPayments.index")
            ->with('success', 'Método de pago eliminado correctamente.');
    }

    public function bulkDestroy(Request $request)
    {
        $messages = [
            'ids.required' => 'Debes seleccionar al menos un método de pago.',
            'ids.array'    => 'Formato de datos inválido.',
            'ids.*.exists' => 'Uno de los métodos de pago seleccionados no existe.'
        ];

        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:method_payments,id_method_payment'
        ], $messages);

        // Nota: Si quieres borrar imágenes en bulk, deberías hacerlo iterando en el servicio
        $this->service->deleteMethodPayments($data['ids']);

        return back()->with('success', 'Recibos seleccionados eliminados correctamente.');
    }
}
