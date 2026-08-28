'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            ALTER TYPE "enum_job_referrals_status" RENAME TO "enum_job_referrals_status_old";
        `);

        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_job_referrals_status" AS ENUM ('All', 'Pending', 'Verified', 'Active', 'Closed');
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE "job_referrals"
            ALTER COLUMN "status" DROP DEFAULT,
            ALTER COLUMN "status" TYPE "enum_job_referrals_status"
                USING (
                    CASE "status"::text
                        WHEN 'Inactive' THEN 'Pending'
                        WHEN 'Expired' THEN 'Closed'
                        ELSE "status"::text
                    END
                )::"enum_job_referrals_status",
            ALTER COLUMN "status" SET DEFAULT 'Pending';
        `);

        await queryInterface.sequelize.query(`
            DROP TYPE "enum_job_referrals_status_old";
        `);
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            ALTER TYPE "enum_job_referrals_status" RENAME TO "enum_job_referrals_status_new";
        `);

        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_job_referrals_status" AS ENUM ('Active', 'Inactive', 'Expired');
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE "job_referrals"
            ALTER COLUMN "status" DROP DEFAULT,
            ALTER COLUMN "status" TYPE "enum_job_referrals_status"
                USING (
                    CASE "status"::text
                        WHEN 'Pending' THEN 'Inactive'
                        WHEN 'Closed' THEN 'Expired'
                        WHEN 'Verified' THEN 'Inactive'
                        ELSE "status"::text
                    END
                )::"enum_job_referrals_status",
            ALTER COLUMN "status" SET DEFAULT 'Inactive';
        `);

        await queryInterface.sequelize.query(`
            DROP TYPE "enum_job_referrals_status_new";
        `);
    },
};

