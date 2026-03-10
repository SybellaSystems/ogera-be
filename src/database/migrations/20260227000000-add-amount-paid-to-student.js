"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = "jobs";
    let desc = null;
    try {
      desc = await queryInterface.describeTable(table);
    } catch (e) {
      desc = null;
    }
    if (desc && desc.amount_paid_to_student) return;

    await queryInterface.addColumn(table, "amount_paid_to_student", {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const table = "jobs";
    let desc = null;
    try {
      desc = await queryInterface.describeTable(table);
    } catch (e) {
      desc = null;
    }
    if (desc && desc.amount_paid_to_student) {
      await queryInterface.removeColumn(table, "amount_paid_to_student");
    }
  },
};
