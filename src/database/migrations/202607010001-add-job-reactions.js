'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add likes_count column
    await queryInterface.addColumn('jobs', 'likes_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // Add dislikes_count column
    await queryInterface.addColumn('jobs', 'dislikes_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // Create job_reactions table
    await queryInterface.createTable('job_reactions', {
      reaction_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true,
      },

      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'job_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

      reaction_type: {
        type: Sequelize.ENUM('like', 'dislike'),
        allowNull: false,
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

    // One reaction per user per job
    await queryInterface.addConstraint('job_reactions', {
      fields: ['job_id', 'user_id'],
      type: 'unique',
      name: 'unique_job_user_reaction',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove unique constraint
    await queryInterface.removeConstraint(
      'job_reactions',
      'unique_job_user_reaction'
    );

    // Drop table
    await queryInterface.dropTable('job_reactions');

    // Remove columns
    await queryInterface.removeColumn('jobs', 'likes_count');
    await queryInterface.removeColumn('jobs', 'dislikes_count');

    // Remove ENUM type (PostgreSQL)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_job_reactions_reaction_type";'
    );
  },
};