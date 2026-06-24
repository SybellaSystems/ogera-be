'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            UPDATE users
            SET pioneer_eligible = true
            WHERE role_type = 'student'
              AND pioneer_eligible = false
        `);

        await queryInterface.sequelize.query(`
            UPDATE users u
            SET badge = 'PIONEER'
            WHERE u.role_type = 'student'
              AND u.badge = 'FREE'
              AND EXISTS (
                SELECT 1 FROM academic_verifications av
                WHERE av.user_id = u.user_id AND av.status = 'accepted'
              )
              AND EXISTS (
                SELECT 1 FROM tasks t
                WHERE t.assigned_student_id = u.user_id AND t.status = 'COMPLETED'
              )
        `);
    },

    async down(queryInterface) {
        // Cannot reliably restore original first-100 eligibility; leave as-is on rollback.
    },
};
