import { DB } from "@/database";
import { Op } from "sequelize";

const repo = {
  createApplication: async (applicationData: any) => {
    return await DB.JobApplications.create(applicationData);
  },

  findApplicationById: async (application_id: string) => {
    return await DB.JobApplications.findOne({
      where: { application_id },
      include: [
        {
          model: DB.Jobs,
          as: "job",
          include: [
            {
              model: DB.Users,
              as: "employer",
              attributes: ["user_id", "full_name", "email"],
              include: [
                {
                  model: DB.Roles,
                  as: "role",
                  attributes: ["roleName", "roleType"],
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
        },
        {
          model: DB.Users,
          as: "student",
          attributes: ["user_id", "full_name", "email", "mobile_number"],
          include: [
            {
              model: DB.Roles,
              as: "role",
              attributes: ["roleName", "roleType"],
            },
          ],
        },
        {
          model: DB.Users,
          as: "reviewer",
          attributes: ["user_id", "full_name", "email"],
          required: false,
        },
        {
          model: DB.JobApplicationAnswers,
          as: "answers",
          include: [
            {
              model: DB.JobQuestions,
              as: "question",
              attributes: ["question_id", "question_text", "question_type", "is_required"],
            },
          ],
          required: false,
        },
      ],
    });
  },

  findApplicationByJobAndStudent: async (job_id: string, student_id: string) => {
    return await DB.JobApplications.findOne({
      where: { job_id, student_id },
    });
  },

  findAllApplicationsByJob: async (job_id: string) => {
    return await DB.JobApplications.findAll({
      where: { job_id },
      include: [
        {
          model: DB.Users,
          as: "student",
          attributes: ["user_id", "full_name", "email", "mobile_number"],
          include: [
            {
              model: DB.Roles,
              as: "role",
              attributes: ["roleName", "roleType"],
            },
          ],
        },
        {
          model: DB.Users,
          as: "reviewer",
          attributes: ["user_id", "full_name", "email"],
          required: false,
        },
        {
          model: DB.JobApplicationAnswers,
          as: "answers",
          include: [
            {
              model: DB.JobQuestions,
              as: "question",
              attributes: ["question_id", "question_text", "question_type", "is_required"],
            },
          ],
          required: false,
        },
      ],
      order: [["applied_at", "DESC"]],
    });
  },

  findAllApplicationsByStudent: async (student_id: string) => {
    return await DB.JobApplications.findAll({
      where: { student_id },
      include: [
        {
          model: DB.Jobs,
          as: "job",
          include: [
            {
              model: DB.Users,
              as: "employer",
              attributes: ["user_id", "full_name", "email"],
              include: [
                {
                  model: DB.Roles,
                  as: "role",
                  attributes: ["roleName", "roleType"],
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
        },
        {
          model: DB.Users,
          as: "reviewer",
          attributes: ["user_id", "full_name", "email"],
          required: false,
        },
        {
          model: DB.JobApplicationAnswers,
          as: "answers",
          include: [
            {
              model: DB.JobQuestions,
              as: "question",
              attributes: ["question_id", "question_text", "question_type", "is_required"],
            },
          ],
          required: false,
        },
      ],
      order: [["applied_at", "DESC"]],
    });
  },

  findAllApplicationsForEmployer: async (employer_id: string) => {
    return await DB.JobApplications.findAll({
      include: [
        {
          model: DB.Jobs,
          as: "job",
          where: { employer_id },
          include: [
            {
              model: DB.Users,
              as: "employer",
              attributes: ["user_id", "full_name", "email"],
            },
            {
              model: DB.JobQuestions,
              as: "questions",
              order: [['display_order', 'ASC']],
              required: false,
            },
          ],
        },
        {
          model: DB.Users,
          as: "student",
          attributes: ["user_id", "full_name", "email", "mobile_number"],
          include: [
            {
              model: DB.Roles,
              as: "role",
              attributes: ["roleName", "roleType"],
            },
          ],
        },
        {
          model: DB.Users,
          as: "reviewer",
          attributes: ["user_id", "full_name", "email"],
          required: false,
        },
        {
          model: DB.JobApplicationAnswers,
          as: "answers",
          include: [
            {
              model: DB.JobQuestions,
              as: "question",
              attributes: ["question_id", "question_text", "question_type", "is_required"],
            },
          ],
          required: false,
        },
      ],
      order: [["applied_at", "DESC"]],
    });
  },

  updateApplication: async (application_id: string, updates: any) => {
    const [rows] = await DB.JobApplications.update(updates, {
      where: { application_id },
    });
    if (rows === 0) return null;
    return await DB.JobApplications.findOne({
      where: { application_id },
      include: [
        {
          model: DB.Jobs,
          as: "job",
          include: [
            {
              model: DB.Users,
              as: "employer",
              attributes: ["user_id", "full_name", "email"],
            },
            {
              model: DB.JobQuestions,
              as: "questions",
              order: [['display_order', 'ASC']],
              required: false,
            },
          ],
        },
        {
          model: DB.Users,
          as: "student",
          attributes: ["user_id", "full_name", "email", "mobile_number"],
          include: [
            {
              model: DB.Roles,
              as: "role",
              attributes: ["roleName", "roleType"],
            },
          ],
        },
        {
          model: DB.Users,
          as: "reviewer",
          attributes: ["user_id", "full_name", "email"],
          required: false,
        },
        {
          model: DB.JobApplicationAnswers,
          as: "answers",
          include: [
            {
              model: DB.JobQuestions,
              as: "question",
              attributes: ["question_id", "question_text", "question_type", "is_required"],
            },
          ],
          required: false,
        },
      ],
    });
  },

  deleteApplication: async (application_id: string) => {
    const rows = await DB.JobApplications.destroy({ where: { application_id } });
    return rows > 0;
  },

  incrementJobApplicationsCount: async (job_id: string) => {
    await DB.Jobs.increment("applications", { where: { job_id } });
  },

  createApplicationAnswers: async (application_id: string, answers: any[]) => {
    const answerPromises = answers.map(answer =>
      DB.JobApplicationAnswers.create({
        application_id,
        question_id: answer.question_id,
        answer_text: typeof answer.answer_text === 'string' 
          ? answer.answer_text 
          : JSON.stringify(answer.answer_text),
      })
    );
    return await Promise.all(answerPromises);
  },
};

export default repo;

