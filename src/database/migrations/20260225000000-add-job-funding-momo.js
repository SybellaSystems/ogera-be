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
    if (desc && desc.funding_status) return;

    await queryInterface.addColumn(table, "funding_status", {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: "Unfunded",
    });
    await queryInterface.addColumn(table, "momo_reference_id", {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn(table, "momo_paid_at", {
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
    if (desc && desc.funding_status) {
      await queryInterface.removeColumn(table, "funding_status");
    }
    if (desc && desc.momo_reference_id) {
      await queryInterface.removeColumn(table, "momo_reference_id");
    }
    if (desc && desc.momo_paid_at) {
      await queryInterface.removeColumn(table, "momo_paid_at");
    }
  },
};
