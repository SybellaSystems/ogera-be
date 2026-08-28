'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('job_referrals', {
            referral_id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal('gen_random_uuid()'),
            },

            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },

            company: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },

            location: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },

            employment_type: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },

            category: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },

            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            source: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            original_url: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            verification_status: {
                type: Sequelize.ENUM(
                    'Pending',
                    'Verified',
                    'Rejected',
                ),
                allowNull: false,
                defaultValue: 'Pending',
            },

            permission_status: {
                type: Sequelize.ENUM(
                    'Pending',
                    'Approved',
                    'Rejected',
                ),
                allowNull: false,
                defaultValue: 'Pending',
            },

            verification_notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            expiry_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },

            status: {
                type: Sequelize.ENUM(
                    'Active',
                    'Inactive',
                    'Expired',
                ),
                allowNull: false,
                defaultValue: 'Inactive',
            },

            views_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            apply_clicks: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            reported_applications: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            created_by: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onDelete: 'RESTRICT',
                onUpdate: 'CASCADE',
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

        // Indexes for common queries

        await queryInterface.addIndex(
            'job_referrals',
            ['status'],
            {
                name: 'job_referrals_status_idx',
            },
        );

        await queryInterface.addIndex(
            'job_referrals',
            ['verification_status'],
            {
                name: 'job_referrals_verification_status_idx',
            },
        );

        await queryInterface.addIndex(
            'job_referrals',
            ['permission_status'],
            {
                name: 'job_referrals_permission_status_idx',
            },
        );

        await queryInterface.addIndex(
            'job_referrals',
            ['created_by'],
            {
                name: 'job_referrals_created_by_idx',
            },
        );

        await queryInterface.addIndex(
            'job_referrals',
            ['expiry_date'],
            {
                name: 'job_referrals_expiry_date_idx',
            },
        );

        await queryInterface.addIndex(
            'job_referrals',
            ['created_at'],
            {
                name: 'job_referrals_created_at_idx',
            },
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable('job_referrals');

        // PostgreSQL ENUM cleanup
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_job_referrals_verification_status";',
        );

        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_job_referrals_permission_status";',
        );

        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_job_referrals_status";',
        );
    },
};