import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Role } from '@/interfaces/role.interfaces';

export type RoleCreationAttributes = Optional<
    Role,
    'id' | 'created_at' | 'updated_at'
>;

export class RoleModel
    extends Model<Role, RoleCreationAttributes>
    implements Role
{
    public id!: string;
    public roleName!:
        | 'student'
        | 'employer'
        | 'admin'
        | 'superadmin'
        | 'subadmin';
    public roleType!: 'student' | 'employer' | 'superAdmin' | 'admin';
    public permission_json!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof RoleModel {
    RoleModel.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },

            roleName: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                field: 'role_name',  // Map to database column role_name
            },

            roleType: {
                type: DataTypes.ENUM(
                    'student',
                    'employer',
                    'superAdmin',
                    'admin',
                ),
                allowNull: false,
                field: 'role_type',  // Map to database column role_type
            },

            permission_json: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
                field: 'permission_json',
            },

            created_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
                field: 'created_at',
            },

            updated_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
                field: 'updated_at',
            },
        },
        {
            tableName: 'roles',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    );

    return RoleModel;
}
