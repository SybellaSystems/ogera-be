"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // make migration idempotent: only add column if it doesn't exist
    let tableDesc = null;
    try {
      tableDesc = await queryInterface.describeTable('job_applications');
    } catch (e) {
      tableDesc = null;
    }
    if (tableDesc && tableDesc.completed_at) {
      // column already exists, skip
      return;
    }
    await queryInterface.addColumn('job_applications', 'completed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    // remove only if column exists
    let tableDesc = null;
    try {
      tableDesc = await queryInterface.describeTable('job_applications');
    } catch (e) {
      tableDesc = null;
    }
    if (tableDesc && tableDesc.completed_at) {
      await queryInterface.removeColumn('job_applications', 'completed_at');
    }
  },
};
