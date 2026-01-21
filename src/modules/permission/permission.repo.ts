import { PermissionModel } from '@/database/models/permission.model';

export class PermissionRepository {
    async createPermission(data: any) {
        return PermissionModel.create(data);
    }

    async getAllPermissions() {
        return PermissionModel.findAll({
            order: [['created_at', 'DESC']],
        });
    }

    async getPermissionById(id: string) {
        return PermissionModel.findOne({ where: { id } });
    }

    async getPermissionByApiName(api_name: string) {
        return PermissionModel.findOne({ where: { api_name } });
    }

    async updatePermission(id: string, data: any) {
        return PermissionModel.update(data, { where: { id } });
    }

    async deletePermission(id: string) {
        return PermissionModel.destroy({ where: { id } });
    }
}


