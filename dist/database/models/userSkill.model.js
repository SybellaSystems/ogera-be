"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSkillModel = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
class UserSkillModel extends sequelize_1.Model {
}
exports.UserSkillModel = UserSkillModel;
function default_1(sequelize) {
    UserSkillModel.init({
        skill_id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        skill_name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        skill_type: {
            type: sequelize_1.DataTypes.ENUM('key_skill', 'it_skill'),
            allowNull: false,
            defaultValue: 'key_skill',
        },
        proficiency_level: {
            type: sequelize_1.DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
            allowNull: true,
        },
        years_of_experience: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
        },
        last_used_year: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
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
        tableName: 'user_skills',
        sequelize,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id'],
            },
            {
                fields: ['skill_type'],
            },
            {
                unique: true,
                fields: ['user_id', 'skill_name'],
            },
        ],
    });
    return UserSkillModel;
}
