import { RoleModel } from '@/database/models/roles.model';

export class RoleRepository {
    async createRole(data: any) {
        return RoleModel.create(data);
    }

    async getAllRoles() {
        return RoleModel.findAll();
    }

    async getRoleById(id: string) {
        return RoleModel.findOne({ where: { id } });
    }

    async getRoleByName(roleName: string) {
        return RoleModel.findOne({ where: { roleName } });
    }

    async updateRole(id: string, data: any) {
        return RoleModel.update(data, { where: { id } });
    }

    async deleteRole(id: string) {
        return RoleModel.destroy({ where: { id } });
    }
}
