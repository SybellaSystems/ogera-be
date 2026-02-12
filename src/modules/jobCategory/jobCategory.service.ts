import repo from './jobCategory.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { JobCategory } from '@/interfaces/jobCategory.interfaces';
import { DB } from '@/database';

export const createCategoryService = async (
    categoryData: Partial<JobCategory>,
    userRole: string,
) => {
    // Only superadmin can create categories
    if (userRole !== 'superadmin' && userRole !== 'superAdmin') {
        throw new CustomError(
            'Only superadmin can create job categories',
            StatusCodes.FORBIDDEN,
        );
    }

    // Validate required fields
    if (!categoryData.name || !categoryData.name.trim()) {
        throw new CustomError('Category name is required', StatusCodes.BAD_REQUEST);
    }

    // Check if category with same name already exists
    const existingCategory = await repo.findCategoryByName(categoryData.name.trim());
    if (existingCategory) {
        throw new CustomError(
            'A category with this name already exists',
            StatusCodes.CONFLICT,
        );
    }

    const category = await repo.createCategory({
        name: categoryData.name.trim(),
        description: categoryData.description?.trim(),
        icon: categoryData.icon?.trim(),
        color: categoryData.color?.trim(),
        job_count: categoryData.job_count !== undefined ? Number(categoryData.job_count) : 0,
    });

    return category;
};

export const getAllCategoriesService = async () => {
    const categories = await repo.findAllCategories();
    
    // Return categories with their job_count field (or calculate from actual jobs if not set)
    const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
            // If job_count is manually set, use it; otherwise calculate from actual jobs
            let jobCount = category.job_count || 0;
            if (!category.job_count || category.job_count === 0) {
                jobCount = await DB.Jobs.count({
                    where: { category: category.name },
                });
            }
            return {
                ...category.toJSON(),
                jobCount: jobCount,
            };
        })
    );

    return categoriesWithCounts;
};

export const getCategoryByIdService = async (category_id: string) => {
    const category = await repo.findCategoryById(category_id);
    if (!category) {
        throw new CustomError(
            'Category not found',
            StatusCodes.NOT_FOUND,
        );
    }

    // Use manual job_count if set (including 0), otherwise calculate from actual jobs
    let jobCount = category.job_count;
    if (jobCount === null || jobCount === undefined) {
        jobCount = await DB.Jobs.count({
            where: { category: category.name },
        });
    }

    return {
        ...category.toJSON(),
        jobCount,
    };
};

export const updateCategoryService = async (
    category_id: string,
    updates: Partial<JobCategory>,
    userRole: string,
) => {
    // Only superadmin can update categories
    if (userRole !== 'superadmin' && userRole !== 'superAdmin') {
        throw new CustomError(
            'Only superadmin can update job categories',
            StatusCodes.FORBIDDEN,
        );
    }

    const category = await repo.findCategoryById(category_id);
    if (!category) {
        throw new CustomError(
            'Category not found',
            StatusCodes.NOT_FOUND,
        );
    }

    // If name is being updated, check for duplicates
    if (updates.name && updates.name.trim() !== category.name) {
        const existingCategory = await repo.findCategoryByName(updates.name.trim());
        if (existingCategory) {
            throw new CustomError(
                'A category with this name already exists',
                StatusCodes.CONFLICT,
            );
        }
    }

    const updated = await repo.updateCategory(category_id, {
        name: updates.name?.trim(),
        description: updates.description?.trim(),
        icon: updates.icon?.trim(),
        color: updates.color?.trim(),
        job_count: updates.job_count !== undefined ? Number(updates.job_count) : category.job_count,
    });

    if (!updated) {
        throw new CustomError(
            'Failed to update category',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    return updated;
};

export const deleteCategoryService = async (
    category_id: string,
    userRole: string,
) => {
    // Only superadmin can delete categories
    if (userRole !== 'superadmin' && userRole !== 'superAdmin') {
        throw new CustomError(
            'Only superadmin can delete job categories',
            StatusCodes.FORBIDDEN,
        );
    }

    const category = await repo.findCategoryById(category_id);
    if (!category) {
        throw new CustomError(
            'Category not found',
            StatusCodes.NOT_FOUND,
        );
    }

    // Check if any jobs are using this category
    const jobCount = await DB.Jobs.count({
        where: { category: category.name },
    });

    if (jobCount > 0) {
        throw new CustomError(
            `Cannot delete category. ${jobCount} job(s) are using this category. Please update or delete those jobs first.`,
            StatusCodes.BAD_REQUEST,
        );
    }

    const deleted = await repo.deleteCategory(category_id);
    if (!deleted) {
        throw new CustomError(
            'Failed to delete category',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    return { message: 'Category deleted successfully' };
};

