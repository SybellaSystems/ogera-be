import { Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize) => {
  const Transactions = sequelize.define(
    'transactions',
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: 'USD',
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: (sequelize as any).fn('NOW'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: (sequelize as any).fn('NOW'),
      },
    },
    {
      timestamps: false,
      underscored: true,
      freezeTableName: true,
    },
  );

  return Transactions;
};

// After-create hook: log transaction creation to activity_logs for audit
// (We attach hook here to ensure transactions are logged centrally whenever they are created)
// NOTE: DB.ActivityLogs may not be available at model definition time; attach hook at runtime in DB initialization if necessary.
