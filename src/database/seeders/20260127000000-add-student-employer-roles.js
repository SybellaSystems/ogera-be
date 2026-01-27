'use strict';

const { randomUUID } = require('crypto');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Get the actual table structure to determine column names
        const tableDescription = await queryInterface.describeTable('roles');
        const columns = Object.keys(tableDescription);
        
        // Find the actual column name
        const roleNameColumn = columns.find(col => 
            col.toLowerCase() === 'rolename' || col.toLowerCase() === 'role_name'
        );
        const roleTypeColumn = columns.find(col => 
            col.toLowerCase() === 'roletype' || col.toLowerCase() === 'role_type'
        );
        
        if (!roleNameColumn) {
            throw new Error('Could not find roleName column in roles table');
        }
        
        // Check if roles already exist
        const dialect = queryInterface.sequelize.getDialect();
        const quoteChar = dialect === 'postgres' ? '"' : '`';
        const [existingRoles] = await queryInterface.sequelize.query(
            `SELECT id FROM roles WHERE ${quoteChar}${roleNameColumn}${quoteChar} IN ('student', 'employer') LIMIT 2`,
        );

        if (existingRoles.length > 0) {
            console.log('Student or employer roles already exist, skipping...');
            return;
        }

        // Prepare the data for both roles
        const rolesData = [
            {
                id: randomUUID(),
                [roleNameColumn]: 'student',
                [roleTypeColumn || 'role_type']: 'student',
                permission_json: JSON.stringify([]),
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: randomUUID(),
                [roleNameColumn]: 'employer',
                [roleTypeColumn || 'role_type']: 'employer',
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
        // Get the actual table structure to determine column names
        const tableDescription = await queryInterface.describeTable('roles');
        const columns = Object.keys(tableDescription);
        
        const roleNameColumn = columns.find(col => 
            col.toLowerCase() === 'rolename' || col.toLowerCase() === 'role_name'
        ) || 'role_name';

        // Delete the roles using the actual column name
        const whereClause = {};
        whereClause[roleNameColumn] = { [Sequelize.Op.in]: ['student', 'employer'] };
        
        await queryInterface.bulkDelete('roles', whereClause, {});

        console.log('Student and employer roles removed successfully!');
    },
};
