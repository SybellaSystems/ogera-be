'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'new_column', {
      type: Sequelize.STRING(100), // Change type as needed
      allowNull: true,             // Change based on whether column is required
      defaultValue: null,          // Optional default value
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'new_column');
  },
};
