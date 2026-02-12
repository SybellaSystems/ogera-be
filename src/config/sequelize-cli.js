const { config } = require('dotenv');
const path = require('path');

// Try loading .env file first, then .env.{NODE_ENV}
config({ path: path.resolve(process.cwd(), '.env') });
if (process.env.NODE_ENV) {
    config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`), override: false });
}

const { DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_HOST, DB_DIALECT, DB_USE_SSL } =
    process.env;

// Validate required fields
if (!DB_DIALECT) {
    console.error('ERROR: DB_DIALECT is not set in environment variables');
    process.exit(1);
}

// Determine if SSL should be used
// SSL is required for cloud databases (Neon, AWS RDS, etc.) but not for local databases
const useSSL = DB_USE_SSL === 'true' || 
               (DB_HOST && !DB_HOST.includes('localhost') && !DB_HOST.includes('127.0.0.1'));

// Build dialect options conditionally
const dialectOptions = {};

if (useSSL) {
    dialectOptions.ssl = {
        require: true,
        rejectUnauthorized: false,
    };
}

module.exports = {
    username: DB_USERNAME || 'postgres',
    password: DB_PASSWORD || '',
    database: DB_NAME || 'ogera_db',
    port: DB_PORT || 5432,
    host: DB_HOST || 'localhost',
    dialect: DB_DIALECT || 'postgres',
    migrationStorageTableName: 'sequelize_migrations',
    seederStorageTableName: 'sequelize_seeds',
    dialectOptions,
};
