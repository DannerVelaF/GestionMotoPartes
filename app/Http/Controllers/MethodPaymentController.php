<?php

namespace App\Http\Controllers;

use App\Enums\GenericStatus;
use App\Http\Services\Sales\MethodPaymentService;
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
        return to_route("sales.methodPayments.show", $method->id)
            ->with('success', 'Método de pago creado correctamente.');
    }


    public function show($id)
    {
        $method = $this->service->findMethodPaymentById($id);
        return Inertia::render("Sales/MethodPayment/EditMethodPayment", [
            'methodPayment' => $method
        ]);
    }

    public function update(Request $request, $id)
    {
        $rules = [
            'name_method_payment' => 'required|string|max:255|unique:method_payments,name,' . $id,
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
}
