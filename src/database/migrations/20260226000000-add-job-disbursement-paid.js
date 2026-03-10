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
    if (desc && desc.disbursement_reference_id) return;

    await queryInterface.addColumn(table, "disbursement_reference_id", {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn(table, "paid_at", {
      type: Sequelize.DATE,
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
    if (desc && desc.disbursement_reference_id) {
      await queryInterface.removeColumn(table, "disbursement_reference_id");
    }
    if (desc && desc.paid_at) {
      await queryInterface.removeColumn(table, "paid_at");
    }
  },
};
