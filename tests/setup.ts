process.env.NODE_ENV = 'test';

// Database configuration for Jest tests
process.env.DB_NAME = process.env.DB_NAME || 'ogera_test';
process.env.DB_USERNAME = process.env.DB_USERNAME || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_DIALECT = process.env.DB_DIALECT || 'postgres';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';

// JWT configuration for Jest tests
process.env.JWT_ACCESS_TOKEN_SECRET =
    process.env.JWT_ACCESS_TOKEN_SECRET || 'test-access-token-secret';

process.env.JWT_REFRESH_TOKEN_SECRET =
    process.env.JWT_REFRESH_TOKEN_SECRET || 'test-refresh-token-secret';
