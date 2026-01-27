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
    createCourse: (courseData) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Courses.create(courseData);
    }),
    findAllCourses: () => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Courses.findAll({
            include: [
                {
                    model: database_1.DB.CourseSteps,
                    as: "steps",
                    order: [['step_order', 'ASC']],
                    required: false,
                },
            ],
            order: [['created_at', 'DESC']],
        });
    }),
    findCourseById: (course_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Courses.findOne({
            where: { course_id },
            include: [
                {
                    model: database_1.DB.CourseSteps,
                    as: "steps",
                    order: [['step_order', 'ASC']],
                },
            ],
        });
    }),
    updateCourse: (course_id, updates) => __awaiter(void 0, void 0, void 0, function* () {
        const [rows] = yield database_1.DB.Courses.update(updates, { where: { course_id } });
        if (rows === 0)
            return null;
        return yield database_1.DB.Courses.findOne({
            where: { course_id },
            include: [
                {
                    model: database_1.DB.CourseSteps,
                    as: "steps",
                    order: [['step_order', 'ASC']],
                },
            ],
        });
    }),
    deleteCourse: (course_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Courses.destroy({ where: { course_id } });
    }),
    createCourseSteps: (course_id, steps) => __awaiter(void 0, void 0, void 0, function* () {
        const stepData = steps.map(step => ({
            course_id,
            step_type: step.step_type,
            step_content: step.step_content,
            step_title: step.step_title || null,
            step_order: step.step_order,
        }));
        return yield database_1.DB.CourseSteps.bulkCreate(stepData);
    }),
    deleteCourseSteps: (course_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.CourseSteps.destroy({ where: { course_id } });
    }),
};
exports.default = repo;
