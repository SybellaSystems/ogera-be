import { RoleRepository } from './role.repo';
import { CreateRoleDTO, RoutePermission } from '@/interfaces/role.interfaces';

export class RoleService {
    private repo = new RoleRepository();

    // Create a role with roleName and permission_json
    async createRole(payload: {
        roleName: string;
        permission_json?: RoutePermission[];
    }) {
        // Validate roleName
        if (!payload.roleName || payload.roleName.trim() === '') {
            throw new Error('Role name is required');
        }

        // Check if role already exists
        const existingRole = await this.repo.getRoleByName(payload.roleName);
        if (existingRole) {
            throw new Error(`Role '${payload.roleName}' already exists`);
        }

        // If permission_json is not provided, initialize with empty array
        if (!payload.permission_json) {
            payload.permission_json = [];
        }

        // Validate permission_json structure if provided
        if (
            Array.isArray(payload.permission_json) &&
            payload.permission_json.length > 0
        ) {
            for (const perm of payload.permission_json) {
                if (!perm.route || typeof perm.route !== 'string') {
                    throw new Error('Each permission must have a valid route');
                }
                if (!perm.permission || typeof perm.permission !== 'object') {
                    throw new Error(
                        'Each permission must have a permission object',
                    );
                }
                const { edit, view, create, delete: del } = perm.permission;
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
        }

        // Convert permission_json array to JSON string for storage
        const roleData = {
            roleName: payload.roleName,
            permission_json: JSON.stringify(payload.permission_json),
        };

        return this.repo.createRole(roleData);
    }

    // Get all roles
    async getAllRoles() {
        const roles = await this.repo.getAllRoles();
        return roles.map(role => ({
            ...role.toJSON(),
            permission_json:
                typeof role.permission_json === 'string'
                    ? JSON.parse(role.permission_json)
                    : role.permission_json,
        }));
    }

    // Get role by ID
    async getRoleById(id: string) {
        const role = await this.repo.getRoleById(id);
        if (!role) throw new Error('Role not found');

        return {
            ...role.toJSON(),
            permission_json:
                typeof role.permission_json === 'string'
                    ? JSON.parse(role.permission_json)
                    : role.permission_json,
        };
    }

    // Update role
    async updateRole(
        id: string,
        payload: Partial<{
            roleName: string;
            permission_json: RoutePermission[];
        }>,
    ) {
        await this.getRoleById(id);

        if (payload.permission_json) {
            if (!Array.isArray(payload.permission_json)) {
                throw new Error('permission_json must be an array');
            }

            for (const perm of payload.permission_json) {
                if (!perm.route || typeof perm.route !== 'string') {
                    throw new Error('Each permission must have a valid route');
                }
                if (!perm.permission || typeof perm.permission !== 'object') {
                    throw new Error(
                        'Each permission must have a permission object',
                    );
                }
            }

            payload.permission_json = JSON.stringify(
                payload.permission_json,
            ) as any;
        }

        await this.repo.updateRole(id, payload);
        return this.getRoleById(id);
    }

    // Delete role
    async deleteRole(id: string) {
        await this.getRoleById(id);
        return this.repo.deleteRole(id);
    }
}
