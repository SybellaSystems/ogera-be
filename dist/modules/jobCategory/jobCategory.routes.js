"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobCategory_controller_1 = require("./jobCategory.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const jobCategoryRouter = express_1.default.Router();
// Get all categories - public endpoint (for dropdowns)
jobCategoryRouter.get('/', auth_middleware_1.authMiddleware, jobCategory_controller_1.getAllCategories);
// Get category by ID
jobCategoryRouter.get('/:id', auth_middleware_1.authMiddleware, jobCategory_controller_1.getCategoryById);
// Create category - only superadmin
jobCategoryRouter.post('/', auth_middleware_1.authMiddleware, jobCategory_controller_1.createCategory);
// Update category - only superadmin
jobCategoryRouter.put('/:id', auth_middleware_1.authMiddleware, jobCategory_controller_1.updateCategory);
// Delete category - only superadmin
jobCategoryRouter.delete('/:id', auth_middleware_1.authMiddleware, jobCategory_controller_1.deleteCategory);
exports.default = jobCategoryRouter;
