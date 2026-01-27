import { DB } from "@/database";
import { JobCategory } from "@/interfaces/jobCategory.interfaces";

const repo = {
  createCategory: async (categoryData: Pick<JobCategory, 'name'> & Partial<Pick<JobCategory, 'description' | 'icon' | 'color' | 'job_count'>>) => {
    return await DB.JobCategories.create(categoryData);
  },

  findAllCategories: async () => {
    return await DB.JobCategories.findAll({
      order: [['created_at', 'DESC']],
    });
  },

  findCategoryById: async (category_id: string) => {
    return await DB.JobCategories.findOne({
      where: { category_id },
    });
  },

  findCategoryByName: async (name: string) => {
    return await DB.JobCategories.findOne({
      where: { name },
    });
  },

  updateCategory: async (category_id: string, updates: Partial<JobCategory>) => {
    const [rows] = await DB.JobCategories.update(updates, { where: { category_id } });
    if (rows === 0) return null;
    return await DB.JobCategories.findOne({ where: { category_id } });
  },

  deleteCategory: async (category_id: string) => {
    const rows = await DB.JobCategories.destroy({ where: { category_id } });
    return rows > 0;
  },

  getCategoryJobCount: async (category_id: string) => {
    const count = await DB.Jobs.count({
      where: { category: category_id },
    });
    return count;
  },
};

export default repo;

