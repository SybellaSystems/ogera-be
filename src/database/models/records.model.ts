import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Records } from '../../types/records.interface.js';


export type RecordCreationAttributes = Optional<
  Records,
  "record_id" | "status" | "uploaded_at"
>;

export class RecordModel extends Model<Records, RecordCreationAttributes> {
  static initialize(sequelize: Sequelize) {
    RecordModel.init(
      {
        record_id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        student_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "student_profiles",
            key: "student_id"
          }
        },
        document_url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        extracted_grades: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
          defaultValue: "Pending",
          allowNull: false
        },
        uploaded_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal("NOW()")
        }
      },
      {
        tableName: "academic_records",
        sequelize,
        timestamps: false,
      }
    );
  }

  // foreign key association(relationship between tables)
  static associate(models: any) {
    RecordModel.belongsTo(models.StudentProfile, {
      foreignKey: "student_id",
      as: "studentProfile"
    });
  }
}