import { PermissionRepository } from './permission.repo';
import {
    CreatePermissionDTO,
    UpdatePermissionDTO,
} from '@/interfaces/permission.interfaces';

export class PermissionService {
    private repo = new PermissionRepository();

    async createPermission(payload: CreatePermissionDTO) {
        // Validate api_name
        if (!payload.api_name || payload.api_name.trim() === '') {
            throw new Error('API name is required');
        }

        // Validate route
        if (!payload.route || payload.route.trim() === '') {
            throw new Error('Route is required');
        }

        // Validate permission object
        if (!payload.permission || typeof payload.permission !== 'object') {
            throw new Error('Permission object is required');
        }

        const { edit, view, create, delete: del } = payload.permission;
        if (
            typeof edit !== 'boolean' ||
            typeof view !== 'boolean' ||
            typeof create !== 'boolean' ||
            typeof del !== 'boolean'
        ) {
            throw new Error(
                'Permission must have boolean values for edit, view, create, and delete',
            );
        }

        // Check if api_name already exists
        const existingPermission = await this.repo.getPermissionByApiName(
            payload.api_name,
        );
        if (existingPermission) {
            throw new Error(`Permission with API name '${payload.api_name}' already exists`);
        }

        return this.repo.createPermission({
            api_name: payload.api_name.trim(),
            route: payload.route.trim(),
            permission: payload.permission,
        });
    }

    async getAllPermissions() {
        const permissions = await this.repo.getAllPermissions();
        return permissions.map(permission => ({
            ...permission.toJSON(),
            permission:
                typeof permission.permission === 'string'
                    ? JSON.parse(permission.permission)
                    : permission.permission,
        }));
    }

    async getPermissionById(id: string) {
        const permission = await this.repo.getPermissionById(id);
        if (!permission) throw new Error('Permission not found');

        return {
            ...permission.toJSON(),
            permission:
                typeof permission.permission === 'string'
                    ? JSON.parse(permission.permission)
                    : permission.permission,
        };
    }

    async updatePermission(id: string, payload: UpdatePermissionDTO) {
        await this.getPermissionById(id);

        if (payload.permission) {
            if (typeof payload.permission !== 'object') {
                throw new Error('Permission must be an object');
            }

            const { edit, view, create, delete: del } = payload.permission;
            if (
                typeof edit !== 'boolean' ||
                typeof view !== 'boolean' ||
                typeof create !== 'boolean' ||
                typeof del !== 'boolean'
            ) {
                throw new Error(
                    'Permission must have boolean values for edit, view, create, and delete',
                );
            }
        }

        // Check if api_name is being updated and if it already exists
        if (payload.api_name) {
            const existingPermission = await this.repo.getPermissionByApiName(
                payload.api_name,
            );
            if (existingPermission && existingPermission.id !== id) {
                throw new Error(
                    `Permission with API name '${payload.api_name}' already exists`,
                );
            }
        }

        const updateData: any = {};
        if (payload.api_name) updateData.api_name = payload.api_name.trim();
        if (payload.route) updateData.route = payload.route.trim();
        if (payload.permission) updateData.permission = payload.permission;

        await this.repo.updatePermission(id, updateData);
        return this.getPermissionById(id);
    }

    async deletePermission(id: string) {
        await this.getPermissionById(id);
        return this.repo.deletePermission(id);
    }
}


