'use strict';

const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const sequelize = queryInterface.sequelize;

        // Check if the user already exists
        const [existingUser] = await sequelize.query(
            `SELECT user_id FROM users WHERE email = 'superadmin@example.com' LIMIT 1`,
        );

        if (existingUser.length > 0) {
            console.log('Superadmin user already exists, skipping...');
            return;
        }

        // Get the superadmin role first
        const [superadminRoles] = await sequelize.query(
            `SELECT id, role_type FROM roles WHERE role_name = 'superadmin' LIMIT 1`,
        );

        if (superadminRoles.length === 0) {
            throw new Error('Superadmin role does not exist. Please run the roles seeder first.');
        }

        const superadminRole = superadminRoles[0];
        const roleId = superadminRole.id;
        const roleType = superadminRole.role_type || 'superAdmin';

        // Hash the password
        const password = 'Admin@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the user
        await queryInterface.bulkInsert('users', [{
            user_id: randomUUID(),
            email: 'superadmin@example.com',
            password_hash: hashedPassword,
            role_id: roleId,
            role_type: roleType,
            full_name: 'Super Admin',
            mobile_number: '0000000000',
            terms_accepted: true,
            privacy_accepted: true,
            terms_accepted_at: new Date(),
            privacy_accepted_at: new Date(),
            email_verified: true,
            phone_verified: false,
            two_fa_enabled: false,
            created_at: new Date(),
            updated_at: new Date(),
        }], {});

        console.log('Superadmin user created successfully!');
        console.log('Email: superadmin@example.com');
        console.log('Password: Admin@123');
    },

    async down(queryInterface, Sequelize) {
        // Delete the superadmin user
        await queryInterface.bulkDelete('users', { email: 'superadmin@example.com' }, {});
        console.log('Superadmin user removed successfully!');
    },
};

