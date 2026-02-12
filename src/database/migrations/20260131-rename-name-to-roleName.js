'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // No action needed - roleName column is already correct
    console.log('roleName column already exists');
  },

  async down(queryInterface, Sequelize) {
    // No rollback needed
    console.log('No rollback needed');
  },
};
