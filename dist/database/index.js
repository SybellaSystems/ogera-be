"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const sequelize_1 = __importDefault(require("sequelize"));
const dns_1 = __importDefault(require("dns"));
const user_model_1 = __importDefault(require("./models/user.model"));
const roles_model_1 = __importDefault(require("./models/roles.model"));
const permission_model_1 = __importDefault(require("./models/permission.model"));
const job_model_1 = __importDefault(require("./models/job.model"));
const jobCategory_model_1 = __importDefault(require("./models/jobCategory.model"));
const jobApplication_model_1 = __importDefault(require("./models/jobApplication.model"));
const academicVerification_model_1 = __importDefault(require("./models/academicVerification.model"));
const notification_model_1 = __importDefault(require("./models/notification.model"));
const jobQuestion_model_1 = __importDefault(require("./models/jobQuestion.model"));
const jobApplicationAnswer_model_1 = __importDefault(require("./models/jobApplicationAnswer.model"));
const userSkill_model_1 = __importDefault(require("./models/userSkill.model"));
const userEmployment_model_1 = __importDefault(require("./models/userEmployment.model"));
const userEducation_model_1 = __importDefault(require("./models/userEducation.model"));
const userProject_model_1 = __importDefault(require("./models/userProject.model"));
const userAccomplishment_model_1 = __importDefault(require("./models/userAccomplishment.model"));
const userExtendedProfile_model_1 = __importDefault(require("./models/userExtendedProfile.model"));
const course_model_1 = __importDefault(require("./models/course.model"));
const courseStep_model_1 = __importDefault(require("./models/courseStep.model"));
const courseProgress_model_1 = __importDefault(require("./models/courseProgress.model"));
const activityLog_model_1 = __importDefault(require("./models/activityLog.model"));
const transaction_model_1 = __importDefault(require("./models/transaction.model"));
const interview_model_1 = __importDefault(require("./models/interview.model"));
const dispute_model_1 = __importDefault(require("./models/dispute.model"));
const disputeEvidence_model_1 = __importDefault(require("./models/disputeEvidence.model"));
const disputeMessage_model_1 = __importDefault(require("./models/disputeMessage.model"));
const disputeTimeline_model_1 = __importDefault(require("./models/disputeTimeline.model"));
const index_1 = require("../association/index");
const config_1 = require("../config");
// Fix IPv6 timeout issues by forcing IPv4 DNS resolution
const originalLookup = dns_1.default.lookup;
dns_1.default.lookup = function (hostname, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    // Force IPv4 to avoid IPv6 timeout issues with Neon
    options = Object.assign(Object.assign({}, options), { family: 4 });
    return originalLookup(hostname, options, callback);
};
// Extract endpoint ID for Neon (everything before first dot)
const endpointId = (config_1.DB_HOST === null || config_1.DB_HOST === void 0 ? void 0 : config_1.DB_HOST.split('.')[0]) || '';
// Determine if SSL should be used
// SSL is required for cloud databases (Neon, AWS RDS, etc.) but not for local databases
const useSSL = process.env.DB_USE_SSL === 'true' ||
    (config_1.DB_HOST && !config_1.DB_HOST.includes('localhost') && !config_1.DB_HOST.includes('127.0.0.1'));
// Build dialect options conditionally
const dialectOptions = {};
if (useSSL) {
    dialectOptions.ssl = {
        require: true,
        rejectUnauthorized: false,
    };
    // Add endpoint parameter for Neon SNI support
    if (endpointId) {
        dialectOptions.options = `endpoint=${endpointId}`;
    }
    logger_1.default.info('🔒 SSL enabled for database connection');
}
else {
    logger_1.default.info('🔓 SSL disabled for local database connection');
}
const sequelize = new sequelize_1.default.Sequelize(config_1.DB_NAME, config_1.DB_USERNAME, config_1.DB_PASSWORD, {
    dialect: config_1.DB_DIALECT,
    host: config_1.DB_HOST,
    port: parseInt(config_1.DB_PORT, 10),
    timezone: '+09:00',
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        underscored: true,
        freezeTableName: true,
    },
    pool: { min: 0, max: 5 },
    logging: (query, time) => logger_1.default.info(time + 'ms ' + query),
    benchmark: true,
    dialectOptions,
});
// Test DB connection with improved error handling
sequelize
    .authenticate()
    .then(() => {
    logger_1.default.info('✅ Database connected successfully');
    logger_1.default.info(`📊 Database: ${config_1.DB_NAME} | Host: ${config_1.DB_HOST}:${config_1.DB_PORT}`);
})
    .catch((err) => {
    logger_1.default.error('❌ Database connection error:');
    logger_1.default.error('Error name:', err.name);
    logger_1.default.error('Error message:', err.message);
    if (err.parent) {
        logger_1.default.error('Parent error:', err.parent.message);
        logger_1.default.error('Parent error code:', err.parent.code);
    }
    logger_1.default.error('Full error:', err);
    logger_1.default.error('Please check your database configuration and ensure the database server is running');
    // Don't exit process - let the app continue and handle errors gracefully
});
// Initialize models
const Users = (0, user_model_1.default)(sequelize);
const Roles = (0, roles_model_1.default)(sequelize);
const Permissions = (0, permission_model_1.default)(sequelize);
const Jobs = (0, job_model_1.default)(sequelize);
const JobCategories = (0, jobCategory_model_1.default)(sequelize);
const JobApplications = (0, jobApplication_model_1.default)(sequelize);
const AcademicVerifications = (0, academicVerification_model_1.default)(sequelize);
const Notifications = (0, notification_model_1.default)(sequelize);
const JobQuestions = (0, jobQuestion_model_1.default)(sequelize);
const JobApplicationAnswers = (0, jobApplicationAnswer_model_1.default)(sequelize);
const UserSkills = (0, userSkill_model_1.default)(sequelize);
const UserEmployments = (0, userEmployment_model_1.default)(sequelize);
const UserEducations = (0, userEducation_model_1.default)(sequelize);
const UserProjects = (0, userProject_model_1.default)(sequelize);
const UserAccomplishments = (0, userAccomplishment_model_1.default)(sequelize);
const UserExtendedProfiles = (0, userExtendedProfile_model_1.default)(sequelize);
const Courses = (0, course_model_1.default)(sequelize);
const CourseSteps = (0, courseStep_model_1.default)(sequelize);
const CourseProgress = (0, courseProgress_model_1.default)(sequelize);
const ActivityLogs = (0, activityLog_model_1.default)(sequelize);
const Transactions = (0, transaction_model_1.default)(sequelize);
const Interviews = (0, interview_model_1.default)(sequelize);
const Disputes = (0, dispute_model_1.default)(sequelize);
const DisputeEvidence = (0, disputeEvidence_model_1.default)(sequelize);
const DisputeMessages = (0, disputeMessage_model_1.default)(sequelize);
const DisputeTimeline = (0, disputeTimeline_model_1.default)(sequelize);
// Attach hooks to ensure key events are logged to activity_logs when created
try {
    if (Transactions && ActivityLogs) {
        Transactions.afterCreate((tx) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield ActivityLogs.create({
                    user_id: tx.user_id || null,
                    action: 'payment_completed',
                    entity_type: 'Transaction',
                    entity_id: tx.id,
                    description: `Payment of ${tx.amount} ${tx.currency}`,
                    created_at: tx.created_at || new Date(),
                });
            }
            catch (e) {
                logger_1.default.warn('Failed to write transaction activity log:', e);
            }
        }));
    }
    if (Interviews && ActivityLogs) {
        Interviews.afterCreate((iv) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield ActivityLogs.create({
                    user_id: iv.student_id || null,
                    action: 'interview_scheduled',
                    entity_type: 'Interview',
                    entity_id: iv.id,
                    description: `Interview scheduled at ${iv.scheduled_at}`,
                    created_at: iv.created_at || new Date(),
                });
            }
            catch (e) {
                logger_1.default.warn('Failed to write interview activity log:', e);
            }
        }));
    }
    {
        // JobApplications model may not yet be exported to DB variable, attach via sequelize model name
        const JobAppsModel = sequelize.models['job_applications'] || sequelize.models['JobApplications'];
        if (JobAppsModel) {
            JobAppsModel.afterCreate((app) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield ActivityLogs.create({
                        user_id: app.student_id || null,
                        action: 'job_application',
                        entity_type: 'JobApplication',
                        entity_id: app.application_id || app.id,
                        description: `Applied to job ${app.job_id}`,
                        created_at: app.applied_at || new Date(),
                    });
                }
                catch (e) {
                    logger_1.default.warn('Failed to write job application activity log:', e);
                }
            }));
        }
    }
}
catch (hookErr) {
    logger_1.default.warn('Failed to attach model hooks for activity logging:', hookErr);
}
// Apply Associations
(0, index_1.setupAssociations)();
// Helper function to check and add missing columns safely
const ensureColumnExists = (tableName, columnName, columnConfig) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableDescription = yield queryInterface.describeTable(tableName);
        if (!tableDescription[columnName]) {
            logger_1.default.info(`Adding missing column ${columnName} to ${tableName}...`);
            yield queryInterface.addColumn(tableName, columnName, columnConfig);
            logger_1.default.info(`✅ Column ${columnName} added to ${tableName}`);
        }
        else {
            logger_1.default.info(`✅ Column ${columnName} already exists in ${tableName}`);
        }
    }
    catch (err) {
        // If column already exists or other error, just log it
        if (err.message &&
            !err.message.includes('already exists') &&
            !err.message.includes('duplicate') &&
            !err.message.includes('column') &&
            !err.message.includes('does not exist')) {
            logger_1.default.warn(`⚠️  Could not add column ${columnName} to ${tableName}: ${err.message}`);
        }
    }
});
// Function to fix NULL role_type values by updating from roles table
const fixNullRoleTypeValues = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const queryInterface = sequelize.getQueryInterface();
        // Check if users table exists
        let tableDescription;
        try {
            tableDescription = yield queryInterface.describeTable('users');
        }
        catch (err) {
            // Table doesn't exist, nothing to fix
            return true;
        }
        // Check if role_type column exists
        if (!tableDescription['role_type']) {
            logger_1.default.info('role_type column does not exist yet, nothing to fix');
            return true;
        }
        // Check if there are any NULL role_type values
        const [results] = (yield sequelize.query(`SELECT COUNT(*) as count FROM users WHERE role_type IS NULL`));
        const nullCount = parseInt(((_a = results[0]) === null || _a === void 0 ? void 0 : _a.count) || '0', 10);
        if (nullCount === 0) {
            logger_1.default.info('✅ No NULL role_type values found');
            return true;
        }
        logger_1.default.info(`Found ${nullCount} users with NULL role_type, updating from roles table...`);
        // Use the alternative method first (more reliable with Sequelize)
        try {
            const [usersWithNullRoleType] = (yield sequelize.query(`SELECT u.user_id, u.role_id, r.role_type 
                 FROM users u 
                 INNER JOIN roles r ON u.role_id = r.id 
                 WHERE u.role_type IS NULL`));
            if (usersWithNullRoleType.length > 0) {
                logger_1.default.info(`Updating ${usersWithNullRoleType.length} users with NULL role_type using Sequelize models...`);
                for (const user of usersWithNullRoleType) {
                    if (user.role_type) {
                        yield Users.update({ role_type: user.role_type }, { where: { user_id: user.user_id } });
                    }
                }
                // Verify the update worked
                const [verifyResults] = (yield sequelize.query(`SELECT COUNT(*) as count FROM users WHERE role_type IS NULL`));
                const remainingNulls = parseInt(((_b = verifyResults[0]) === null || _b === void 0 ? void 0 : _b.count) || '0', 10);
                if (remainingNulls === 0) {
                    logger_1.default.info('✅ Successfully updated all NULL role_type values');
                    return true;
                }
                else {
                    logger_1.default.warn(`⚠️  Still have ${remainingNulls} NULL role_type values after update`);
                    // Try direct SQL as fallback
                    throw new Error('Sequelize update did not fix all NULL values');
                }
            }
            else {
                logger_1.default.warn('⚠️  Found NULL role_type values but could not find matching roles');
                return false;
            }
        }
        catch (modelErr) {
            // Fallback to direct SQL update
            logger_1.default.info('Trying direct SQL update as fallback...');
            try {
                if (config_1.DB_DIALECT === 'postgres') {
                    // For PostgreSQL, get the enum type name for users.role_type
                    const [enumTypeResult] = (yield sequelize.query(`
                        SELECT DISTINCT t.typname as enum_name
                        FROM pg_type t 
                        JOIN pg_enum e ON t.oid = e.enumtypid 
                        JOIN pg_attribute a ON a.atttypid = t.oid 
                        JOIN pg_class c ON c.oid = a.attrelid 
                        WHERE c.relname = 'users' AND a.attname = 'role_type'
                        LIMIT 1
                    `));
                    const enumTypeName = (_c = enumTypeResult === null || enumTypeResult === void 0 ? void 0 : enumTypeResult[0]) === null || _c === void 0 ? void 0 : _c.enum_name;
                    if (enumTypeName) {
                        logger_1.default.info(`Found enum type: ${enumTypeName}, updating NULL values...`);
                        // Use the found enum type name - cast role_type from roles table to users enum
                        yield sequelize.query(`
                            UPDATE users 
                            SET role_type = CAST(r.role_type AS text)::${enumTypeName}
                            FROM roles r
                            WHERE users.role_id = r.id 
                            AND users.role_type IS NULL
                        `);
                    }
                    else {
                        // Try using USING clause or simpler cast
                        logger_1.default.info('Enum type not found, trying simpler update...');
                        yield sequelize.query(`
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
                    const [verifyResults] = (yield sequelize.query(`SELECT COUNT(*) as count FROM users WHERE role_type IS NULL`));
                    const remainingNulls = parseInt(((_d = verifyResults[0]) === null || _d === void 0 ? void 0 : _d.count) || '0', 10);
                    if (remainingNulls === 0) {
                        logger_1.default.info('✅ Successfully updated NULL role_type values using PostgreSQL SQL');
                        return true;
                    }
                    else {
                        logger_1.default.error(`❌ Still have ${remainingNulls} NULL values after SQL update`);
                        // Last resort: try using Sequelize models one by one
                        logger_1.default.info('Attempting individual updates as last resort...');
                        const [remainingUsers] = (yield sequelize.query(`SELECT u.user_id, r.role_type 
                             FROM users u 
                             INNER JOIN roles r ON u.role_id = r.id 
                             WHERE u.role_type IS NULL`));
                        for (const user of remainingUsers) {
                            try {
                                yield Users.update({ role_type: user.role_type }, {
                                    where: { user_id: user.user_id },
                                    individualHooks: false,
                                });
                            }
                            catch (updateErr) {
                                logger_1.default.warn(`Could not update user ${user.user_id}: ${updateErr.message}`);
                            }
                        }
                        return false;
                    }
                }
                else {
                    // For MySQL and other databases
                    yield sequelize.query(`
                        UPDATE users u
                        INNER JOIN roles r ON u.role_id = r.id
                        SET u.role_type = r.role_type
                        WHERE u.role_type IS NULL
                    `);
                    logger_1.default.info('✅ Successfully updated NULL role_type values using SQL');
                    return true;
                }
            }
            catch (sqlErr) {
                logger_1.default.error(`❌ Could not fix NULL role_type values with SQL: ${sqlErr.message}`);
                logger_1.default.info('Falling back to individual Sequelize model updates...');
                // Last resort: individual updates
                try {
                    const [remainingUsers] = (yield sequelize.query(`SELECT u.user_id, r.role_type 
                         FROM users u 
                         INNER JOIN roles r ON u.role_id = r.id 
                         WHERE u.role_type IS NULL`));
                    for (const user of remainingUsers) {
                        try {
                            yield Users.update({ role_type: user.role_type }, {
                                where: { user_id: user.user_id },
                                individualHooks: false,
                            });
                        }
                        catch (updateErr) {
                            logger_1.default.warn(`Could not update user ${user.user_id}: ${updateErr.message}`);
                        }
                    }
                    // Final verification
                    const [finalVerify] = (yield sequelize.query(`SELECT COUNT(*) as count FROM users WHERE role_type IS NULL`));
                    const finalNulls = parseInt(((_e = finalVerify[0]) === null || _e === void 0 ? void 0 : _e.count) || '0', 10);
                    if (finalNulls === 0) {
                        logger_1.default.info('✅ Successfully updated NULL role_type values using individual updates');
                        return true;
                    }
                }
                catch (finalErr) {
                    logger_1.default.error(`❌ Final fallback also failed: ${finalErr.message}`);
                }
                return false;
            }
        }
    }
    catch (err) {
        logger_1.default.error(`❌ Error in fixNullRoleTypeValues: ${err.message}`);
        return false;
    }
});
// Function to ensure job_categories table has job_count column
const ensureJobCategoriesTableColumns = () => __awaiter(void 0, void 0, void 0, function* () {
    const queryInterface = sequelize.getQueryInterface();
    try {
        // Check if job_categories table exists
        yield queryInterface.describeTable('job_categories');
    }
    catch (err) {
        // Table doesn't exist, sync will create it
        logger_1.default.info('Job categories table does not exist, will be created by sync');
        return;
    }
    // Add job_count if missing
    yield ensureColumnExists('job_categories', 'job_count', {
        type: sequelize_1.default.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    });
});
// Function to ensure all required user table columns exist
const ensureUserTableColumns = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const queryInterface = sequelize.getQueryInterface();
    try {
        // Check if users table exists
        yield queryInterface.describeTable('users');
    }
    catch (err) {
        // Table doesn't exist, sync will create it
        logger_1.default.info('Users table does not exist, will be created by sync');
        return;
    }
    // Add legacy id column if missing (used by some parts of the codebase)
    yield ensureColumnExists('users', 'id', {
        type: sequelize_1.default.DataTypes.UUID,
        allowNull: true, // keep nullable for existing rows; model will populate for new ones
    });
    // Add legacy name column if missing (used for backward‑compatibility)
    yield ensureColumnExists('users', 'name', {
        type: sequelize_1.default.DataTypes.STRING(255),
        allowNull: true,
        defaultValue: '',
    });
    // Add role_id if missing
    yield ensureColumnExists('users', 'role_id', {
        type: sequelize_1.default.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    });
    // Add terms_accepted if missing
    yield ensureColumnExists('users', 'terms_accepted', {
        type: sequelize_1.default.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
    // Add privacy_accepted if missing
    yield ensureColumnExists('users', 'privacy_accepted', {
        type: sequelize_1.default.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
    // Add terms_accepted_at if missing
    yield ensureColumnExists('users', 'terms_accepted_at', {
        type: sequelize_1.default.DataTypes.DATE,
        allowNull: true,
    });
    // Add privacy_accepted_at if missing
    yield ensureColumnExists('users', 'privacy_accepted_at', {
        type: sequelize_1.default.DataTypes.DATE,
        allowNull: true,
    });
    // Add email_verified if missing
    yield ensureColumnExists('users', 'email_verified', {
        type: sequelize_1.default.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
    // Add email_verification_token if missing
    yield ensureColumnExists('users', 'email_verification_token', {
        type: sequelize_1.default.DataTypes.STRING(255),
        allowNull: true,
    });
    // Add email_verification_token_expiry if missing
    yield ensureColumnExists('users', 'email_verification_token_expiry', {
        type: sequelize_1.default.DataTypes.DATE,
        allowNull: true,
    });
    // Add phone_verified if missing
    yield ensureColumnExists('users', 'phone_verified', {
        type: sequelize_1.default.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
    // Add phone_verification_otp if missing
    yield ensureColumnExists('users', 'phone_verification_otp', {
        type: sequelize_1.default.DataTypes.STRING(10),
        allowNull: true,
    });
    // Add phone_verification_otp_expiry if missing
    yield ensureColumnExists('users', 'phone_verification_otp_expiry', {
        type: sequelize_1.default.DataTypes.DATE,
        allowNull: true,
    });
    // Add reset_otp if missing
    yield ensureColumnExists('users', 'reset_otp', {
        type: sequelize_1.default.DataTypes.STRING(10),
        allowNull: true,
    });
    // Add reset_otp_expiry if missing
    yield ensureColumnExists('users', 'reset_otp_expiry', {
        type: sequelize_1.default.DataTypes.DATE,
        allowNull: true,
    });
    // Add two_fa_enabled if missing
    yield ensureColumnExists('users', 'two_fa_enabled', {
        type: sequelize_1.default.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
    // Add two_fa_secret if missing
    yield ensureColumnExists('users', 'two_fa_secret', {
        type: sequelize_1.default.DataTypes.TEXT,
        allowNull: true,
    });
    // Handle role_type column - rename from 'role' if it exists, or add if missing
    try {
        const tableDescription = yield queryInterface.describeTable('users');
        // If old 'role' column exists, rename it to 'role_type'
        if (tableDescription['role'] && !tableDescription['role_type']) {
            logger_1.default.info('Renaming old "role" column to "role_type"...');
            yield queryInterface.renameColumn('users', 'role', 'role_type');
            logger_1.default.info('✅ Column "role" renamed to "role_type"');
        }
        // If role_type doesn't exist, add it (as nullable first if table has rows)
        if (!tableDescription['role_type']) {
            // Check if table has existing rows
            const [rowCountResult] = (yield sequelize.query('SELECT COUNT(*) as count FROM users'));
            const rowCount = parseInt(((_a = rowCountResult === null || rowCountResult === void 0 ? void 0 : rowCountResult[0]) === null || _a === void 0 ? void 0 : _a.count) || '0', 10);
            if (rowCount > 0) {
                // Add column as nullable first
                logger_1.default.info('Adding role_type column as nullable (will update values and make NOT NULL after)...');
                yield ensureColumnExists('users', 'role_type', {
                    type: sequelize_1.default.DataTypes.ENUM('student', 'employer', 'superAdmin', 'admin'),
                    allowNull: true, // Start as nullable
                });
                // Update NULL values from roles table
                yield fixNullRoleTypeValues();
                // Now alter column to NOT NULL
                try {
                    yield queryInterface.changeColumn('users', 'role_type', {
                        type: sequelize_1.default.DataTypes.ENUM('student', 'employer', 'superAdmin', 'admin'),
                        allowNull: false,
                    });
                    logger_1.default.info('✅ role_type column updated to NOT NULL');
                }
                catch (alterErr) {
                    logger_1.default.warn(`⚠️  Could not set role_type to NOT NULL: ${alterErr.message}`);
                }
            }
            else {
                // No rows, safe to add as NOT NULL
                yield ensureColumnExists('users', 'role_type', {
                    type: sequelize_1.default.DataTypes.ENUM('student', 'employer', 'superAdmin', 'admin'),
                    allowNull: false,
                });
            }
        }
        else {
            // Column exists, check if it's nullable and has NULL values
            const isNullable = (_b = tableDescription['role_type']) === null || _b === void 0 ? void 0 : _b.allowNull;
            if (isNullable) {
                // Fix any NULL values first
                yield fixNullRoleTypeValues();
                // Try to make it NOT NULL
                try {
                    yield queryInterface.changeColumn('users', 'role_type', {
                        type: sequelize_1.default.DataTypes.ENUM('student', 'employer', 'superAdmin', 'admin'),
                        allowNull: false,
                    });
                    logger_1.default.info('✅ role_type column updated to NOT NULL');
                }
                catch (alterErr) {
                    logger_1.default.warn(`⚠️  Could not set role_type to NOT NULL: ${alterErr.message}`);
                }
            }
        }
    }
    catch (err) {
        logger_1.default.warn(`⚠️  Could not handle role_type column: ${err.message}`);
    }
});
// Sync DB
// Note: alter: true can cause issues with foreign keys in PostgreSQL when tables already exist
// For now, using force: false to only create tables if they don't exist
// For schema changes, use migrations instead of sync
// Initialize sync process
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // First, ensure user table columns exist (this handles adding role_type if needed)
        logger_1.default.info('Ensuring user table columns exist...');
        yield ensureUserTableColumns();
        // Ensure job_categories table has job_count column
        logger_1.default.info('Ensuring job_categories table columns exist...');
        yield ensureJobCategoriesTableColumns();
        // Fix any NULL role_type values BEFORE syncing
        logger_1.default.info('Checking for NULL role_type values...');
        const fixSuccess = yield fixNullRoleTypeValues();
        if (!fixSuccess) {
            logger_1.default.warn('⚠️  Could not fix all NULL role_type values, but proceeding with sync...');
        }
        // Now proceed with sync - but first temporarily make role_type nullable in sync
        // We'll fix it after sync completes
        logger_1.default.info('Starting database sync...');
        // Use sync with alter, but catch and handle role_type errors specifically
        try {
            yield sequelize.sync({ alter: false });
            logger_1.default.info('✅ Database synced');
        }
        catch (syncErr) {
            // If sync fails due to role_type null values, try to fix and retry
            if ((syncErr.message &&
                syncErr.message.includes('role_type') &&
                syncErr.message.includes('null values')) ||
                syncErr.message.includes('contains null values')) {
                logger_1.default.info('⚠️  Database sync failed due to NULL role_type values, fixing and retrying...');
                // Fix NULL values
                const retryFixSuccess = yield fixNullRoleTypeValues();
                if (retryFixSuccess) {
                    // Retry sync
                    try {
                        yield sequelize.sync({ alter: false });
                        logger_1.default.info('✅ Database synced successfully after fixing NULL values');
                    }
                    catch (retryErr) {
                        logger_1.default.error('❌ Database sync still failed after fixing NULL values:', retryErr.message);
                        // Continue anyway - ensure columns
                        yield ensureUserTableColumns().catch(() => { });
                    }
                }
                else {
                    logger_1.default.error('❌ Could not fix NULL role_type values, sync may fail');
                    // Try to continue anyway
                    yield ensureUserTableColumns().catch(() => { });
                }
            }
            else {
                // Other sync errors
                logger_1.default.error('❌ Database sync error:', syncErr.message || syncErr);
                // If it's a foreign key or constraint error and table might exist, continue
                if (syncErr.message &&
                    (syncErr.message.includes('FOREIGN KEY') ||
                        syncErr.message.includes('constraint') ||
                        syncErr.message.includes('already exists'))) {
                    logger_1.default.warn('⚠️  Sync warning (table may already exist) - continuing anyway');
                    yield ensureUserTableColumns().catch(() => { });
                }
            }
        }
        // Final check and fix
        logger_1.default.info('Performing final check on role_type column...');
        yield fixNullRoleTypeValues();
        // Ensure all columns are correct
        yield ensureUserTableColumns();
        yield ensureJobCategoriesTableColumns();
    }
    catch (err) {
        logger_1.default.error('❌ Error during database initialization:', err.message || err);
        // Try to continue anyway
        try {
            yield ensureUserTableColumns();
            yield ensureJobCategoriesTableColumns();
            yield fixNullRoleTypeValues();
        }
        catch (finalErr) {
            logger_1.default.warn('⚠️  Could not complete final column checks');
        }
    }
}))();
exports.DB = {
    Users,
    Roles,
    Permissions,
    Jobs,
    JobCategories,
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
    Courses,
    CourseSteps,
    CourseProgress,
    ActivityLogs,
    Transactions,
    Interviews,
    Disputes,
    DisputeEvidence,
    DisputeMessages,
    DisputeTimeline,
    sequelize,
    Sequelize: sequelize_1.default,
};
