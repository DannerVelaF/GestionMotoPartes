<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);

        if (!is_numeric($perPage) || $perPage < 1) {
            $perPage = 10;
        }

        $query = User::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('father_last_name', 'like', "%{$search}%")
                        ->orWhere('mother_last_name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name', 'asc');

        $users = $query->paginate((int)$perPage)->withQueryString();

        return Inertia::render('Users/ListUsers', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'per_page' => (int)$perPage,
            ]
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Users/CreateUser');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'dni'              => ['required', 'digits:8', 'unique:users,dni'],
            'father_last_name' => ['nullable', 'string', 'max:255'],
            'mother_last_name' => ['nullable', 'string', 'max:255'],
            'username'         => ['required', 'string', 'max:50', 'unique:users,username'],
            'email'            => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'is_active'        => ['required', 'boolean'],
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'unique'   => 'Este :attribute ya se encuentra registrado.',
            'digits'   => 'El :attribute debe tener exactamente :digits dígitos.',
            'email'    => 'El formato del correo electrónico no es válido.',
            'string'   => 'El campo :attribute debe ser una cadena de texto.',
            'max'      => 'El campo :attribute no debe exceder los :max caracteres.',
        ], [
            'name'             => 'nombre',
            'dni'              => 'DNI',
            'username'         => 'ID de usuario',
            'email'            => 'correo electrónico',
            'is_active'        => 'estado de acceso',
            'father_last_name' => 'apellido paterno',
            'mother_last_name' => 'apellido materno',
        ]);

        $tempPassword = Str::random(10);

        $user = User::create([
            'name'             => $validated['name'],
            'dni'              => $validated['dni'],
            'father_last_name' => $validated['father_last_name'],
            'mother_last_name' => $validated['mother_last_name'],
            'username'         => $validated['username'],
            'email'            => $validated['email'],
            'is_active'        => $validated['is_active'],
            'password'         => Hash::make($tempPassword),
        ]);

        return redirect()->route('users.show', $user->id)
            ->with('success', 'Usuario registrado con éxito en el sistema.')
            ->with('generated_password', $tempPassword);
    }

    public function show(User $user): Response
    {
        return Inertia::render('Users/EditUser', [
            'user' => $user,
            // Recuperamos la clave de la sesión flash si existe
            'generated_password' => session('generated_password'),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'father_last_name' => ['nullable', 'string', 'max:255'],
            'mother_last_name' => ['nullable', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'is_active' => ['required', 'boolean'],
        ]);

        $user->update($validated);

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    /**
     * Restablece la contraseña a una nueva temporal
     */
    public function resetPassword(User $user): RedirectResponse
    {
        $newPassword = 'rst_' . Str::random(8);

        $user->update(['password' => $newPassword]);

        return back()
            ->with('success', 'La contraseña ha sido restablecida.')
            ->with('generated_password', $newPassword);
    }
}
