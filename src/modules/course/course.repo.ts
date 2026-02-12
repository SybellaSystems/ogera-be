import { DB } from "@/database";

const repo = {
  createCourse: async (courseData: any) => {
    return await DB.Courses.create(courseData);
  },

  findAllCourses: async () => {
    return await DB.Courses.findAll({
      include: [
        {
          model: DB.CourseSteps,
          as: "steps",
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
          as: "steps",
          order: [['step_order', 'ASC']],
        },
      ],
    });
  },

  updateCourse: async (course_id: string, updates: any) => {
    const [rows] = await DB.Courses.update(updates, { where: { course_id } });
    if (rows === 0) return null;
    return await DB.Courses.findOne({ 
      where: { course_id },
      include: [
        {
          model: DB.CourseSteps,
          as: "steps",
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
};

export default repo;


