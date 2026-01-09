'use strict';

const { randomUUID } = require('crypto');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Get the actual table structure to determine column names
        const tableDescription = await queryInterface.describeTable('roles');
        const columns = Object.keys(tableDescription);
        
        // Find the actual column name (could be 'roleName' or 'role_name')
        const roleNameColumn = columns.find(col => 
            col.toLowerCase() === 'rolename' || col.toLowerCase() === 'role_name'
        );
        const roleTypeColumn = columns.find(col => 
            col.toLowerCase() === 'roletype' || col.toLowerCase() === 'role_type'
        );
        
        if (!roleNameColumn) {
            throw new Error('Could not find roleName column in roles table');
        }
        
        // Check if the role already exists using the actual column name
        // PostgreSQL requires double quotes for case-sensitive column names
        const dialect = queryInterface.sequelize.getDialect();
        const quoteChar = dialect === 'postgres' ? '"' : '`';
        const [existingRole] = await queryInterface.sequelize.query(
            `SELECT id FROM roles WHERE ${quoteChar}${roleNameColumn}${quoteChar} = 'superadmin' LIMIT 1`,
        );

        if (existingRole.length > 0) {
            console.log('Superadmin role already exists, skipping...');
            return;
        }

        // Prepare the data object using the actual column names
        const roleData = {
            id: randomUUID(),
            [roleNameColumn]: 'superadmin',
            [roleTypeColumn || 'role_type']: 'superAdmin',
            permission_json: JSON.stringify([]),
            created_at: new Date(),
            updated_at: new Date(),
        };

        // Insert the role using the actual column names
        await queryInterface.bulkInsert('roles', [roleData], {});

        console.log('Superadmin role created successfully!');
    },

    async down(queryInterface, Sequelize) {
        // Get the actual table structure to determine column names
        const tableDescription = await queryInterface.describeTable('roles');
        const columns = Object.keys(tableDescription);
        
        const roleNameColumn = columns.find(col => 
            col.toLowerCase() === 'rolename' || col.toLowerCase() === 'role_name'
        ) || 'role_name';

        // Delete the role using the actual column name
        const whereClause = {};
        whereClause[roleNameColumn] = 'superadmin';
        
        await queryInterface.bulkDelete('roles', whereClause, {});

        console.log('Superadmin role removed successfully!');
    },
};

