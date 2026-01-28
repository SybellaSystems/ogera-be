import { DB } from '@/database/index';
import { Op } from 'sequelize';

export default {
    // Mark a step as completed for a user
    async markStepComplete(
        user_id: string,
        course_id: string,
        step_id: string,
    ) {
        const [progress, created] = await DB.CourseProgress.findOrCreate({
            where: {
                user_id,
                course_id,
                step_id,
            },
            defaults: {
                user_id,
                course_id,
                step_id,
                completed: true,
                completed_at: new Date(),
            },
        });

        // If it already exists, update it
        if (!created) {
            await progress.update({
                completed: true,
                completed_at: new Date(),
            });
        }

        return progress;
    },

    // Mark a step as incomplete for a user
    async markStepIncomplete(
        user_id: string,
        course_id: string,
        step_id: string,
    ) {
        const progress = await DB.CourseProgress.findOne({
            where: {
                user_id,
                course_id,
                step_id,
            },
        });

        if (progress) {
            await progress.update({
                completed: false,
                completed_at: null,
            });
        }

        return progress;
    },

    // Get all progress for a user in a course
    async getUserCourseProgress(user_id: string, course_id: string) {
        return await DB.CourseProgress.findAll({
            where: {
                user_id,
                course_id,
            },
            include: [
                {
                    model: DB.CourseSteps,
                    as: 'step',
                    attributes: ['step_id', 'step_order', 'step_title', 'step_type'],
                },
            ],
            order: [['created_at', 'ASC']],
        });
    },

    // Get completion percentage for a user in a course
    async getCourseCompletionPercentage(user_id: string, course_id: string) {
        // Get total number of steps in the course
        const totalSteps = await DB.CourseSteps.count({
            where: { course_id },
        });

        if (totalSteps === 0) {
            return { completed: 0, total: 0, percentage: 0, started: false, started_at: null };
        }

        // Get number of completed steps
        const completedSteps = await DB.CourseProgress.count({
            where: {
                user_id,
                course_id,
                completed: true,
            },
        });

        const percentage = Math.round((completedSteps / totalSteps) * 100);

        // Get start time
        const startInfo = await this.hasStartedCourse(user_id, course_id);

        return {
            completed: completedSteps,
            total: totalSteps,
            percentage,
            started: startInfo.started,
            started_at: startInfo.started_at,
        };
    },

    // Get all courses progress for a user
    async getUserAllCoursesProgress(user_id: string) {
        // Get all courses the user has progress in
        const progressRecords = await DB.CourseProgress.findAll({
            where: {
                user_id,
            },
            attributes: ['course_id'],
            group: ['course_id'],
            raw: true,
        });

        const courseIds = progressRecords.map((p: any) => p.course_id);

        if (courseIds.length === 0) {
            return [];
        }

        // Get completion for each course
        const completionPromises = courseIds.map(async (course_id: string) => {
            return await this.getCourseCompletionPercentage(user_id, course_id);
        });

        const completions = await Promise.all(completionPromises);

        return courseIds.map((course_id: string, index: number) => ({
            course_id,
            ...completions[index],
        }));
    },

    // Check if a specific step is completed
    async isStepCompleted(user_id: string, course_id: string, step_id: string) {
        const progress = await DB.CourseProgress.findOne({
            where: {
                user_id,
                course_id,
                step_id,
                completed: true,
            },
        });

        return !!progress;
    },

    // Check if student has started the course (has any progress records)
    async hasStartedCourse(user_id: string, course_id: string) {
        const progress = await DB.CourseProgress.findOne({
            where: {
                user_id,
                course_id,
            },
            order: [['created_at', 'ASC']],
            attributes: ['created_at'],
        });

        return {
            started: !!progress,
            started_at: progress?.created_at || null,
        };
    },

    // Get course start time (earliest progress record)
    async getCourseStartTime(user_id: string, course_id: string) {
        const firstProgress = await DB.CourseProgress.findOne({
            where: {
                user_id,
                course_id,
            },
            order: [['created_at', 'ASC']],
            attributes: ['created_at'],
        });

        return firstProgress?.created_at || null;
    },

    // Get all students enrolled in a course with their progress
    async getCourseStudents(course_id: string) {
        console.log('[getCourseStudents] Starting with course_id:', course_id);
        
        // First, verify the course exists
        const course = await DB.Courses.findByPk(course_id);
        if (!course) {
            console.log('[getCourseStudents] Course not found:', course_id);
            return [];
        }
        console.log('[getCourseStudents] Course found:', course.course_name);

        // Get all progress records for this course and extract unique user_ids
        const allProgress = await DB.CourseProgress.findAll({
            where: {
                course_id,
            },
            attributes: ['user_id'],
            raw: true, // Get plain objects
        });

        console.log('[getCourseStudents] All progress records:', allProgress.length);
        console.log('[getCourseStudents] Sample progress record:', allProgress[0]);

        // Extract unique user_ids using Set
        // Handle different possible formats from raw query
        const userIdSet = new Set<string>();
        for (const record of allProgress) {
            // Try different possible property names (case-insensitive, different formats)
            const userId = record.user_id || 
                          record.userId || 
                          record.USER_ID || 
                          (record as any)['user_id'] ||
                          (record as any)['userId'] ||
                          null;
            if (userId) {
                userIdSet.add(String(userId));
            }
        }

        const userIds = Array.from(userIdSet);
        console.log('[getCourseStudents] Unique user_ids:', userIds.length, userIds);

        if (userIds.length === 0) {
            console.log('[getCourseStudents] No user_ids found, returning empty');
            return [];
        }

        // Get total steps for the course
        const totalSteps = await DB.CourseSteps.count({
            where: { course_id },
        });

        // Get user details and their progress
        const students = await DB.Users.findAll({
            where: {
                user_id: { [Op.in]: userIds },
            },
            attributes: ['user_id', 'full_name', 'email', 'mobile_number'],
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    attributes: ['roleName', 'roleType'],
                },
            ],
            raw: false, // Keep as instances for associations
        });

        console.log('[getCourseStudents] Found users:', students.length);

        // Get progress for each student
        const formattedStudents = await Promise.all(
            students.map(async (student: any) => {
                // Get user_id - handle Sequelize instance
                let userId: string;
                if (student.get) {
                    userId = student.get('user_id');
                } else if (student.user_id) {
                    userId = student.user_id;
                } else if (student.dataValues?.user_id) {
                    userId = student.dataValues.user_id;
                } else {
                    console.warn('No user_id found for student:', student);
                    return null;
                }
                
                if (!userId) {
                    return null;
                }
                
                const userProgress = await DB.CourseProgress.findAll({
                    where: {
                        user_id: userId,
                        course_id,
                    },
                    order: [['created_at', 'ASC']],
                    raw: true, // Get plain objects for easier access
                });

                console.log(`[getCourseStudents] User ${userId} progress records:`, userProgress.length);

                if (!userProgress || userProgress.length === 0) {
                    console.log(`[getCourseStudents] User ${userId} has no progress, skipping`);
                    return null;
                }

                const firstProgress = userProgress[0];
                const started_at = firstProgress.created_at || null;

                const completedSteps = userProgress.filter((p: any) => {
                    return p.completed === true;
                }).length;
                
                const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
                const isCompleted = totalSteps > 0 && completedSteps === totalSteps;

                // Get user details - handle Sequelize instance
                let fullName: string;
                let email: string;
                let mobileNumber: string | null;
                let roleName: string;
                
                if (student.get) {
                    fullName = student.get('full_name') || 'Unknown';
                    email = student.get('email') || 'No email';
                    mobileNumber = student.get('mobile_number') || null;
                    const role = student.get('role');
                    roleName = role?.get ? role.get('roleName') : (role?.roleName || 'student');
                } else {
                    fullName = student.full_name || student.dataValues?.full_name || 'Unknown';
                    email = student.email || student.dataValues?.email || 'No email';
                    mobileNumber = student.mobile_number || student.dataValues?.mobile_number || null;
                    const role = student.role || student.dataValues?.role;
                    roleName = role?.roleName || role?.dataValues?.roleName || 'student';
                }

                const studentData = {
                    user_id: userId,
                    full_name: fullName || 'Unknown',
                    email: email || 'No email',
                    phone_number: mobileNumber || null, // Keep phone_number in response for frontend compatibility
                    role: roleName,
                    started_at: started_at ? (started_at instanceof Date ? started_at.toISOString() : new Date(started_at).toISOString()) : null,
                    completed_steps: completedSteps,
                    total_steps: totalSteps,
                    percentage,
                    is_completed: isCompleted,
                };

                console.log(`[getCourseStudents] Formatted student ${userId}:`, {
                    full_name: studentData.full_name,
                    completed_steps: studentData.completed_steps,
                    total_steps: studentData.total_steps,
                    is_completed: studentData.is_completed,
                });

                return studentData;
            })
        );

        // Filter out any null values
        const finalStudents = formattedStudents.filter((s: any) => s !== null);
        console.log('[getCourseStudents] Final students count:', finalStudents.length);
        return finalStudents;
    },

    // Get course statistics for employers
    async getCourseStatistics() {
        // Total courses
        const totalCourses = await DB.Courses.count();

        // Total students enrolled (have progress in any course)
        const totalStudentsEnrolled = await DB.CourseProgress.count({
            distinct: true,
            col: 'user_id',
        });

        // Total course completions (students who completed at least one course)
        const allProgress = await DB.CourseProgress.findAll({
            attributes: ['user_id', 'course_id', 'completed'],
            include: [
                {
                    model: DB.CourseSteps,
                    as: 'step',
                    attributes: ['step_id'],
                },
            ],
        });

        // Group by user and course to calculate completions
        const courseCompletions = new Map<string, Set<string>>(); // course_id -> Set of user_ids who completed

        for (const progress of allProgress) {
            const courseId = progress.course_id;
            const userId = progress.user_id;
            const stepId = progress.step_id;

            if (!courseCompletions.has(courseId)) {
                courseCompletions.set(courseId, new Set());
            }

            // Check if this step is completed
            if (progress.completed) {
                // We need to check if all steps for this course are completed
                // This is a simplified check - in production, you'd want to verify all steps
            }
        }

        // Get actual completions by checking each course
        let totalCompletions = 0;
        const courses = await DB.Courses.findAll({
            include: [
                {
                    model: DB.CourseSteps,
                    as: 'steps',
                    attributes: ['step_id'],
                },
            ],
        });

        for (const course of courses) {
            const courseSteps = course.steps || [];
            const totalSteps = courseSteps.length;

            if (totalSteps === 0) continue;

            // Get all students with progress in this course
            const studentsProgress = await DB.CourseProgress.findAll({
                where: {
                    course_id: course.course_id,
                },
                attributes: ['user_id', 'step_id', 'completed'],
            });

            // Group by user_id
            const userProgress = new Map<string, Set<string>>();
            for (const progress of studentsProgress) {
                if (!userProgress.has(progress.user_id)) {
                    userProgress.set(progress.user_id, new Set());
                }
                if (progress.completed) {
                    userProgress.get(progress.user_id)!.add(progress.step_id);
                }
            }

            // Check which users completed all steps
            for (const [userId, completedSteps] of userProgress.entries()) {
                if (completedSteps.size === totalSteps) {
                    totalCompletions++;
                }
            }
        }

        return {
            total_courses: totalCourses,
            total_students_enrolled: totalStudentsEnrolled,
            total_course_completions: totalCompletions,
        };
    },

    // Get statistics for a specific course
    async getCourseSpecificStatistics(course_id: string) {
        const course = await DB.Courses.findByPk(course_id, {
            include: [
                {
                    model: DB.CourseSteps,
                    as: 'steps',
                    attributes: ['step_id'],
                },
            ],
        });

        if (!course) {
            return null;
        }

        const totalSteps = course.steps?.length || 0;
        const students = await this.getCourseStudents(course_id);

        const totalEnrolled = students.length;
        const completedStudents = students.filter((s) => s.is_completed).length;
        const inProgressStudents = students.filter((s) => !s.is_completed && s.completed_steps > 0).length;
        const notStartedStudents = students.filter((s) => s.completed_steps === 0).length;

        return {
            course_id: course.course_id,
            course_name: course.course_name,
            total_steps: totalSteps,
            total_enrolled: totalEnrolled,
            completed_students: completedStudents,
            in_progress_students: inProgressStudents,
            not_started_students: notStartedStudents,
            completion_rate: totalEnrolled > 0 ? Math.round((completedStudents / totalEnrolled) * 100) : 0,
        };
    },
};
