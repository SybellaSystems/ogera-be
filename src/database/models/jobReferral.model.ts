import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface JobReferralAttributes {
    referral_id: string;

    created_referral_id?: string | null;

    title: string;
    company: string;
    location: string;

    employment_type?: string | null;
    category?: string | null;

    description?: string | null;

    source?: string | null;
    original_url?: string | null;

    verification_status:
        | 'Pending'
        | 'Verified'
        | 'Rejected';

    permission_status:
        | 'Pending'
        | 'Approved'
        | 'Rejected';

    verification_notes?: string | null;

    expiry_date?: Date | null;

    status:
        | 'All'
        | 'Pending'
        | 'Verified'
        | 'Active'
        | 'Closed';

    views_count: number;
    apply_clicks: number;
    reported_applications: number;

    created_by: string;

    created_at: Date;
    updated_at: Date;
}

export type JobReferralCreationAttributes = Optional<
    JobReferralAttributes,
    | 'referral_id'
    | 'created_referral_id'
    | 'employment_type'
    | 'category'
    | 'description'
    | 'source'
    | 'original_url'
    | 'verification_status'
    | 'permission_status'
    | 'verification_notes'
    | 'expiry_date'
    | 'status'
    | 'views_count'
    | 'apply_clicks'
    | 'reported_applications'
    | 'created_at'
    | 'updated_at'
>;

export class JobReferralModel
    extends Model<
        JobReferralAttributes,
        JobReferralCreationAttributes
    >
    implements JobReferralAttributes
{
    public referral_id!: string;

    public created_referral_id!: string;

    public title!: string;
    public company!: string;
    public location!: string;

    public employment_type?: string | null;
    public category?: string | null;

    public description?: string | null;

    public source?: string | null;
    public original_url?: string | null;

    public verification_status!:
        | 'Pending'
        | 'Verified'
        | 'Rejected';

    public permission_status!:
        | 'Pending'
        | 'Approved'
        | 'Rejected';

    public verification_notes?: string | null;

    public expiry_date?: Date | null;

    public status!:
        | 'All'
        | 'Pending'
        | 'Verified'
        | 'Active'
        | 'Closed';

    public views_count!: number;
    public apply_clicks!: number;
    public reported_applications!: number;

    public created_by!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

export default function (
    sequelize: Sequelize,
): typeof JobReferralModel {
    JobReferralModel.init(
        {
            referral_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },

            created_referral_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },

            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },

            company: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },

            location: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },

            employment_type: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            category: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            source: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            original_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            verification_status: {
                type: DataTypes.ENUM(
                    'Pending',
                    'Verified',
                    'Rejected',
                ),
                allowNull: false,
                defaultValue: 'Pending',
            },

            permission_status: {
                type: DataTypes.ENUM(
                    'Pending',
                    'Approved',
                    'Rejected',
                ),
                allowNull: false,
                defaultValue: 'Pending',
            },

            verification_notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            expiry_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            status: {
                type: DataTypes.ENUM(
                    'All',
                    'Pending',
                    'Verified',
                    'Active',
                    'Closed',
                ),
                allowNull: false,
                defaultValue: 'Pending',
            },

            views_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            apply_clicks: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            reported_applications: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            created_by: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'RESTRICT',
                onUpdate: 'CASCADE',
            },

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()'),
            },

            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()'),
            },
        },
        {
            sequelize,
            tableName: 'job_referrals',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    );

    return JobReferralModel;
}