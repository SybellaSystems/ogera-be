'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('peer_reviews', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      link_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'student_links',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      reviewer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },

      review: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM('published', 'hidden'),
        allowNull: false,
        defaultValue: 'published',
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
    await queryInterface.dropTable('peer_reviews');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_peer_reviews_status";'
    );
  },
};