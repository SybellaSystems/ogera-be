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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getAllCategories = exports.createCategory = void 0;
const http_status_codes_1 = require("http-status-codes");
const responseFormat_1 = require("../../exception/responseFormat");
const jobCategory_service_1 = require("./jobCategory.service");
const response = new responseFormat_1.ResponseFormat();
const createCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const category = yield (0, jobCategory_service_1.createCategoryService)(req.body, req.user.role);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, category, 'Category created successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.createCategory = createCategory;
const getAllCategories = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield (0, jobCategory_service_1.getAllCategoriesService)();
        response.response(res, true, http_status_codes_1.StatusCodes.OK, categories, 'Categories retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAllCategories = getAllCategories;
const getCategoryById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield (0, jobCategory_service_1.getCategoryByIdService)(req.params.id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, category, 'Category retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.NOT_FOUND, false, error.message);
    }
});
exports.getCategoryById = getCategoryById;
const updateCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const category = yield (0, jobCategory_service_1.updateCategoryService)(req.params.id, req.body, req.user.role);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, category, 'Category updated successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.BAD_REQUEST, false, error.message);
    }
});
exports.updateCategory = updateCategory;
const deleteCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const result = yield (0, jobCategory_service_1.deleteCategoryService)(req.params.id, req.user.role);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Category deleted successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.NOT_FOUND, false, error.message);
    }
});
exports.deleteCategory = deleteCategory;
