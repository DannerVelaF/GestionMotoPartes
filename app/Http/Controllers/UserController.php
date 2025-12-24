<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
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
            'name' => ['required', 'string', 'max:255'],
            'father_last_name' => ['nullable', 'string', 'max:255'],
            'mother_last_name' => ['nullable', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'is_active' => ['required', 'boolean'],
        ]);

        $tempPassword = 'temp_' . Str::random(8);
        $validated['password'] = $tempPassword;

        $user = User::create($validated);

        // Redirigimos a la vista de edición (show) pasando la clave temporal por sesión flash
        return redirect()->route('users.show', $user->id)
            ->with('success', 'Usuario creado correctamente.')
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
