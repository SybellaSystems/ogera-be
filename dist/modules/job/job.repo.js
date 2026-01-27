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
    createJob: (jobData) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Jobs.create(jobData);
    }),
    findAllJobs: (status) => __awaiter(void 0, void 0, void 0, function* () {
        // Filter by status if provided, ensuring case-sensitive match
        const whereClause = status ? { status: status } : {};
        return yield database_1.DB.Jobs.findAll({
            where: whereClause,
            include: [
                {
                    model: database_1.DB.Users,
                    as: "employer",
                    attributes: ["user_id", "full_name", "role_id"], // ✔ FIXED
                    include: [
                        {
                            model: database_1.DB.Roles,
                            as: "role",
                            attributes: ["roleName"], // ✔ Load employer's role name
                        },
                    ],
                },
                {
                    model: database_1.DB.JobQuestions,
                    as: "questions",
                    order: [['display_order', 'ASC']],
                    required: false,
                },
            ],
            order: [['created_at', 'DESC']],
        });
    }),
    findJobById: (job_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Jobs.findOne({
            where: { job_id },
            include: [
                {
                    model: database_1.DB.Users,
                    as: "employer",
                    attributes: ["user_id", "full_name", "role_id"], // ✔ FIXED
                    include: [
                        {
                            model: database_1.DB.Roles,
                            as: "role",
                            attributes: ["roleName"], // ✔ Load roleName
                        },
                    ],
                },
                {
                    model: database_1.DB.JobQuestions,
                    as: "questions",
                    order: [['display_order', 'ASC']],
                },
            ],
        });
    }),
    updateJob: (job_id, updates) => __awaiter(void 0, void 0, void 0, function* () {
        const [rows] = yield database_1.DB.Jobs.update(updates, { where: { job_id } });
        if (rows === 0)
            return null;
        return yield database_1.DB.Jobs.findOne({
            where: { job_id },
            include: [
                {
                    model: database_1.DB.Users,
                    as: "employer",
                    attributes: ["user_id", "full_name", "role_id"],
                    include: [
                        {
                            model: database_1.DB.Roles,
                            as: "role",
                            attributes: ["roleName"],
                        },
                    ],
                },
                {
                    model: database_1.DB.JobQuestions,
                    as: "questions",
                    order: [['display_order', 'ASC']],
                },
            ],
        });
    }),
    createJobQuestions: (job_id, questions) => __awaiter(void 0, void 0, void 0, function* () {
        // Delete existing questions first
        yield database_1.DB.JobQuestions.destroy({ where: { job_id } });
        // Create new questions
        const questionPromises = questions.map((q, index) => database_1.DB.JobQuestions.create({
            job_id,
            question_text: q.question_text,
            question_type: q.question_type || 'text',
            is_required: q.is_required !== undefined ? q.is_required : false,
            options: q.options ? (typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) : null,
            display_order: q.display_order !== undefined ? q.display_order : index,
        }));
        return yield Promise.all(questionPromises);
    }),
    deleteJob: (job_id) => __awaiter(void 0, void 0, void 0, function* () {
        const rows = yield database_1.DB.Jobs.destroy({ where: { job_id } });
        return rows > 0;
    }),
    findEmployerByNameAndRole: (full_name) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Users.findOne({
            where: { full_name },
            include: [
                {
                    model: database_1.DB.Roles,
                    as: "role",
                    attributes: ["roleName"],
                    where: { roleName: "employer" }, // ✔ only employer role
                },
            ],
        });
    }),
    findJobByEmployerAndUniqueFields: (employer_id, job_title, location) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Jobs.findOne({
            where: { employer_id, job_title, location },
        });
    }),
};
exports.default = repo;
