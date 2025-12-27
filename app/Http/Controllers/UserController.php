<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role; // Importante para el selector
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
            ->with('role:id,label,name') // Cargar la relación del rol para mostrar en la tabla
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('father_last_name', 'like', "%{$search}%")
                        ->orWhere('mother_last_name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('dni', 'like', "%{$search}%") // Agregada búsqueda por DNI
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc');

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
        // Enviamos los roles disponibles para el Select
        $roles = Role::select('id', 'label')->get();

        return Inertia::render('Users/CreateUser', [
            'roles' => $roles
        ]);
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
            'role_id'          => ['required', 'exists:roles,id'], // Validación del Rol
            'is_active'        => ['required', 'boolean'],
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'unique'   => 'Este :attribute ya se encuentra registrado.',
            'digits'   => 'El :attribute debe tener exactamente :digits dígitos.',
            'email'    => 'El formato del correo no es válido.',
            'exists'   => 'El rol seleccionado no es válido.'
        ], [
            'role_id' => 'rol de sistema',
            'dni'     => 'DNI'
        ]);

        // Generamos contraseña temporal
        $tempPassword = Str::random(10);

        $user = User::create([
            'name'             => $validated['name'],
            'dni'              => $validated['dni'],
            'father_last_name' => $validated['father_last_name'],
            'mother_last_name' => $validated['mother_last_name'],
            'username'         => $validated['username'],
            'email'            => $validated['email'],
            'role_id'          => $validated['role_id'],
            'is_active'        => $validated['is_active'],
            'password'         => Hash::make($tempPassword), // ¡IMPORTANTE! Hashear
        ]);

        // Redirigimos al Show (Edición) mostrando la contraseña generada
        return redirect()->route('users.show', $user->id)
            ->with('success', 'Usuario registrado correctamente.')
            ->with('generated_password', $tempPassword);
    }

    public function show(User $user): Response
    {
        // Enviamos roles para poder cambiarlo en la edición
        $roles = Role::select('id', 'label')->get();

        return Inertia::render('Users/EditUser', [
            'user' => $user,
            'roles' => $roles,
            'generated_password' => session('generated_password'),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'father_last_name' => ['nullable', 'string', 'max:255'],
            'mother_last_name' => ['nullable', 'string', 'max:255'],
            'dni'              => ['required', 'digits:8', Rule::unique('users')->ignore($user->id)],
            'username'         => ['required', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'email'            => ['nullable', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role_id'          => ['required', 'exists:roles,id'],
            'is_active'        => ['required', 'boolean'],
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

        $user->update(['password' => Hash::make($newPassword)]);

        return back()
            ->with('success', 'La contraseña ha sido restablecida.')
            ->with('generated_password', $newPassword);
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return to_route('users.index')->with('success', 'Usuario eliminado del sistema.');
    }
}
