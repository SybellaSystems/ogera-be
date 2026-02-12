'use strict';

const { randomUUID } = require('crypto');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if roles already exist
        const [existingRoles] = await queryInterface.sequelize.query(
            `SELECT id FROM roles WHERE role_name IN ('student', 'employer') LIMIT 2`,
        );

        if (existingRoles.length > 0) {
            console.log('Student or employer roles already exist, skipping...');
            return;
        }

        // Prepare the data for both roles
        const rolesData = [
            {
                id: randomUUID(),
                role_name: 'student',
                role_type: 'student',
                permission_json: JSON.stringify([]),
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: randomUUID(),
                role_name: 'employer',
                role_type: 'employer',
                permission_json: JSON.stringify([]),
                created_at: new Date(),
                updated_at: new Date(),
            },
        ];

        // Insert the roles
        await queryInterface.bulkInsert('roles', rolesData, {});

        console.log('Student and employer roles created successfully!');
    },

    async down(queryInterface, Sequelize) {
        // Delete the roles
        await queryInterface.bulkDelete('roles', { role_name: { [Sequelize.Op.in]: ['student', 'employer'] } }, {});
        console.log('Student and employer roles removed successfully!');
    },
};
