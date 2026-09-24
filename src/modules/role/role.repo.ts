import { Op, Sequelize } from 'sequelize';
import { RoleModel } from '@/database/models/roles.model';

export class RoleRepository {
    async createRole(data: any) {
        return RoleModel.create(data);
    }

    async getAllRoles({ search }: { search?: string } = {}) {
        const where: any = {};

        if (search && search.trim()) {
            where[Op.or] = [
                {
                    roleName: {
                        [Op.iLike]: `%${search}%`,
                    },
                },
                Sequelize.where(
                    Sequelize.cast(Sequelize.col('role_type'), 'text'),
                    {
                        [Op.iLike]: `%${search}%`,
                    },
                ),
            ];
        }

        return RoleModel.findAll({ where });
    }

    async getRoleById(id: string) {
        return RoleModel.findOne({
            where: { id },
        });
    }

    async getRoleByName(roleName: string) {
        return RoleModel.findOne({
            where: { roleName },
        });
    }

    async updateRole(id: string, data: any) {
        return RoleModel.update(data, {
            where: { id },
        });
    }

    async deleteRole(id: string) {
        return RoleModel.destroy({
            where: { id },
        });
    }
}
