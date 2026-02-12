'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Column already exists in the initial creation, so nothing to do
    console.log('roleType column already exists in roles table');
  },

  async down(queryInterface, Sequelize) {
    // No changes made, so nothing to undo
    console.log('No rollback needed');
  },
};
