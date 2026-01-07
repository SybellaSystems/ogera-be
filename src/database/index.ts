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
import userSkillModel from './models/userSkill.model';
import userEmploymentModel from './models/userEmployment.model';
import userEducationModel from './models/userEducation.model';
import userProjectModel from './models/userProject.model';
import userAccomplishmentModel from './models/userAccomplishment.model';
import userExtendedProfileModel from './models/userExtendedProfile.model';
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
const UserSkills = userSkillModel(sequelize);
const UserEmployments = userEmploymentModel(sequelize);
const UserEducations = userEducationModel(sequelize);
const UserProjects = userProjectModel(sequelize);
const UserAccomplishments = userAccomplishmentModel(sequelize);
const UserExtendedProfiles = userExtendedProfileModel(sequelize);

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

// Function to fix NULL role_type values by updating from roles table
const fixNullRoleTypeValues = async (): Promise<boolean> => {
    try {
        const queryInterface = sequelize.getQueryInterface();

        // Check if users table exists
        let tableDescription;
        try {
            tableDescription = await queryInterface.describeTable('users');
        } catch (err) {
            // Table doesn't exist, nothing to fix
            return true;
        }

        // Check if role_type column exists
        if (!tableDescription['role_type']) {
            logger.info('role_type column does not exist yet, nothing to fix');
            return true;
        }

        // Check if there are any NULL role_type values
        const [results] = (await sequelize.query(
            `SELECT COUNT(*) as count FROM users WHERE role_type IS NULL`,
        )) as any[];

        const nullCount = parseInt(results[0]?.count || '0', 10);

        if (nullCount === 0) {
            logger.info('✅ No NULL role_type values found');
            return true;
        }

        logger.info(
            `Found ${nullCount} users with NULL role_type, updating from roles table...`,
        );

        // Use the alternative method first (more reliable with Sequelize)
        try {
            const [usersWithNullRoleType] = (await sequelize.query(
                `SELECT u.user_id, u.role_id, r.role_type 
                 FROM users u 
                 INNER JOIN roles r ON u.role_id = r.id 
                 WHERE u.role_type IS NULL`,
            )) as any[];

            if (usersWithNullRoleType.length > 0) {
                logger.info(
                    `Updating ${usersWithNullRoleType.length} users with NULL role_type using Sequelize models...`,
                );

                for (const user of usersWithNullRoleType) {
                    if (user.role_type) {
                        await Users.update(
                            { role_type: user.role_type },
                            { where: { user_id: user.user_id } },
                        );
                    }
                }

                // Verify the update worked
                const [verifyResults] = (await sequelize.query(
                    `SELECT COUNT(*) as count FROM users WHERE role_type IS NULL`,
                )) as any[];
                const remainingNulls = parseInt(
                    verifyResults[0]?.count || '0',
                    10,
                );

                if (remainingNulls === 0) {
                    logger.info(
                        '✅ Successfully updated all NULL role_type values',
                    );
                    return true;
                } else {
                    logger.warn(
                        `⚠️  Still have ${remainingNulls} NULL role_type values after update`,
                    );
                    // Try direct SQL as fallback
                    throw new Error(
                        'Sequelize update did not fix all NULL values',
                    );
                }
            } else {
                logger.warn(
                    '⚠️  Found NULL role_type values but could not find matching roles',
                );
                return false;
            }
        } catch (modelErr: any) {
            // Fallback to direct SQL update
            logger.info('Trying direct SQL update as fallback...');
            try {
                if (DB_DIALECT === 'postgres') {
                    // For PostgreSQL, get the enum type name for users.role_type
                    const [enumTypeResult] = (await sequelize.query(`
                        SELECT DISTINCT t.typname as enum_name
                        FROM pg_type t 
                        JOIN pg_enum e ON t.oid = e.enumtypid 
                        JOIN pg_attribute a ON a.atttypid = t.oid 
                        JOIN pg_class c ON c.oid = a.attrelid 
                        WHERE c.relname = 'users' AND a.attname = 'role_type'
                        LIMIT 1
                    `)) as any[];

                    const enumTypeName = enumTypeResult?.[0]?.enum_name;

                    if (enumTypeName) {
                        logger.info(
                            `Found enum type: ${enumTypeName}, updating NULL values...`,
                        );
                        // Use the found enum type name - cast role_type from roles table to users enum
                        await sequelize.query(`
                            UPDATE users 
                            SET role_type = CAST(r.role_type AS text)::${enumTypeName}
                            FROM roles r
                            WHERE users.role_id = r.id 
                            AND users.role_type IS NULL
                        `);
                    } else {
                        // Try using USING clause or simpler cast
                        logger.info(
                            'Enum type not found, trying simpler update...',
                        );
                        await sequelize.query(`
                            UPDATE users u
                            SET role_type = (
                                SELECT r.role_type::text
                                FROM roles r
                                WHERE r.id = u.role_id
                            )::users_role_type_enum
                            WHERE u.role_type IS NULL
                        `);
                    }

                    // Verify
                    const [verifyResults] = (await sequelize.query(
                        `SELECT COUNT(*) as count FROM users WHERE role_type IS NULL`,
                    )) as any[];
                    const remainingNulls = parseInt(
                        verifyResults[0]?.count || '0',
                        10,
                    );

                    if (remainingNulls === 0) {
                        logger.info(
                            '✅ Successfully updated NULL role_type values using PostgreSQL SQL',
                        );
                        return true;
                    } else {
                        logger.error(
                            `❌ Still have ${remainingNulls} NULL values after SQL update`,
                        );
                        // Last resort: try using Sequelize models one by one
                        logger.info(
                            'Attempting individual updates as last resort...',
                        );
                        const [remainingUsers] = (await sequelize.query(
                            `SELECT u.user_id, r.role_type 
                             FROM users u 
                             INNER JOIN roles r ON u.role_id = r.id 
                             WHERE u.role_type IS NULL`,
                        )) as any[];

                        for (const user of remainingUsers) {
                            try {
                                await Users.update(
                                    { role_type: user.role_type },
                                    {
                                        where: { user_id: user.user_id },
                                        individualHooks: false,
                                    },
                                );
                            } catch (updateErr: any) {
                                logger.warn(
                                    `Could not update user ${user.user_id}: ${updateErr.message}`,
                                );
                            }
                        }
                        return false;
                    }
                } else {
                    // For MySQL and other databases
                    await sequelize.query(`
                        UPDATE users u
                        INNER JOIN roles r ON u.role_id = r.id
                        SET u.role_type = r.role_type
                        WHERE u.role_type IS NULL
                    `);

                    logger.info(
                        '✅ Successfully updated NULL role_type values using SQL',
                    );
                    return true;
                }
            } catch (sqlErr: any) {
                logger.error(
                    `❌ Could not fix NULL role_type values with SQL: ${sqlErr.message}`,
                );
                logger.info(
                    'Falling back to individual Sequelize model updates...',
                );
                // Last resort: individual updates
                try {
                    const [remainingUsers] = (await sequelize.query(
                        `SELECT u.user_id, r.role_type 
                         FROM users u 
                         INNER JOIN roles r ON u.role_id = r.id 
                         WHERE u.role_type IS NULL`,
                    )) as any[];

                    for (const user of remainingUsers) {
                        try {
                            await Users.update(
                                { role_type: user.role_type },
                                {
                                    where: { user_id: user.user_id },
                                    individualHooks: false,
                                },
                            );
                        } catch (updateErr: any) {
                            logger.warn(
                                `Could not update user ${user.user_id}: ${updateErr.message}`,
                            );
                        }
                    }

                    // Final verification
                    const [finalVerify] = (await sequelize.query(
                        `SELECT COUNT(*) as count FROM users WHERE role_type IS NULL`,
                    )) as any[];
                    const finalNulls = parseInt(
                        finalVerify[0]?.count || '0',
                        10,
                    );

                    if (finalNulls === 0) {
                        logger.info(
                            '✅ Successfully updated NULL role_type values using individual updates',
                        );
                        return true;
                    }
                } catch (finalErr: any) {
                    logger.error(
                        `❌ Final fallback also failed: ${finalErr.message}`,
                    );
                }
                return false;
            }
        }
    } catch (err: any) {
        logger.error(`❌ Error in fixNullRoleTypeValues: ${err.message}`);
        return false;
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

    // Add phone_verified if missing
    await ensureColumnExists('users', 'phone_verified', {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });

    // Add phone_verification_otp if missing
    await ensureColumnExists('users', 'phone_verification_otp', {
        type: Sequelize.DataTypes.STRING(10),
        allowNull: true,
    });

    // Add phone_verification_otp_expiry if missing
    await ensureColumnExists('users', 'phone_verification_otp_expiry', {
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

        // If role_type doesn't exist, add it (as nullable first if table has rows)
        if (!tableDescription['role_type']) {
            // Check if table has existing rows
            const [rowCountResult] = (await sequelize.query(
                'SELECT COUNT(*) as count FROM users',
            )) as any[];
            const rowCount = parseInt(rowCountResult?.[0]?.count || '0', 10);

            if (rowCount > 0) {
                // Add column as nullable first
                logger.info(
                    'Adding role_type column as nullable (will update values and make NOT NULL after)...',
                );
                await ensureColumnExists('users', 'role_type', {
                    type: Sequelize.DataTypes.ENUM(
                        'student',
                        'employer',
                        'superAdmin',
                        'admin',
                    ),
                    allowNull: true, // Start as nullable
                });

                // Update NULL values from roles table
                await fixNullRoleTypeValues();

                // Now alter column to NOT NULL
                try {
                    await queryInterface.changeColumn('users', 'role_type', {
                        type: Sequelize.DataTypes.ENUM(
                            'student',
                            'employer',
                            'superAdmin',
                            'admin',
                        ),
                        allowNull: false,
                    });
                    logger.info('✅ role_type column updated to NOT NULL');
                } catch (alterErr: any) {
                    logger.warn(
                        `⚠️  Could not set role_type to NOT NULL: ${alterErr.message}`,
                    );
                }
            } else {
                // No rows, safe to add as NOT NULL
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
        } else {
            // Column exists, check if it's nullable and has NULL values
            const isNullable = tableDescription['role_type']?.allowNull;
            if (isNullable) {
                // Fix any NULL values first
                await fixNullRoleTypeValues();
                // Try to make it NOT NULL
                try {
                    await queryInterface.changeColumn('users', 'role_type', {
                        type: Sequelize.DataTypes.ENUM(
                            'student',
                            'employer',
                            'superAdmin',
                            'admin',
                        ),
                        allowNull: false,
                    });
                    logger.info('✅ role_type column updated to NOT NULL');
                } catch (alterErr: any) {
                    logger.warn(
                        `⚠️  Could not set role_type to NOT NULL: ${alterErr.message}`,
                    );
                }
            }
        }
    } catch (err: any) {
        logger.warn(`⚠️  Could not handle role_type column: ${err.message}`);
    }
};

// Sync DB
// Note: alter: true can cause issues with foreign keys in PostgreSQL when tables already exist
// For now, using force: false to only create tables if they don't exist
// For schema changes, use migrations instead of sync

// Initialize sync process
(async () => {
    try {
        // First, ensure user table columns exist (this handles adding role_type if needed)
        logger.info('Ensuring user table columns exist...');
        await ensureUserTableColumns();

        // Fix any NULL role_type values BEFORE syncing
        logger.info('Checking for NULL role_type values...');
        const fixSuccess = await fixNullRoleTypeValues();

        if (!fixSuccess) {
            logger.warn(
                '⚠️  Could not fix all NULL role_type values, but proceeding with sync...',
            );
        }

        // Now proceed with sync - but first temporarily make role_type nullable in sync
        // We'll fix it after sync completes
        logger.info('Starting database sync...');

        // Use sync with alter, but catch and handle role_type errors specifically
        try {
            await sequelize.sync({ alter: true });
            logger.info('✅ Database synced');
        } catch (syncErr: any) {
            // If sync fails due to role_type null values, try to fix and retry
            if (
                (syncErr.message &&
                    syncErr.message.includes('role_type') &&
                    syncErr.message.includes('null values')) ||
                syncErr.message.includes('contains null values')
            ) {
                logger.info(
                    '⚠️  Database sync failed due to NULL role_type values, fixing and retrying...',
                );

                // Fix NULL values
                const retryFixSuccess = await fixNullRoleTypeValues();

                if (retryFixSuccess) {
                    // Retry sync
                    try {
                        await sequelize.sync({ alter: true });
                        logger.info(
                            '✅ Database synced successfully after fixing NULL values',
                        );
                    } catch (retryErr: any) {
                        logger.error(
                            '❌ Database sync still failed after fixing NULL values:',
                            retryErr.message,
                        );
                        // Continue anyway - ensure columns
                        await ensureUserTableColumns().catch(() => {});
                    }
                } else {
                    logger.error(
                        '❌ Could not fix NULL role_type values, sync may fail',
                    );
                    // Try to continue anyway
                    await ensureUserTableColumns().catch(() => {});
                }
            } else {
                // Other sync errors
                logger.error(
                    '❌ Database sync error:',
                    syncErr.message || syncErr,
                );
                // If it's a foreign key or constraint error and table might exist, continue
                if (
                    syncErr.message &&
                    (syncErr.message.includes('FOREIGN KEY') ||
                        syncErr.message.includes('constraint') ||
                        syncErr.message.includes('already exists'))
                ) {
                    logger.warn(
                        '⚠️  Sync warning (table may already exist) - continuing anyway',
                    );
                    await ensureUserTableColumns().catch(() => {});
                }
            }
        }

        // Final check and fix
        logger.info('Performing final check on role_type column...');
        await fixNullRoleTypeValues();

        // Ensure all columns are correct
        await ensureUserTableColumns();
    } catch (err: any) {
        logger.error(
            '❌ Error during database initialization:',
            err.message || err,
        );
        // Try to continue anyway
        try {
            await ensureUserTableColumns();
            await fixNullRoleTypeValues();
        } catch (finalErr) {
            logger.warn('⚠️  Could not complete final column checks');
        }
    }
})();

export const DB = {
    Users,
    Roles,
    Jobs,
    JobApplications,
    AcademicVerifications,
    Notifications,
    JobQuestions,
    JobApplicationAnswers,
    UserSkills,
    UserEmployments,
    UserEducations,
    UserProjects,
    UserAccomplishments,
    UserExtendedProfiles,
    sequelize,
    Sequelize,
};
