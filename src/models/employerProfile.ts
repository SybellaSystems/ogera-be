import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface EmployerProfile {
  employer_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  business_id: string;
  company_name: string;
  company_description: string;
  business_document_url: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  website?: string;
  company_size?: string;
  contact_email?: string;
  company_address: string;
  created_at: Date;
}

export type EmployerProfileCreationAttributes = Optional<
  EmployerProfile,
  "employer_id" |  "verification_status" | "website" | "company_size" | "contact_email" | "created_at"
>;

export class EmployerProfileModel extends Model<EmployerProfile, EmployerProfileCreationAttributes> {
  static initialize(sequelize: Sequelize) {
    EmployerProfileModel.init(
      {
        employer_id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "user_id"
          }
        },
        first_name: {
          type: DataTypes.STRING(20),
          allowNull: false
        },
        last_name: {
          type: DataTypes.STRING(20),
          allowNull: false
        },
        business_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        company_name: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        company_description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        business_document_url: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        verification_status: {
          type: DataTypes.ENUM("Pending", "Verified", "Rejected"),
          defaultValue: "Pending",
          allowNull: false
        },
        website: {
          type: DataTypes.STRING(255),
          allowNull: true,
          validate: {
            isUrl: true,
          },
        },
        company_size: {
          type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
          allowNull: true,
        },
        contact_email: {
          type: DataTypes.STRING(255),
          allowNull: true,
          validate: {
            isEmail: true,
          },
        },
        company_address: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal("NOW()")
        }
      },
      {
        tableName: "employer_profiles",
        sequelize,
        timestamps: false,
      }
    );
  }

  // foreign key association(relationship between tables)
  static associate(models: any) {
    EmployerProfileModel.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user"
    });
  }
}