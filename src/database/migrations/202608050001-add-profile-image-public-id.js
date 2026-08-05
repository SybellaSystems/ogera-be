'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users').catch(() => null);

    if (table && !table.profile_image_public_id) {
      await queryInterface.addColumn('users', 'profile_image_public_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users').catch(() => null);

    if (table && table.profile_image_public_id) {
      await queryInterface.removeColumn('users', 'profile_image_public_id');
    }
  },
};