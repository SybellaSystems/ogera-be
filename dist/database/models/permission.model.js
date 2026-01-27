"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class PermissionModel extends sequelize_1.Model {
}
exports.PermissionModel = PermissionModel;
function default_1(sequelize) {
    PermissionModel.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        api_name: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        route: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: false,
        },
        permission: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                view: false,
                create: false,
                edit: false,
                delete: false,
            },
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal('NOW()'),
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal('NOW()'),
        },
    }, {
        tableName: 'permissions',
        sequelize,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return PermissionModel;
}
