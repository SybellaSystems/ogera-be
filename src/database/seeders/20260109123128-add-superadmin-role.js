'use strict';

const { randomUUID } = require('crypto');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if superadmin already exists
        const [existingRole] = await queryInterface.sequelize.query(
            `SELECT id FROM roles WHERE role_name = 'superadmin' LIMIT 1`
        );

        if (existingRole.length > 0) {
            console.log('Superadmin role already exists, skipping...');
            return;
        }

        // Insert superadmin
        await queryInterface.bulkInsert('roles', [{
            id: randomUUID(),
            role_name: 'superadmin',
            role_type: 'superAdmin',
            permission_json: JSON.stringify([]),
            created_at: new Date(),
            updated_at: new Date(),
        }], {});

        console.log('Superadmin role created successfully!');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('roles', { role_name: 'superadmin' }, {});
        console.log('Superadmin role removed successfully!');
    },
};
