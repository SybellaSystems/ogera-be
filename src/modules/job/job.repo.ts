import { DB } from "@/database";

const repo = {
  createJob: async (jobData: any) => {
    return await DB.Jobs.create(jobData);
  },

  findAllJobs: async () => {
    return await DB.Jobs.findAll({
      include: [
        {
          model: DB.Users,
          as: "employer",
          attributes: ["user_id", "full_name", "role_id"],  // ✔ FIXED
          include: [
            {
              model: DB.Roles,
              as: "role",
              attributes: ["roleName"],  // ✔ Load employer’s role name
            },
          ],
        },
      ],
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
      ],
    });
  },

  updateJob: async (job_id: string, updates: any) => {
    const [rows] = await DB.Jobs.update(updates, { where: { job_id } });
    if (rows === 0) return null;
    return await DB.Jobs.findOne({ where: { job_id } });
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
