'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('student_links', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      link_type: {
        type: Sequelize.ENUM('github', 'linkedin', 'portfolio'),
        allowNull: false,
      },

      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      visibility: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('student_links');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_student_links_link_type";'
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_student_links_status";'
    );
  },
};