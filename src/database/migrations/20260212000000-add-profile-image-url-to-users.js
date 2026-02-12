"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    let tableDesc = null;
    try {
      tableDesc = await queryInterface.describeTable('users');
    } catch (e) {
      tableDesc = null;
    }
    if (tableDesc && tableDesc.profile_image_url) {
      return;
    }
    await queryInterface.addColumn('users', 'profile_image_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    let tableDesc = null;
    try {
      tableDesc = await queryInterface.describeTable('users');
    } catch (e) {
      tableDesc = null;
    }
    if (tableDesc && tableDesc.profile_image_url) {
      await queryInterface.removeColumn('users', 'profile_image_url');
    }
  },
};
