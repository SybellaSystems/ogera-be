import repo from './courseProgress.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database/index';

export const markStepCompleteService = async (
    user_id: string,
    course_id: string,
    step_id: string,
) => {
    // Verify course exists
    const course = await DB.Courses.findByPk(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }

    // Verify step exists and belongs to course
    const step = await DB.CourseSteps.findOne({
        where: {
            step_id,
            course_id,
        },
    });

    if (!step) {
        throw new CustomError('Step not found or does not belong to this course', StatusCodes.NOT_FOUND);
    }

    return await repo.markStepComplete(user_id, course_id, step_id);
};

export const markStepIncompleteService = async (
    user_id: string,
    course_id: string,
    step_id: string,
) => {
    return await repo.markStepIncomplete(user_id, course_id, step_id);
};

export const getCourseProgressService = async (
    user_id: string,
    course_id: string,
) => {
    // Verify course exists
    const course = await DB.Courses.findByPk(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }

    const progress = await repo.getUserCourseProgress(user_id, course_id);
    const completion = await repo.getCourseCompletionPercentage(user_id, course_id);

    return {
        progress,
        completion,
    };
};

export const getCourseCompletionService = async (
    user_id: string,
    course_id: string,
) => {
    // Verify course exists
    const course = await DB.Courses.findByPk(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }

    return await repo.getCourseCompletionPercentage(user_id, course_id);
};

export const getAllCoursesProgressService = async (user_id: string) => {
    return await repo.getUserAllCoursesProgress(user_id);
};

export const checkCourseStartedService = async (
    user_id: string,
    course_id: string,
) => {
    // Verify course exists
    const course = await DB.Courses.findByPk(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }

    return await repo.hasStartedCourse(user_id, course_id);
};

export const getCourseStudentsService = async (course_id: string) => {
    // Verify course exists
    const course = await DB.Courses.findByPk(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }

    return await repo.getCourseStudents(course_id);
};

export const getCourseStatisticsService = async () => {
    return await repo.getCourseStatistics();
};

export const getCourseSpecificStatisticsService = async (course_id: string) => {
    // Verify course exists
    const course = await DB.Courses.findByPk(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }

    return await repo.getCourseSpecificStatistics(course_id);
};
