'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users').catch(() => null);
    if (!table) return;

    // Add optional 2FA fields for Google Authenticator (TOTP)
    if (!table.two_fa_enabled) {
      await queryInterface.addColumn('users', 'two_fa_enabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!table.two_fa_secret) {
      await queryInterface.addColumn('users', 'two_fa_secret', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users').catch(() => null);
    if (!table) return;

    if (table.two_fa_secret) {
      await queryInterface.removeColumn('users', 'two_fa_secret');
    }
    if (table.two_fa_enabled) {
      await queryInterface.removeColumn('users', 'two_fa_enabled');
    }
  },
};

