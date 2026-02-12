'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users').catch(() => null);
    if (table) {
      await queryInterface.addColumn('users', 'new_column', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users').catch(() => null);
    if (table) {
      await queryInterface.removeColumn('users', 'new_column');
    }
  },
};
