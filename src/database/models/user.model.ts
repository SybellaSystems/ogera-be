import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { User } from '@/interfaces/user.interfaces';

// Optional fields during creation
export type UserCreationAttributes = Optional<
  User,
  | 'user_id'
  | 'two_fa_enabled'
  | 'two_fa_secret'
  | 'created_at'
  | 'reset_otp'
  | 'reset_otp_expiry'
>;

export class UserModel extends Model<User, UserCreationAttributes> {
  public user_id!: string;
  public first_name!: string;
  public last_name!: string;
  public email!: string;
  public mobile_number!: string;
  public password_hash!: string;
  public role!: 'Student' | 'Employer' | 'Admin';
  public national_id?: string;
  public business_id?: string;
  public two_fa_enabled!: boolean;
  public two_fa_secret?: string;
  public reset_otp?: string;
  public reset_otp_expiry?: Date;
  public readonly created_at!: Date;

  // --- Static methods ---

  static initialize(sequelize: Sequelize) {
    UserModel.init(
      {
        user_id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        first_name: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        last_name: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: { isEmail: true },
        },
        mobile_number: {
          type: DataTypes.STRING(15),
          allowNull: false,
          unique: true,
        },
        password_hash: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM('Student', 'Employer', 'Admin'),
          allowNull: false,
          defaultValue: 'Student',
        },
        national_id: {
          type: DataTypes.STRING(50),
          allowNull: true,
          unique: true,
        },
        business_id: {
          type: DataTypes.STRING(50),
          allowNull: true,
          unique: true,
        },
        two_fa_enabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        two_fa_secret: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        reset_otp: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },
        reset_otp_expiry: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('NOW()'),
        }
      },
      {
        tableName: 'users',
        sequelize,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
      }
    );
  }

  static associate(models: any) {
    UserModel.hasOne(models.StudentProfile, {
      foreignKey: 'user_id',
      as: 'studentProfile',
    });

    UserModel.hasOne(models.EmployerProfile, {
      foreignKey: 'user_id',
      as: 'employerProfile',
    });
  }
}
