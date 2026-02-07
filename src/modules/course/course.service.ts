import repo from './course.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { Messages } from '@/utils/messages';
import { Course } from '@/interfaces/course.interfaces';

export const createCourseService = async (
    courseData: Partial<Course> & { steps?: any[] },
) => {
    if (!courseData.course_name) {
        throw new CustomError(
            'Course name is required',
            StatusCodes.BAD_REQUEST,
        );
    }
    if (!courseData.type) {
        throw new CustomError(
            'Course type is required',
            StatusCodes.BAD_REQUEST,
        );
    }
    if (!courseData.tag) {
        throw new CustomError('Tag is required', StatusCodes.BAD_REQUEST);
    }

    const { steps, ...coursePayloadData } = courseData;
    const is_free = coursePayloadData.is_free !== false;
    const coursePayload = {
        ...coursePayloadData,
        is_free,
        price_amount: is_free ? null : coursePayloadData.price_amount ?? null,
        price_currency: coursePayloadData.price_currency ?? 'RWF',
    };

    const course = await repo.createCourse(coursePayload);

    // Create steps if provided
    if (steps && Array.isArray(steps) && steps.length > 0) {
        await repo.createCourseSteps(course.course_id, steps);
    }

    // Return course with steps
    const createdCourse = await repo.findCourseById(course.course_id);
    if (!createdCourse) {
        throw new CustomError(
            'Failed to retrieve created course',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    return createdCourse;
};

export const getAllCoursesService = async () => {
    return await repo.findAllCourses();
};

export const getCourseByIdService = async (course_id: string) => {
    const course = await repo.findCourseById(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }
    return course;
};

export const updateCourseService = async (
    course_id: string,
    updates: Partial<Course> & { steps?: any[] },
) => {
    const course = await repo.findCourseById(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }

    const { steps, ...courseUpdates } = updates;

    // Update course fields
    if (Object.keys(courseUpdates).length > 0) {
        await repo.updateCourse(course_id, courseUpdates);
    }

    // Update steps if provided
    if (steps !== undefined) {
        // Delete existing steps
        await repo.deleteCourseSteps(course_id);

        // Create new steps if provided
        if (Array.isArray(steps) && steps.length > 0) {
            await repo.createCourseSteps(course_id, steps);
        }
    }

    // Return updated course
    const updatedCourse = await repo.findCourseById(course_id);
    if (!updatedCourse) {
        throw new CustomError(
            'Failed to retrieve updated course',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    return updatedCourse;
};

export const deleteCourseService = async (course_id: string) => {
    const course = await repo.findCourseById(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }

    await repo.deleteCourse(course_id);
    return { message: 'Course deleted successfully' };
};

// ---------- Enrollments (SRS: enroll → complete → admin review → certificate) ----------

export const enrollCourseService = async (
    user_id: string,
    course_id: string,
) => {
    const course = await repo.findCourseById(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }
    const existing = await repo.findEnrollment(user_id, course_id);
    if (existing) {
        throw new CustomError(
            'Already enrolled in this course',
            StatusCodes.BAD_REQUEST,
        );
    }
    const is_free = (course as any).is_free !== false;
    const priceAmount =
        (course as any).price_amount != null
            ? Number((course as any).price_amount)
            : 0;
    const amount_due = is_free ? null : priceAmount;
    const enrollment = await repo.createEnrollment(
        user_id,
        course_id,
        amount_due,
    );
    return enrollment;
};

export const getMyEnrollmentsService = async (user_id: string) => {
    return await repo.findEnrollmentsByUser(user_id);
};

export const getEnrollmentService = async (
    user_id: string,
    course_id: string,
) => {
    const enrollment = await repo.findEnrollment(user_id, course_id);
    if (!enrollment) return null;
    return enrollment;
};

export const completeCourseService = async (
    user_id: string,
    course_id: string,
) => {
    const enrollment = await repo.findEnrollment(user_id, course_id);
    if (!enrollment) {
        throw new CustomError('Enrollment not found', StatusCodes.NOT_FOUND);
    }
    if ((enrollment as any).completed_at) {
        throw new CustomError(
            'Course already completed',
            StatusCodes.BAD_REQUEST,
        );
    }
    const result = await repo.completeEnrollment(user_id, course_id);
    if (!result) {
        throw new CustomError(
            'Failed to complete course',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
    return result;
};

export const getEnrollmentsPendingReviewService = async () => {
    return await repo.findEnrollmentsPendingReview();
};

export const updateCertificateStatusService = async (
    enrollment_id: string,
    certificate_status: 'pending_review' | 'approved',
    funded?: boolean,
) => {
    const updated = await repo.updateCertificateStatus(
        enrollment_id,
        certificate_status,
        funded,
    );
    if (!updated) {
        throw new CustomError('Enrollment not found', StatusCodes.NOT_FOUND);
    }
    return updated;
};