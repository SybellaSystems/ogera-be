import logger from '@/utils/logger';
import Sequelize from 'sequelize';

import userModel from './models/user.model';
import rolesModel from './models/roles.model';
import jobModel from './models/job.model';
import jobApplicationModel from './models/jobApplication.model';
import academicVerificationModel from './models/academicVerification.model';
import notificationModel from './models/notification.model';
import jobQuestionModel from './models/jobQuestion.model';
import jobApplicationAnswerModel from './models/jobApplicationAnswer.model';
import { setupAssociations } from '@/association/index';

import {
    DB_DIALECT,
    DB_HOST,
    DB_NAME,
    DB_PASSWORD,
    DB_PORT,
    DB_USERNAME,
    NODE_ENV,
} from '@/config';

const sequelize = new Sequelize.Sequelize(DB_NAME!, DB_USERNAME!, DB_PASSWORD, {
    dialect: DB_DIALECT as Sequelize.Dialect,
    host: DB_HOST,
    port: parseInt(DB_PORT!, 10),
    timezone: '+09:00',
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        underscored: true,
        freezeTableName: true,
    },
    pool: { min: 0, max: 5 },
    logging: (query, time) => logger.info(time + 'ms ' + query),
    benchmark: true,
});

// Test DB connection with improved error handling
sequelize
    .authenticate()
    .then(() => {
        logger.info('✅ Database connected successfully');
        logger.info(`📊 Database: ${DB_NAME} | Host: ${DB_HOST}:${DB_PORT}`);
    })
    .catch((err: Error) => {
        logger.error('❌ Database connection error:', err.message);
        logger.error('Please check your database configuration and ensure the database server is running');
        // Don't exit process - let the app continue and handle errors gracefully
    });

// Initialize models
const Users = userModel(sequelize);
const Roles = rolesModel(sequelize);
const Jobs = jobModel(sequelize);
const JobApplications = jobApplicationModel(sequelize);
const AcademicVerifications = academicVerificationModel(sequelize);
const Notifications = notificationModel(sequelize);
const JobQuestions = jobQuestionModel(sequelize);
const JobApplicationAnswers = jobApplicationAnswerModel(sequelize);

// Apply Associations
setupAssociations();

// Helper function to check and add missing columns safely
const ensureColumnExists = async (
    tableName: string,
    columnName: string,
    columnConfig: any,
) => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableDescription = await queryInterface.describeTable(tableName);

        if (!tableDescription[columnName]) {
            logger.info(
                `Adding missing column ${columnName} to ${tableName}...`,
            );
            await queryInterface.addColumn(tableName, columnName, columnConfig);
            logger.info(`✅ Column ${columnName} added to ${tableName}`);
        } else {
            logger.info(
                `✅ Column ${columnName} already exists in ${tableName}`,
            );
        }
    } catch (err: any) {
        // If column already exists or other error, just log it
        if (
            err.message &&
            !err.message.includes('already exists') &&
            !err.message.includes('duplicate') &&
            !err.message.includes('column') &&
            !err.message.includes('does not exist')
        ) {
            logger.warn(
                `⚠️  Could not add column ${columnName} to ${tableName}: ${err.message}`,
            );
        }
    }
};

// Function to ensure all required user table columns exist
const ensureUserTableColumns = async () => {
    const queryInterface = sequelize.getQueryInterface();

    try {
        // Check if users table exists
        await queryInterface.describeTable('users');
    } catch (err) {
        // Table doesn't exist, sync will create it
        logger.info('Users table does not exist, will be created by sync');
        return;
    }

    // Add role_id if missing
    await ensureColumnExists('users', 'role_id', {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    });

    // Add terms_accepted if missing
    await ensureColumnExists('users', 'terms_accepted', {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });

    // Add privacy_accepted if missing
    await ensureColumnExists('users', 'privacy_accepted', {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });

    // Add terms_accepted_at if missing
    await ensureColumnExists('users', 'terms_accepted_at', {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
    });

    // Add privacy_accepted_at if missing
    await ensureColumnExists('users', 'privacy_accepted_at', {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
    });

    // Add email_verified if missing
    await ensureColumnExists('users', 'email_verified', {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });

    // Add email_verification_token if missing
    await ensureColumnExists('users', 'email_verification_token', {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: true,
    });

    // Add email_verification_token_expiry if missing
    await ensureColumnExists('users', 'email_verification_token_expiry', {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
    });

    // Add reset_otp if missing
    await ensureColumnExists('users', 'reset_otp', {
        type: Sequelize.DataTypes.STRING(10),
        allowNull: true,
    });

    // Add reset_otp_expiry if missing
    await ensureColumnExists('users', 'reset_otp_expiry', {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
    });

    // Add two_fa_enabled if missing
    await ensureColumnExists('users', 'two_fa_enabled', {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });

    // Add two_fa_secret if missing
    await ensureColumnExists('users', 'two_fa_secret', {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
    });

    // Handle role_type column - rename from 'role' if it exists, or add if missing
    try {
        const tableDescription = await queryInterface.describeTable('users');

        // If old 'role' column exists, rename it to 'role_type'
        if (tableDescription['role'] && !tableDescription['role_type']) {
            logger.info('Renaming old "role" column to "role_type"...');
            await queryInterface.renameColumn('users', 'role', 'role_type');
            logger.info('✅ Column "role" renamed to "role_type"');
        }

        // If role_type doesn't exist, add it
        if (!tableDescription['role_type']) {
            await ensureColumnExists('users', 'role_type', {
                type: Sequelize.DataTypes.ENUM(
                    'student',
                    'employer',
                    'superAdmin',
                    'admin',
                ),
                allowNull: false,
            });
        }
    } catch (err: any) {
        logger.warn(`⚠️  Could not handle role_type column: ${err.message}`);
    }
};

// Sync DB
// Note: alter: true can cause issues with foreign keys in PostgreSQL when tables already exist
// For now, using force: false to only create tables if they don't exist
// For schema changes, use migrations instead of sync
sequelize
    .sync({ alter: true })
    // .sync({ force: false })
    .then(async () => {
        logger.info('✅ Database synced');

        // Check and add missing columns for users table (if table exists but columns are missing)
        try {
            await ensureUserTableColumns();
        } catch (err) {
            logger.warn(
                '⚠️  Could not check/add missing columns - you may need to run the SQL migration manually (see fix_role_id_column.sql)',
            );
        }
    })
    .catch(err => {
        logger.error('❌ Database sync error:', err);
        // If it's a foreign key or constraint error and table might exist, continue
        if (
            err.message &&
            (err.message.includes('FOREIGN KEY') ||
                err.message.includes('constraint') ||
                err.message.includes('already exists'))
        ) {
            logger.warn(
                '⚠️  Sync warning (table may already exist) - continuing anyway',
            );
            // Try to add missing columns even if sync failed
            ensureUserTableColumns().catch(() => {});
            return;
        }
        // For other errors, log but don't crash the app
        logger.warn('⚠️  Sync warning - continuing anyway');
    });

export const DB = {
    Users,
    Roles,
    Jobs,
    JobApplications,
    AcademicVerifications,
    Notifications,
    JobQuestions,
    JobApplicationAnswers,
    sequelize,
    Sequelize,
};
