import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth } = usePage().props as any;

    // ✅ CORRECCIÓN 1: Los permisos vienen directo en 'auth.permissions'
    const userPermissions: string[] = auth.permissions || [];

    const hasPermission = (permission: string) => {
        // ✅ CORRECCIÓN 2: role ahora es un objeto, así que buscamos role.name
        if (auth.user?.role?.name === 'admin') return true;

        return userPermissions.includes(permission);
    };

    return { hasPermission };
}
