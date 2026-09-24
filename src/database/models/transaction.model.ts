import { Sequelize, DataTypes, Model } from 'sequelize';

export class TransactionModel extends Model {}

export default (sequelize: Sequelize) => {
    TransactionModel.init(
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
            job_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            reference_id: {
                type: DataTypes.STRING(128),
                allowNull: true,
            },
            original_amount: {
                type: DataTypes.DECIMAL(18, 6),
                allowNull: true,
            },
            original_currency: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },
            converted_amount: {
                type: DataTypes.DECIMAL(18, 6),
                allowNull: true,
            },
            converted_currency: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },
            exchange_rate: {
                type: DataTypes.DECIMAL(20, 10),
                allowNull: true,
            },
            fx_timestamp: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            fx_provider: {
                type: DataTypes.STRING(50),
                allowNull: true,
                defaultValue: 'fxapi.app',
            },
            metadata: {
                type: DataTypes.JSON,
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
            tableName: 'transactions',
            sequelize,
            timestamps: false,
            underscored: true,
            freezeTableName: true,
        },
    );

    return TransactionModel;
};

// After-create hook: log transaction creation to activity_logs for audit
// (We attach hook here to ensure transactions are logged centrally whenever they are created)
// NOTE: DB.ActivityLogs may not be available at model definition time; attach hook at runtime in DB initialization if necessary.
