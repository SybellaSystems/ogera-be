import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { UserSkill } from '@/interfaces/profile.interfaces';
import { UserModel } from './user.model';

export type UserSkillCreationAttributes = Optional<
    UserSkill,
    'skill_id' | 'proficiency_level' | 'years_of_experience' | 'last_used_year' | 'created_at' | 'updated_at'
>;

export class UserSkillModel
    extends Model<UserSkill, UserSkillCreationAttributes>
    implements UserSkill
{
    public skill_id!: string;
    public user_id!: string;
    public skill_name!: string;
    public skill_type!: 'key_skill' | 'it_skill';
    public proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    public years_of_experience?: number;
    public last_used_year?: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Associations
    public user?: UserModel;
}

export default function (sequelize: Sequelize): typeof UserSkillModel {
    UserSkillModel.init(
        {
            skill_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            skill_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            skill_type: {
                type: DataTypes.ENUM('key_skill', 'it_skill'),
                allowNull: false,
                defaultValue: 'key_skill',
            },
            proficiency_level: {
                type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
                allowNull: true,
            },
            years_of_experience: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            last_used_year: {
                type: DataTypes.INTEGER,
                allowNull: true,
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
        },
    );

    return UserSkillModel;
}

