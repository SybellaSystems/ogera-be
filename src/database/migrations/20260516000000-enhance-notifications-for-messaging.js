'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('notifications');
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'enum_notifications_type'
              AND e.enumlabel = 'new_message'
          ) THEN
            ALTER TYPE "enum_notifications_type" ADD VALUE 'new_message';
          END IF;
        END $$;
      `);
    }

    if (!table.action_url) {
      await queryInterface.addColumn('notifications', 'action_url', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!table.entity_type) {
      await queryInterface.addColumn('notifications', 'entity_type', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!table.entity_id) {
      await queryInterface.addColumn('notifications', 'entity_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    if (!table.metadata) {
      await queryInterface.addColumn('notifications', 'metadata', {
        type: dialect === 'postgres' ? Sequelize.JSONB : Sequelize.JSON,
        allowNull: true,
      });
    }

    if (!table.read_at) {
      await queryInterface.addColumn('notifications', 'read_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table.email_sent_at) {
      await queryInterface.addColumn('notifications', 'email_sent_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    const indexes = await queryInterface.showIndex('notifications');
    const indexNames = new Set(indexes.map((index) => index.name));

    if (!indexNames.has('idx_notifications_user_read_created')) {
      await queryInterface.addIndex('notifications', ['user_id', 'is_read', 'created_at'], {
        name: 'idx_notifications_user_read_created',
      });
    }

    if (!indexNames.has('idx_notifications_type_related_created')) {
      await queryInterface.addIndex('notifications', ['type', 'related_id', 'created_at'], {
        name: 'idx_notifications_type_related_created',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('notifications');
    const indexes = await queryInterface.showIndex('notifications');
    const indexNames = new Set(indexes.map((index) => index.name));

    if (indexNames.has('idx_notifications_type_related_created')) {
      await queryInterface.removeIndex('notifications', 'idx_notifications_type_related_created');
    }

    if (indexNames.has('idx_notifications_user_read_created')) {
      await queryInterface.removeIndex('notifications', 'idx_notifications_user_read_created');
    }

    if (table.email_sent_at) {
      await queryInterface.removeColumn('notifications', 'email_sent_at');
    }

    if (table.read_at) {
      await queryInterface.removeColumn('notifications', 'read_at');
    }

    if (table.metadata) {
      await queryInterface.removeColumn('notifications', 'metadata');
    }

    if (table.entity_id) {
      await queryInterface.removeColumn('notifications', 'entity_id');
    }

    if (table.entity_type) {
      await queryInterface.removeColumn('notifications', 'entity_type');
    }

    if (table.action_url) {
      await queryInterface.removeColumn('notifications', 'action_url');
    }
  },
};
