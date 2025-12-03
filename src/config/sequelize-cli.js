const { config } = require('dotenv');
const path = require('path');

// Try loading .env file first, then .env.{NODE_ENV}
config({ path: path.resolve(process.cwd(), '.env') });
if (process.env.NODE_ENV) {
    config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`), override: false });
}

const { DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_HOST, DB_DIALECT } =
    process.env;

// Validate required fields
if (!DB_DIALECT) {
    console.error('ERROR: DB_DIALECT is not set in environment variables');
    process.exit(1);
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
};
