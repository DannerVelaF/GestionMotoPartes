<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Services\RoleService;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RoleController extends Controller
{
    protected $service;

    public function __construct(RoleService $service)
    {
        $this->service = $service;
    }

    /**
     * Muestra la lista de roles (Kanban o Tabla).
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);

        if (!is_numeric($perPage) || $perPage < 1) {
            $perPage = 10;
        }

        $query = Role::query()
            ->withCount('users') // Para saber cuántos usuarios tienen este rol
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('label', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            });

        // Orden por defecto
        $query->orderBy('created_at', 'desc');

        $roles = $query->paginate((int)$perPage)->withQueryString();

        return Inertia::render("Users/Roles/ListRoles", [
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Muestra el formulario para crear un nuevo rol.
     */
    public function create()
    {
        return Inertia::render("Users/Roles/CreateRole");
    }

    /**
     * Guarda el nuevo rol en la base de datos.
     */
    public function store(Request $request)
    {
        $rules = [
            'name'        => 'required|string|max:50|unique:roles,name', // El slug único (ej: admin)
            'label'       => 'required|string|max:100', // El nombre visible (ej: Administrador)
            'description' => 'nullable|string|max:255',
        ];

        $messages = [
            'name.required'   => 'El identificador es obligatorio.',
            'name.unique'     => 'Este identificador ya está en uso.',
            'label.required'  => 'El nombre visible es obligatorio.',
        ];

        $validatedData = $request->validate($rules, $messages);

        $this->service->createRole($validatedData);

        return to_route('roles.index')->with('success', 'Rol creado correctamente.');
    }

    /**
     * Muestra la vista de edición para un rol específico.
     */
    public function show($id)
    {
        $role = Role::with('users:id,name,email,role_id')->findOrFail($id);

        return Inertia::render("Users/Roles/EditRole", [
            'role' => $role
        ]);
    }

    /**
     * Actualiza un rol existente.
     */
    public function update(Request $request, $id)
    {
        $rules = [
            'name'        => ['required', 'string', 'max:50', Rule::unique('roles', 'name')->ignore($id)],
            'label'       => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
        ];

        $messages = [
            'name.required'  => 'El identificador es obligatorio.',
            'name.unique'    => 'Este identificador ya está en uso por otro rol.',
            'label.required' => 'El nombre visible es obligatorio.',
        ];

        $validatedData = $request->validate($rules, $messages);

        $this->service->updateRole($id, $validatedData);

        return back()->with('success', 'Rol actualizado correctamente.');
    }

    /**
     * Elimina un rol.
     */
    public function destroy($id)
    {
        // Validación opcional: No permitir borrar roles si tienen usuarios
        $role = Role::withCount('users')->findOrFail($id);

        if ($role->users_count > 0) {
            return back()->with('error', 'No se puede eliminar un rol que tiene usuarios asignados.');
        }

        $this->service->deleteRole($id);

        return to_route('roles.index')->with('success', 'Rol eliminado correctamente.');
    }

    /**
     * Eliminación masiva.
     */
    public function bulkDestroy(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:roles,id'
        ]);

        // Verificar si alguno tiene usuarios antes de borrar (opcional pero recomendado)
        $rolesWithUsers = Role::whereIn('id', $data['ids'])->has('users')->count();

        if ($rolesWithUsers > 0) {
            return back()->with('error', 'Algunos de los roles seleccionados tienen usuarios asignados y no se pueden eliminar.');
        }

        $this->service->deleteRoles($data['ids']);

        return back()->with('success', 'Roles seleccionados eliminados correctamente.');
    }
}
