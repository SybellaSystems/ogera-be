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
        },
        roleType: {
            type: sequelize_1.DataTypes.ENUM('student', 'employer', 'superAdmin', 'admin'),
            allowNull: false,
        },
        permission_json: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
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
        tableName: 'roles',
        sequelize,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return RoleModel;
}
