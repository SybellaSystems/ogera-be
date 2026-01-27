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
const database_1 = require("../../database");
const repo = {
    createCategory: (categoryData) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.JobCategories.create(categoryData);
    }),
    findAllCategories: () => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.JobCategories.findAll({
            order: [['created_at', 'DESC']],
        });
    }),
    findCategoryById: (category_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.JobCategories.findOne({
            where: { category_id },
        });
    }),
    findCategoryByName: (name) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.JobCategories.findOne({
            where: { name },
        });
    }),
    updateCategory: (category_id, updates) => __awaiter(void 0, void 0, void 0, function* () {
        const [rows] = yield database_1.DB.JobCategories.update(updates, { where: { category_id } });
        if (rows === 0)
            return null;
        return yield database_1.DB.JobCategories.findOne({ where: { category_id } });
    }),
    deleteCategory: (category_id) => __awaiter(void 0, void 0, void 0, function* () {
        const rows = yield database_1.DB.JobCategories.destroy({ where: { category_id } });
        return rows > 0;
    }),
    getCategoryJobCount: (category_id) => __awaiter(void 0, void 0, void 0, function* () {
        const count = yield database_1.DB.Jobs.count({
            where: { category: category_id },
        });
        return count;
    }),
};
exports.default = repo;
