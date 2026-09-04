import { DB } from "@/database";
import { Op, WhereOptions, Sequelize } from "sequelize";

const repo = {
  createJob: async (jobData: any) => {
    return await DB.Jobs.create(jobData);
  },
  
  findAllJobs: async (
  filters?: {
    status?: string;
    funded?: boolean;
    employer_id?: string;
    search?: string;
    location?: string;
    category?: string;
    currency?: string;
    budget_min?: number;
    budget_max?: number;
  },
  pagination?: {
    page?: number;
    limit?: number;
  },
) => {
  try {
    const where: any = {};

    // -----------------------------
    // Existing filters
    // -----------------------------

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.employer_id) {
      where.employer_id = filters.employer_id;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.currency) {
      where.currency = filters.currency;
    }

    if (filters?.funded === true) {
      where.funding_status = {
        [Op.in]: ["Funded", "Paid"],
      };
    } else if (filters?.funded === false) {
      where.funding_status = "Unfunded";
    }

    // -----------------------------
    // Budget filtering
    // -----------------------------

    if (
      typeof filters?.budget_min === "number" ||
      typeof filters?.budget_max === "number"
    ) {
      const budgetConditions: any = {};

      if (
        typeof filters?.budget_min === "number" &&
        typeof filters?.budget_max === "number"
      ) {
        budgetConditions[Op.between] = [
          filters.budget_min,
          filters.budget_max,
        ];
      } else if (typeof filters?.budget_min === "number") {
        budgetConditions[Op.gte] = filters.budget_min;
      } else if (typeof filters?.budget_max === "number") {
        budgetConditions[Op.lte] = filters.budget_max;
      }

      where.budget = budgetConditions;
    }

    // -----------------------------
    // Search and location
    // -----------------------------

    if (filters?.search) {
      where[Op.or] = [
        {
          job_title: {
            [Op.iLike]: `%${filters.search}%`,
          },
        },
        {
          location: {
            [Op.iLike]: `%${filters.search}%`,
          },
        },
        {
          category: {
            [Op.iLike]: `%${filters.search}%`,
          },
        },
        {
          description: {
            [Op.iLike]: `%${filters.search}%`,
          },
        },
      ];
    } else if (filters?.location) {
      where.location = {
        [Op.iLike]: `%${filters.location}%`,
      };
    }

    // -----------------------------
    // Pagination
    // -----------------------------

    const page = Math.max(Number(pagination?.page) || 1, 1);
    const limit = Math.max(Number(pagination?.limit) || 10, 1);

    const offset = (page - 1) * limit;

    // -----------------------------
    // Find jobs + total count
    // -----------------------------

    const result = await DB.Jobs.findAndCountAll({
      where,

      include: [
        {
          model: DB.Users,
          as: "employer",
          attributes: ["user_id", "full_name", "role_id"],
          required: false,

          include: [
            {
              model: DB.Roles,
              as: "role",
              attributes: ["roleName"],
              required: false,
            },
          ],
        },

        {
          model: DB.JobQuestions,
          as: "questions",
          required: false,
        },
      ],

      order: [["created_at", "DESC"]],

      limit,
      offset,

      // Prevent duplicate rows caused by hasMany associations
      distinct: true,
    });

    return {
      rows: result.rows,
      count: result.count,
      page,
      limit,
      totalPages: Math.ceil(result.count / limit),
    };
  } catch (error: any) {
    console.error("Error in findAllJobs:", error);
    throw error;
  }
},

  findJobById: async (job_id: string) => {
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
        },
      ],
    });
  },

  updateJob: async (job_id: string, updates: any) => {
    const [rows] = await DB.Jobs.update(updates, {
      where: { job_id },
    });

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
        },
      ],
    });
  },

  createJobQuestions: async (job_id: string, questions: any[]) => {
    await DB.JobQuestions.destroy({ where: { job_id } });

    const questionPromises = questions.map((q, index) =>
      DB.JobQuestions.create({
        job_id,
        question_text: q.question_text,
        question_type: q.question_type || "text",
        is_required: q.is_required ?? false,
        options: q.options
          ? typeof q.options === "string"
            ? q.options
            : JSON.stringify(q.options)
          : null,
        display_order: q.display_order ?? index,
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
          where: { roleName: "employer" },
        },
      ],
    });
  },

  findJobByEmployerAndUniqueFields: async (
    employer_id: string,
    job_title?: string,
    location?: string
  ) => {
    return await DB.Jobs.findOne({
      where: { employer_id, job_title, location },
    });
  },
};

export default repo;