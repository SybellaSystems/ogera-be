'use strict';

const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const sequelize = queryInterface.sequelize;

        // Get the actual table structure to determine column names
        const rolesTableDescription = await queryInterface.describeTable('roles');
        const rolesColumns = Object.keys(rolesTableDescription);
        
        const usersTableDescription = await queryInterface.describeTable('users');
        const usersColumns = Object.keys(usersTableDescription);

        // Find the actual column names (could be camelCase or snake_case)
        const roleNameColumn = rolesColumns.find(col => 
            col.toLowerCase() === 'rolename' || col.toLowerCase() === 'role_name'
        );
        const roleIdColumn = rolesColumns.find(col => 
            col.toLowerCase() === 'id'
        ) || 'id';
        const roleTypeColumn = rolesColumns.find(col => 
            col.toLowerCase() === 'roletype' || col.toLowerCase() === 'role_type'
        );

        const emailColumn = usersColumns.find(col => 
            col.toLowerCase() === 'email'
        ) || 'email';
        const roleIdUserColumn = usersColumns.find(col => 
            col.toLowerCase() === 'roleid' || col.toLowerCase() === 'role_id'
        );
        const roleTypeUserColumn = usersColumns.find(col => 
            col.toLowerCase() === 'roletype' || col.toLowerCase() === 'role_type'
        );
        const passwordHashColumn = usersColumns.find(col => 
            col.toLowerCase() === 'passwordhash' || col.toLowerCase() === 'password_hash'
        );
        const fullNameColumn = usersColumns.find(col => 
            col.toLowerCase() === 'fullname' || col.toLowerCase() === 'full_name'
        );
        const mobileNumberColumn = usersColumns.find(col => 
            col.toLowerCase() === 'mobilenumber' || col.toLowerCase() === 'mobile_number'
        );

        if (!roleNameColumn || !roleIdColumn || !emailColumn || !roleIdUserColumn || 
            !roleTypeUserColumn || !passwordHashColumn || !fullNameColumn || !mobileNumberColumn) {
            throw new Error('Could not find required columns in roles or users table');
        }

        // Check if the user already exists
        const dialect = sequelize.getDialect();
        const quoteChar = dialect === 'postgres' ? '"' : '`';
        const [existingUser] = await sequelize.query(
            `SELECT user_id FROM users WHERE ${quoteChar}${emailColumn}${quoteChar} = 'superadmin@example.com' LIMIT 1`,
        );

        if (existingUser.length > 0) {
            console.log('Superadmin user already exists, skipping...');
            return;
        }

        // Get the superadmin role first
        const roleTypeCol = roleTypeColumn || 'role_type';
        const [superadminRoles] = await sequelize.query(
            `SELECT ${quoteChar}${roleIdColumn}${quoteChar} as role_id, ${quoteChar}${roleTypeCol}${quoteChar} as role_type FROM roles WHERE ${quoteChar}${roleNameColumn}${quoteChar} = 'superadmin' LIMIT 1`,
        );

        if (superadminRoles.length === 0) {
            throw new Error('Superadmin role does not exist. Please run the roles seeder first.');
        }

        const superadminRole = superadminRoles[0];
        // Handle both camelCase and snake_case result keys
        const roleId = superadminRole.role_id || superadminRole.roleId || superadminRole[roleIdColumn] || superadminRole.id;
        const roleType = superadminRole.role_type || superadminRole.roleType || 'superAdmin';

        // Hash the password
        const password = 'Admin@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Prepare user data
        const userData = {
            user_id: randomUUID(),
            [emailColumn]: 'superadmin@example.com',
            [passwordHashColumn]: hashedPassword,
            [roleIdUserColumn]: roleId,
            [roleTypeUserColumn]: roleType,
            [fullNameColumn]: 'Super Admin', // Default full name
            [mobileNumberColumn]: '0000000000', // Placeholder for required field
            terms_accepted: true,
            privacy_accepted: true,
            terms_accepted_at: new Date(),
            privacy_accepted_at: new Date(),
            email_verified: true, // Superadmin should have verified email
            phone_verified: false,
            two_fa_enabled: false,
            created_at: new Date(),
            updated_at: new Date(),
        };

        // Insert the user
        await queryInterface.bulkInsert('users', [userData], {});

        console.log('Superadmin user created successfully!');
        console.log('Email: superadmin@example.com');
        console.log('Password: Admin@123');
    },

    async down(queryInterface, Sequelize) {
        const sequelize = queryInterface.sequelize;

        // Get the actual table structure to determine column names
        const usersTableDescription = await queryInterface.describeTable('users');
        const usersColumns = Object.keys(usersTableDescription);

        const emailColumn = usersColumns.find(col => 
            col.toLowerCase() === 'email'
        ) || 'email';

        // Delete the superadmin user
        const whereClause = {};
        whereClause[emailColumn] = 'superadmin@example.com';

        await queryInterface.bulkDelete('users', whereClause, {});

        console.log('Superadmin user removed successfully!');
    },
};

