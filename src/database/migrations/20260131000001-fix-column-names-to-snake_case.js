'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableDescription = await queryInterface.describeTable('roles');
      
      // If 'roleName' exists, rename to 'role_name'
      if (tableDescription.roleName && !tableDescription.role_name) {
        await queryInterface.renameColumn('roles', 'roleName', 'role_name');
        console.log('✅ Renamed "roleName" to "role_name"');
      }
      
      // If 'roleType' exists, rename to 'role_type'
      if (tableDescription.roleType && !tableDescription.role_type) {
        await queryInterface.renameColumn('roles', 'roleType', 'role_type');
        console.log('✅ Renamed "roleType" to "role_type"');
      }
    } catch (error) {
      console.error('Error in migration:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableDescription = await queryInterface.describeTable('roles');
      
      if (tableDescription.role_name && !tableDescription.roleName) {
        await queryInterface.renameColumn('roles', 'role_name', 'roleName');
        console.log('✅ Renamed "role_name" back to "roleName"');
      }
      
      if (tableDescription.role_type && !tableDescription.roleType) {
        await queryInterface.renameColumn('roles', 'role_type', 'roleType');
        console.log('✅ Renamed "role_type" back to "roleType"');
      }
    } catch (error) {
      console.error('Error in rollback:', error.message);
      throw error;
    }
  },
};
