'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'job_referrals',
            'created_referral_id',
            {
                type: Sequelize.STRING(50),
                allowNull: true,
                unique: true,
            },
        );
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(
            'job_referrals',
            'created_referral_id',
        );
    },
};