'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableDescription = await queryInterface.describeTable('roles');
      
      // If 'name' column exists and 'roleName' doesn't, rename it
      if (tableDescription.name && !tableDescription.roleName) {
        await queryInterface.renameColumn('roles', 'name', 'roleName');
        console.log('✅ Renamed "name" column to "roleName"');
      } else if (tableDescription.roleName) {
        console.log('✅ "roleName" column already exists');
      } else if (tableDescription.name) {
        console.log('⚠️ Found "name" column but not "roleName"');
      }
    } catch (error) {
      console.error('❌ Error in migration:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableDescription = await queryInterface.describeTable('roles');
      
      if (tableDescription.roleName && !tableDescription.name) {
        await queryInterface.renameColumn('roles', 'roleName', 'name');
        console.log('✅ Renamed "roleName" column back to "name"');
      }
    } catch (error) {
      console.error('❌ Error in rollback:', error.message);
      throw error;
    }
  },
};
