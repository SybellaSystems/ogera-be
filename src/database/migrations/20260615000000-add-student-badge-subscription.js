'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'badge', {
            type: Sequelize.ENUM('FREE', 'PREMIUM', 'PIONEER'),
            allowNull: false,
            defaultValue: 'FREE',
        });

        await queryInterface.addColumn('users', 'badge_expiry_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn('users', 'subscription_start_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn('users', 'subscription_end_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn('users', 'pioneer_eligible', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });

        await queryInterface.createTable('badge_purchases', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'user_id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            from_badge: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            to_badge: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            amount: {
                type: Sequelize.DECIMAL(18, 2),
                allowNull: false,
            },
            currency: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            usd_amount: {
                type: Sequelize.DECIMAL(18, 6),
                allowNull: true,
            },
            exchange_rate: {
                type: Sequelize.DECIMAL(20, 10),
                allowNull: true,
            },
            momo_reference_id: {
                type: Sequelize.STRING(128),
                allowNull: true,
            },
            payment_status: {
                type: Sequelize.ENUM('PENDING', 'SUCCESSFUL', 'FAILED'),
                allowNull: false,
                defaultValue: 'PENDING',
            },
            subscription_start_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            subscription_end_date: {
                type: Sequelize.DATE,
                allowNull: true,
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

        await queryInterface.addIndex('badge_purchases', ['user_id']);
        await queryInterface.addIndex('badge_purchases', ['momo_reference_id']);
        await queryInterface.addIndex('badge_purchases', ['payment_status']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('badge_purchases');
        await queryInterface.removeColumn('users', 'pioneer_eligible');
        await queryInterface.removeColumn('users', 'subscription_end_date');
        await queryInterface.removeColumn('users', 'subscription_start_date');
        await queryInterface.removeColumn('users', 'badge_expiry_date');
        await queryInterface.removeColumn('users', 'badge');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_badge";');
    },
};
