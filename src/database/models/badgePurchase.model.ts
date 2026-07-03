import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export type BadgePurchaseStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export interface BadgePurchaseAttributes {
    id: string;
    user_id: string;
    from_badge: string;
    to_badge: string;
    amount: number;
    currency: string;
    usd_amount?: number | null;
    exchange_rate?: number | null;
    momo_reference_id?: string | null;
    payment_status: BadgePurchaseStatus;
    subscription_start_date?: Date | null;
    subscription_end_date?: Date | null;
    created_at?: Date;
    updated_at?: Date;
}

export type BadgePurchaseCreationAttributes = Optional<
    BadgePurchaseAttributes,
    'id' | 'usd_amount' | 'exchange_rate' | 'momo_reference_id' | 'payment_status' | 'subscription_start_date' | 'subscription_end_date' | 'created_at' | 'updated_at'
>;

export class BadgePurchaseModel
    extends Model<BadgePurchaseAttributes, BadgePurchaseCreationAttributes>
    implements BadgePurchaseAttributes
{
    public id!: string;
    public user_id!: string;
    public from_badge!: string;
    public to_badge!: string;
    public amount!: number;
    public currency!: string;
    public usd_amount?: number | null;
    public exchange_rate?: number | null;
    public momo_reference_id?: string | null;
    public payment_status!: BadgePurchaseStatus;
    public subscription_start_date?: Date | null;
    public subscription_end_date?: Date | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof BadgePurchaseModel {
    BadgePurchaseModel.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            from_badge: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            to_badge: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            amount: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
            },
            currency: {
                type: DataTypes.STRING(10),
                allowNull: false,
            },
            usd_amount: {
                type: DataTypes.DECIMAL(18, 6),
                allowNull: true,
            },
            exchange_rate: {
                type: DataTypes.DECIMAL(20, 10),
                allowNull: true,
            },
            momo_reference_id: {
                type: DataTypes.STRING(128),
                allowNull: true,
            },
            payment_status: {
                type: DataTypes.ENUM('PENDING', 'SUCCESSFUL', 'FAILED'),
                allowNull: false,
                defaultValue: 'PENDING',
            },
            subscription_start_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            subscription_end_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: Sequelize.literal('NOW()'),
            },
        },
        {
            tableName: 'badge_purchases',
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    );

    return BadgePurchaseModel;
}
