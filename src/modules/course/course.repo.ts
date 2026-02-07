import { DB } from '@/database';
import { Op } from 'sequelize';

const repo = {
    createCourse: async (courseData: any) => {
        return await DB.Courses.create(courseData);
    },

    findAllCourses: async () => {
        return await DB.Courses.findAll({
            include: [
                {
                    model: DB.CourseSteps,
                    as: 'steps',
                    order: [['step_order', 'ASC']],
                    required: false,
                },
            ],
            order: [['created_at', 'DESC']],
        });
    },

    findCourseById: async (course_id: string) => {
        return await DB.Courses.findOne({
            where: { course_id },
            include: [
                {
                    model: DB.CourseSteps,
                    as: 'steps',
                    order: [['step_order', 'ASC']],
                },
            ],
        });
    },

    updateCourse: async (course_id: string, updates: any) => {
        const [rows] = await DB.Courses.update(updates, {
            where: { course_id },
        });
        if (rows === 0) return null;
        return await DB.Courses.findOne({
            where: { course_id },
            include: [
                {
                    model: DB.CourseSteps,
                    as: 'steps',
                    order: [['step_order', 'ASC']],
                },
            ],
        });
    },

    deleteCourse: async (course_id: string) => {
        return await DB.Courses.destroy({ where: { course_id } });
    },

    createCourseSteps: async (course_id: string, steps: any[]) => {
        const stepData = steps.map(step => ({
            course_id,
            step_type: step.step_type,
            step_content: step.step_content,
            step_title: step.step_title || null,
            step_order: step.step_order,
        }));
        return await DB.CourseSteps.bulkCreate(stepData);
    },

    deleteCourseSteps: async (course_id: string) => {
        return await DB.CourseSteps.destroy({ where: { course_id } });
    },

    // ---------- Enrollments (SRS: complete → admin review → certificate) ----------
    createEnrollment: async (
        user_id: string,
        course_id: string,
        amount_due: number | null,
    ) => {
        return await DB.CourseEnrollments.create({
            user_id,
            course_id,
            amount_due: amount_due ?? null,
            certificate_status: 'none',
        });
    },

    findEnrollment: async (user_id: string, course_id: string) => {
        return await DB.CourseEnrollments.findOne({
            where: { user_id, course_id },
            include: [
                {
                    model: DB.Courses,
                    as: 'course',
                    include: [{ model: DB.CourseSteps, as: 'steps' }],
                },
            ],
        });
    },

    findEnrollmentsByUser: async (user_id: string) => {
        return await DB.CourseEnrollments.findAll({
            where: { user_id },
            include: [
                {
                    model: DB.Courses,
                    as: 'course',
                    include: [{ model: DB.CourseSteps, as: 'steps' }],
                },
            ],
            order: [['enrolled_at', 'DESC']],
        });
    },

    findEnrollmentsByCourse: async (course_id: string) => {
        return await DB.CourseEnrollments.findAll({
            where: { course_id },
            include: [
                {
                    model: DB.Users,
                    as: 'student',
                    attributes: ['user_id', 'full_name', 'email'],
                },
            ],
            order: [['enrolled_at', 'DESC']],
        });
    },

    completeEnrollment: async (user_id: string, course_id: string) => {
        const enrollment = await DB.CourseEnrollments.findOne({
            where: { user_id, course_id },
        });
        if (!enrollment) return null;
        const isPaid = Number(enrollment.get('amount_due')) > 0;
        await DB.CourseEnrollments.update(
            {
                completed_at: new Date(),
                certificate_status: isPaid
                    ? 'pending_payment'
                    : 'pending_review',
            },
            { where: { user_id, course_id } },
        );
        return await DB.CourseEnrollments.findOne({
            where: { user_id, course_id },
            include: [{ model: DB.Courses, as: 'course' }],
        });
    },

    updateCertificateStatus: async (
        enrollment_id: string,
        certificate_status: 'pending_review' | 'approved',
        funded?: boolean,
    ) => {
        const updates: any = { certificate_status };
        if (funded !== undefined) updates.funded = funded;
        const [rows] = await DB.CourseEnrollments.update(updates, {
            where: { enrollment_id },
        });
        if (rows === 0) return null;
        return await DB.CourseEnrollments.findByPk(enrollment_id, {
            include: [
                { model: DB.Courses, as: 'course' },
                { model: DB.Users, as: 'student' },
            ],
        });
    },

    findEnrollmentsPendingReview: async () => {
        return await DB.CourseEnrollments.findAll({
            where: {
                certificate_status: {
                    [Op.in]: ['pending_review', 'pending_payment'],
                },
            },
            include: [
                { model: DB.Courses, as: 'course' },
                {
                    model: DB.Users,
                    as: 'student',
                    attributes: ['user_id', 'full_name', 'email'],
                },
            ],
            order: [['completed_at', 'ASC']],
        });
    },
};

export default repo;
