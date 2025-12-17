import { DB } from "@/database";

const repo = {
  createJob: async (jobData: any) => {
    return await DB.Jobs.create(jobData);
  },

  findAllJobs: async (status?: string) => {
    // Filter by status if provided, ensuring case-sensitive match
    const whereClause = status ? { status: status as 'Pending' | 'Active' | 'Inactive' | 'Completed' } : {};
    return await DB.Jobs.findAll({
      where: whereClause,
      include: [
        {
          model: DB.Users,
          as: "employer",
          attributes: ["user_id", "full_name", "role_id"],  // ✔ FIXED
          include: [
            {
              model: DB.Roles,
              as: "role",
              attributes: ["roleName"],  // ✔ Load employer's role name
            },
          ],
        },
        {
          model: DB.JobQuestions,
          as: "questions",
          order: [['display_order', 'ASC']],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });
  },

  findJobById: async (job_id: string) => {
    return await DB.Jobs.findOne({
      where: { job_id },
      include: [
        {
          model: DB.Users,
          as: "employer",
          attributes: ["user_id", "full_name", "role_id"], // ✔ FIXED
          include: [
            {
              model: DB.Roles,
              as: "role",
              attributes: ["roleName"], // ✔ Load roleName
            },
          ],
        },
        {
          model: DB.JobQuestions,
          as: "questions",
          order: [['display_order', 'ASC']],
        },
      ],
    });
  },

  updateJob: async (job_id: string, updates: any) => {
    const [rows] = await DB.Jobs.update(updates, { where: { job_id } });
    if (rows === 0) return null;
    return await DB.Jobs.findOne({ 
      where: { job_id },
      include: [
        {
          model: DB.Users,
          as: "employer",
          attributes: ["user_id", "full_name", "role_id"],
          include: [
            {
              model: DB.Roles,
              as: "role",
              attributes: ["roleName"],
            },
          ],
        },
        {
          model: DB.JobQuestions,
          as: "questions",
          order: [['display_order', 'ASC']],
        },
      ],
    });
  },

  createJobQuestions: async (job_id: string, questions: any[]) => {
    // Delete existing questions first
    await DB.JobQuestions.destroy({ where: { job_id } });
    // Create new questions
    const questionPromises = questions.map((q, index) =>
      DB.JobQuestions.create({
        job_id,
        question_text: q.question_text,
        question_type: q.question_type || 'text',
        is_required: q.is_required !== undefined ? q.is_required : false,
        options: q.options ? (typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) : null,
        display_order: q.display_order !== undefined ? q.display_order : index,
      })
    );
    return await Promise.all(questionPromises);
  },

  deleteJob: async (job_id: string) => {
    const rows = await DB.Jobs.destroy({ where: { job_id } });
    return rows > 0;
  },

  findEmployerByNameAndRole: async (full_name: string) => {
    return await DB.Users.findOne({
      where: { full_name },
      include: [
        {
          model: DB.Roles,
          as: "role",
          attributes: ["roleName"],
          where: { roleName: "employer" }, // ✔ only employer role
        },
      ],
    });
  },
  findJobByEmployerAndUniqueFields: async (
  employer_id: string,
  job_title?: string,
  location?: string,
) => {
  return await DB.Jobs.findOne({
    where: { employer_id, job_title, location },
  });
},
};

export default repo;
