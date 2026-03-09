/**
 * SRS: Students load balance from employer payments. Course fees are deducted
 * from balance before withdrawal. No deposits - balance comes from job completions.
 */
import { DB } from '@/database';
import { Op } from 'sequelize';
import logger from '@/utils/logger';

/** Credit student balance when job is completed. */
export const creditStudentBalance = async (
    student_id: string,
    amount: number,
): Promise<number> => {
    const user = await DB.Users.findByPk(student_id);
    if (!user) throw new Error('User not found');
    const currentBalance = Number((user as any).balance || 0);
    const newBalance = currentBalance + amount;
    await DB.Users.update(
        { balance: newBalance },
        { where: { user_id: student_id } },
    );
    logger.info(`Credited ${amount} RWF to student ${student_id}. New balance: ${newBalance}`);
    return newBalance;
};

/**
 * SRS: Deduct unpaid course fees from balance. Called when balance is credited
 * (job completed) or before withdrawal. Returns total deducted.
 */
export const processCourseFeeDeductions = async (
    user_id: string,
): Promise<{ totalDeducted: number; updatedEnrollmentIds: string[] }> => {
    const user = await DB.Users.findByPk(user_id);
    if (!user) return { totalDeducted: 0, updatedEnrollmentIds: [] };
    let balance = Number((user as any).balance || 0);
    let totalDeducted = 0;
    const updatedEnrollmentIds: string[] = [];

    const unpaidEnrollments = await DB.CourseEnrollments.findAll({
        where: {
            user_id,
            certificate_status: 'pending_payment',
            amount_due: { [Op.gt]: 0 },
        },
        order: [['completed_at', 'ASC']],
        include: [{ model: DB.Courses, as: 'course' }],
    });

    for (const enc of unpaidEnrollments) {
        if (balance <= 0) break;
        const amountDue = Number(enc.amount_due || 0);
        if (amountDue <= 0) continue;
        const toPay = Math.min(balance, amountDue);
        if (toPay <= 0) continue;

        const amountPaid = Number(enc.amount_paid || 0) + toPay;
        const remainingDue = amountDue - toPay;
        const fullyPaid = remainingDue <= 0;

        await DB.CourseEnrollments.update(
            {
                amount_paid: amountPaid,
                amount_due: fullyPaid ? 0 : remainingDue,
                funded: fullyPaid,
                certificate_status: fullyPaid ? 'pending_review' : 'pending_payment',
            },
            { where: { enrollment_id: enc.enrollment_id } },
        );

        balance -= toPay;
        totalDeducted += toPay;
        updatedEnrollmentIds.push(enc.enrollment_id);
    }

    if (totalDeducted > 0) {
        const newBalance = Number((user as any).balance || 0) - totalDeducted;
        await DB.Users.update(
            { balance: Math.max(0, newBalance) },
            { where: { user_id } },
        );
        logger.info(
            `Deducted ${totalDeducted} RWF in course fees for user ${user_id}. Updated ${updatedEnrollmentIds.length} enrollments.`,
        );
    }

    return { totalDeducted, updatedEnrollmentIds };
};

/** Get user balance (RWF). */
export const getBalance = async (user_id: string): Promise<number> => {
    const user = await DB.Users.findByPk(user_id);
    if (!user) return 0;
    return Number((user as any).balance || 0);
};
