import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { ApiPermission } from '@/interfaces/permission.interfaces';

export type PermissionCreationAttributes = Optional<
    ApiPermission,
    'id' | 'created_at' | 'updated_at'
>;

export class PermissionModel
    extends Model<ApiPermission, PermissionCreationAttributes>
    implements ApiPermission
{
    public id!: string;
    public api_name!: string;
    public route!: string;
    public permission!: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof PermissionModel {
    PermissionModel.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            api_name: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            route: {
                type: DataTypes.STRING(500),
                allowNull: false,
            },
            permission: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: {
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                },
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
        },
        {
            tableName: 'permissions',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    );

    return PermissionModel;
}


