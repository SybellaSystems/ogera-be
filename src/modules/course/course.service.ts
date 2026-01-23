import repo from './course.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { Messages } from '@/utils/messages';
import { Course } from '@/interfaces/course.interfaces';

export const createCourseService = async (
    courseData: Partial<Course> & { steps?: any[] },
) => {
    // Validate required fields
    if (!courseData.course_name) {
        throw new CustomError('Course name is required', StatusCodes.BAD_REQUEST);
    }
    if (!courseData.type) {
        throw new CustomError('Course type is required', StatusCodes.BAD_REQUEST);
    }
    if (!courseData.tag) {
        throw new CustomError('Tag is required', StatusCodes.BAD_REQUEST);
    }

    const { steps, ...coursePayloadData } = courseData;
    
    const coursePayload = {
        ...coursePayloadData,
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


