"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class RoleModel extends sequelize_1.Model {
}
exports.RoleModel = RoleModel;
function default_1(sequelize) {
    RoleModel.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        roleName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
            field: 'role_name', // Map to database column role_name
        },
        roleType: {
            type: sequelize_1.DataTypes.ENUM('student', 'employer', 'superAdmin', 'admin'),
            allowNull: false,
            field: 'role_type', // Map to database column role_type
        },
        permission_json: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            field: 'permission_json',
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal('NOW()'),
            field: 'created_at',
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.Sequelize.literal('NOW()'),
            field: 'updated_at',
        },
    }, {
        tableName: 'roles',
        sequelize,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return RoleModel;
}
