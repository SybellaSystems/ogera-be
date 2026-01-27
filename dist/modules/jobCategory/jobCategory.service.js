"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategoryService = exports.updateCategoryService = exports.getCategoryByIdService = exports.getAllCategoriesService = exports.createCategoryService = void 0;
const jobCategory_repo_1 = __importDefault(require("./jobCategory.repo"));
const custom_error_1 = require("../../utils/custom-error");
const http_status_codes_1 = require("http-status-codes");
const database_1 = require("../../database");
const createCategoryService = (categoryData, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Only superadmin can create categories
    if (userRole !== 'superadmin' && userRole !== 'superAdmin') {
        throw new custom_error_1.CustomError('Only superadmin can create job categories', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // Validate required fields
    if (!categoryData.name || !categoryData.name.trim()) {
        throw new custom_error_1.CustomError('Category name is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Check if category with same name already exists
    const existingCategory = yield jobCategory_repo_1.default.findCategoryByName(categoryData.name.trim());
    if (existingCategory) {
        throw new custom_error_1.CustomError('A category with this name already exists', http_status_codes_1.StatusCodes.CONFLICT);
    }
    const category = yield jobCategory_repo_1.default.createCategory({
        name: categoryData.name.trim(),
        description: (_a = categoryData.description) === null || _a === void 0 ? void 0 : _a.trim(),
        icon: (_b = categoryData.icon) === null || _b === void 0 ? void 0 : _b.trim(),
        color: (_c = categoryData.color) === null || _c === void 0 ? void 0 : _c.trim(),
        job_count: categoryData.job_count !== undefined ? Number(categoryData.job_count) : 0,
    });
    return category;
});
exports.createCategoryService = createCategoryService;
const getAllCategoriesService = () => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield jobCategory_repo_1.default.findAllCategories();
    // Return categories with their job_count field (or calculate from actual jobs if not set)
    const categoriesWithCounts = yield Promise.all(categories.map((category) => __awaiter(void 0, void 0, void 0, function* () {
        // If job_count is manually set, use it; otherwise calculate from actual jobs
        let jobCount = category.job_count || 0;
        if (!category.job_count || category.job_count === 0) {
            jobCount = yield database_1.DB.Jobs.count({
                where: { category: category.name },
            });
        }
        return Object.assign(Object.assign({}, category.toJSON()), { jobCount: jobCount });
    })));
    return categoriesWithCounts;
});
exports.getAllCategoriesService = getAllCategoriesService;
const getCategoryByIdService = (category_id) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield jobCategory_repo_1.default.findCategoryById(category_id);
    if (!category) {
        throw new custom_error_1.CustomError('Category not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // Use manual job_count if set (including 0), otherwise calculate from actual jobs
    let jobCount = category.job_count;
    if (jobCount === null || jobCount === undefined) {
        jobCount = yield database_1.DB.Jobs.count({
            where: { category: category.name },
        });
    }
    return Object.assign(Object.assign({}, category.toJSON()), { jobCount });
});
exports.getCategoryByIdService = getCategoryByIdService;
const updateCategoryService = (category_id, updates, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    // Only superadmin can update categories
    if (userRole !== 'superadmin' && userRole !== 'superAdmin') {
        throw new custom_error_1.CustomError('Only superadmin can update job categories', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    const category = yield jobCategory_repo_1.default.findCategoryById(category_id);
    if (!category) {
        throw new custom_error_1.CustomError('Category not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // If name is being updated, check for duplicates
    if (updates.name && updates.name.trim() !== category.name) {
        const existingCategory = yield jobCategory_repo_1.default.findCategoryByName(updates.name.trim());
        if (existingCategory) {
            throw new custom_error_1.CustomError('A category with this name already exists', http_status_codes_1.StatusCodes.CONFLICT);
        }
    }
    const updated = yield jobCategory_repo_1.default.updateCategory(category_id, {
        name: (_a = updates.name) === null || _a === void 0 ? void 0 : _a.trim(),
        description: (_b = updates.description) === null || _b === void 0 ? void 0 : _b.trim(),
        icon: (_c = updates.icon) === null || _c === void 0 ? void 0 : _c.trim(),
        color: (_d = updates.color) === null || _d === void 0 ? void 0 : _d.trim(),
        job_count: updates.job_count !== undefined ? Number(updates.job_count) : category.job_count,
    });
    if (!updated) {
        throw new custom_error_1.CustomError('Failed to update category', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return updated;
});
exports.updateCategoryService = updateCategoryService;
const deleteCategoryService = (category_id, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    // Only superadmin can delete categories
    if (userRole !== 'superadmin' && userRole !== 'superAdmin') {
        throw new custom_error_1.CustomError('Only superadmin can delete job categories', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    const category = yield jobCategory_repo_1.default.findCategoryById(category_id);
    if (!category) {
        throw new custom_error_1.CustomError('Category not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // Check if any jobs are using this category
    const jobCount = yield database_1.DB.Jobs.count({
        where: { category: category.name },
    });
    if (jobCount > 0) {
        throw new custom_error_1.CustomError(`Cannot delete category. ${jobCount} job(s) are using this category. Please update or delete those jobs first.`, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const deleted = yield jobCategory_repo_1.default.deleteCategory(category_id);
    if (!deleted) {
        throw new custom_error_1.CustomError('Failed to delete category', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return { message: 'Category deleted successfully' };
});
exports.deleteCategoryService = deleteCategoryService;
