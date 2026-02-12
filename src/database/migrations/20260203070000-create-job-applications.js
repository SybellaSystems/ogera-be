"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_applications', {
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Pending','Accepted','Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      cover_letter: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      resume_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      applied_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reviewed_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_applications');
    // Drop ENUM type if necessary (Postgres)
    try {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_job_applications_status\";");
    } catch (e) {
      // ignore
    }
  },
};
