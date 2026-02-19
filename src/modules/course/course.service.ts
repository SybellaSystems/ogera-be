import * as path from 'path';
import repo from './course.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { Messages } from '@/utils/messages';
import { Course } from '@/interfaces/course.interfaces';
import { saveFile, getFileUrl, getLocalFile } from '@/utils/storage.service';
import { BASE_URL, STORAGE_CONFIG } from '@/config';
import { DB } from '@/database/index';

/** Parse step_content for uploaded video: { path, storageType } */
const parseUploadedVideo = (
    content: string,
): { path: string; storageType: string } | null => {
    try {
        const parsed = JSON.parse(content);
        if (parsed?.path && (parsed?.storageType === 'local' || parsed?.storageType === 's3')) {
            return parsed;
        }
    } catch {
        /* not JSON, treat as URL */
    }
    return null;
};

/** Transform video step_content: resolve uploaded videos to playback URL */
const transformVideoStepContent = async (
    step: any,
): Promise<string> => {
    if (step.step_type !== 'video') return step.step_content;
    const uploaded = parseUploadedVideo(step.step_content);
    if (uploaded) {
        if (uploaded.storageType === 's3') {
            return await getFileUrl(uploaded.path, uploaded.storageType);
        }
        const encoded = encodeURIComponent(uploaded.path);
        return `${BASE_URL}/api/courses/videos/stream?path=${encoded}`;
    }
    return step.step_content; // YouTube or external URL
};

/** Convert Sequelize model to plain object (avoids circular ref JSON error) */
const toPlain = (obj: any): any => {
    if (!obj) return obj;
    if (typeof obj.get === 'function') return obj.get({ plain: true });
    return obj;
};

/** Transform course steps: resolve video URLs for playback */
const transformCourseSteps = async (course: any): Promise<any> => {
    const plainCourse = toPlain(course);
    if (!plainCourse?.steps?.length) return plainCourse;
    const steps = await Promise.all(
        plainCourse.steps.map(async (step: any) => ({
            ...toPlain(step),
            step_content: await transformVideoStepContent(toPlain(step)),
        })),
    );
    return { ...plainCourse, steps };
};

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

    // Return course with steps (transform video URLs)
    const createdCourse = await repo.findCourseById(course.course_id);
    if (!createdCourse) {
        throw new CustomError(
            'Failed to retrieve created course',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    return await transformCourseSteps(createdCourse);
};

export const getAllCoursesService = async () => {
    const courses = await repo.findAllCourses();
    return Promise.all(
        (courses as any[]).map((c) => transformCourseSteps(c)),
    );
};

export const getCourseByIdService = async (course_id: string) => {
    const course = await repo.findCourseById(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }
    return await transformCourseSteps(course);
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

    // Return updated course (transform video URLs)
    const updatedCourse = await repo.findCourseById(course_id);
    if (!updatedCourse) {
        throw new CustomError(
            'Failed to retrieve updated course',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    return await transformCourseSteps(updatedCourse);
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
    const enrollments = await repo.findEnrollmentsByUser(user_id);
    return Promise.all(
        (enrollments as any[]).map(async (enc) => {
            if (enc.course?.steps?.length) {
                enc.course = await transformCourseSteps(enc.course);
            }
            return enc;
        }),
    );
};

export const getEnrollmentService = async (
    user_id: string,
    course_id: string,
) => {
    const enrollment = await repo.findEnrollment(user_id, course_id);
    if (!enrollment) return null;
    const enc = enrollment as any;
    if (enc.course?.steps?.length) {
        enc.course = await transformCourseSteps(enc.course);
    }
    return enrollment;
};

// ---------- Video upload & stream (courseAdmin/superadmin) ----------

export const uploadCourseVideoService = async (
    file: Express.Multer.File,
): Promise<{ path: string; storageType: string }> => {
    const { path, storageType } = await saveFile(file, 'course-videos');
    return { path, storageType };
};

export const streamCourseVideoService = async (
    filePath: string,
): Promise<{ buffer: Buffer; fileName: string; mimeType: string } | null> => {
    let actualPath = decodeURIComponent(filePath);
    if (
        !actualPath.includes('course-videos') &&
        !actualPath.includes(STORAGE_CONFIG.localStoragePath)
    ) {
        actualPath = path.join(
            STORAGE_CONFIG.localStoragePath,
            'course-videos',
            path.basename(actualPath),
        );
    }
    const buffer = getLocalFile(actualPath);
    if (!buffer) return null;
    const fileName = path.basename(actualPath);
    const ext = path.extname(fileName).toLowerCase();
    const mimeMap: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
    };
    const mimeType = mimeMap[ext] || 'video/mp4';
    return { buffer, fileName, mimeType };
};

// ---------- Enrollments ----------

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
    const enc = result as any;
    if (enc.course?.steps?.length) {
        enc.course = await transformCourseSteps(enc.course);
    }
    return result;
};

/** Completed courses for a student (e.g. for profile). */
export const getStudentCompletedCoursesService = async (user_id: string) => {
    const enrollments = await repo.findCompletedEnrollmentsByUser(user_id);
    return (enrollments as any[]).map((enc) => {
        const canViewCertificate =
            enc.certificate_status === 'approved' && enc.funded === true;
        return {
            enrollment_id: enc.enrollment_id,
            course_id: enc.course_id,
            course_name: enc.course?.course_name,
            category: enc.course?.category,
            estimated_hours: enc.course?.estimated_hours,
            completed_at: enc.completed_at,
            certificate_status: enc.certificate_status,
            certificate_visible: canViewCertificate,
        };
    });
};

export const getEnrollmentsPendingReviewService = async () => {
    const enrollments = await repo.findEnrollmentsPendingReview();
    return Promise.all(
        (enrollments as any[]).map(async (enc) => {
            if (enc.course?.steps?.length) {
                enc.course = await transformCourseSteps(enc.course);
            }
            return enc;
        }),
    );
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
    const enc = updated as any;
    if (enc.course?.steps?.length) {
        enc.course = await transformCourseSteps(enc.course);
    }
    return updated;
};

/** Course chat history for real-time UI. User must be enrolled or have course view. */
export const getCourseChatHistoryService = async (
    course_id: string,
    user_id: string,
    user_role: string,
) => {
    const course = await DB.Courses.findByPk(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }
    const supportRoles = ['superadmin', 'admin', 'courseadmin', 'employer'];
    const isSupport = supportRoles.some(
        (r) => user_role?.toLowerCase() === r.toLowerCase(),
    );
    if (!isSupport) {
        const enrollment = await DB.CourseEnrollments.findOne({
            where: { course_id, user_id },
        });
        if (!enrollment) {
            throw new CustomError(
                'Enroll in the course to view chat',
                StatusCodes.FORBIDDEN,
            );
        }
    }
    const messages = await DB.CourseChatMessages.findAll({
        where: { course_id },
        order: [['created_at', 'ASC']],
        limit: 500,
    });
    return messages.map((m) => m.get({ plain: true }));
};