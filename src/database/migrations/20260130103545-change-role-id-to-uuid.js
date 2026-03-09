'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ID is already UUID in the initial creation, so nothing to do
    console.log('id column is already UUID in roles table');
  },

  async down(queryInterface, Sequelize) {
    // No changes made, so nothing to undo
    console.log('No rollback needed');
  },
};
