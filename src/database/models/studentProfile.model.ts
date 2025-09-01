import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { StudentProfile } from '@/interfaces/student.interface';

// Optional fields during creation
export type StudentProfileCreationAttributes = Optional<
  StudentProfile,
  | 'student_id'
  | 'identity_status'
  | 'academic_status'
  | 'trust_score'
  | 'impact_score'
  | 'locked_out_until'
>;

export class StudentProfileModel extends Model<StudentProfile, StudentProfileCreationAttributes> {
  public student_id!: string;
  public user_id!: string;
  public first_name!: string;
  public last_name!: string;
  public national_id!: string;
  public identity_status!: 'Pending' | 'Verified' | 'Rejected';
  public academic_status!: 'Pending' | 'Verified' | 'Rejected';
  public trust_score!: number;
  public impact_score!: number;
  public locked_out_until!: Date;

  // --- Static methods ---

  static initialize(sequelize: Sequelize) {
    StudentProfileModel.init(
      {
        student_id: {
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
        national_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        identity_status: {
          type: DataTypes.ENUM('Pending', 'Verified', 'Rejected'),
          defaultValue: 'Pending',
          allowNull: false,
        },
        academic_status: {
          type: DataTypes.ENUM('Pending', 'Verified', 'Rejected'),
          defaultValue: 'Pending',
          allowNull: false,
        },
        trust_score: {
          type: DataTypes.FLOAT,
          allowNull: false,
          defaultValue: 0.0,
        },
        impact_score: {
          type: DataTypes.FLOAT,
          allowNull: false,
          defaultValue: 0.0,
        },
        locked_out_until: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('NOW()'),
        },
      },
      {
        tableName: 'student_profiles',
        sequelize,
        createdAt: false,
        updatedAt: false,
        timestamps: false,
      }
    );
  }

  static associate(models: any) {
    StudentProfileModel.hasOne(models.AcademicRecord, {
      foreignKey: 'student_id',
      as: 'academicRecord',
    });

    StudentProfileModel.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}
