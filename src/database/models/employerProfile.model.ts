import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { EmployerProfile } from '@/interfaces/employer.interface';

// --- Optional fields during creation ---
export type EmployerProfileCreationAttributes = Optional<
  EmployerProfile,
  | 'employer_id'
  | 'verification_status'
  | 'website'
  | 'company_size'
  | 'contact_email'
  | 'created_at'
  | 'updated_at'
>;

export class EmployerProfileModel
  extends Model<EmployerProfile, EmployerProfileCreationAttributes>
  implements EmployerProfile
{
  public employer_id!: string;
  public user_id!: string;
  public first_name!: string;
  public last_name!: string;
  public business_id!: string;
  public company_name!: string;
  public company_description!: string;
  public business_document_url!: string;
  public verification_status!: 'Pending' | 'Verified' | 'Rejected';
  public website?: string;
  public company_size?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  public contact_email?: string;
  public company_address!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // --- Static methods ---
  static initialize(sequelize: Sequelize) {
    EmployerProfileModel.init(
      {
        employer_id: {
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
        },
        first_name: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        last_name: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        business_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        company_name: {
          type: DataTypes.STRING(150),
          allowNull: false,
        },
        company_description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        business_document_url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        verification_status: {
          type: DataTypes.ENUM('Pending', 'Verified', 'Rejected'),
          defaultValue: 'Pending',
          allowNull: false,
        },
        website: {
          type: DataTypes.STRING(255),
          allowNull: true,
          validate: { isUrl: true },
        },
        company_size: {
          type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
          allowNull: true,
        },
        contact_email: {
          type: DataTypes.STRING(255),
          allowNull: true,
          validate: { isEmail: true },
        },
        company_address: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('NOW()'),
        }
      },
      {
        tableName: 'employer_profiles',
        sequelize,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
      }
    );
  }

  static associate(models: any) {
    EmployerProfileModel.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}
