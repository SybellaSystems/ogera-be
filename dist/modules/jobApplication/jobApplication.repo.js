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
    createApplication: (applicationData) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.JobApplications.create(applicationData);
    }),
    findApplicationById: (application_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.JobApplications.findOne({
            where: { application_id },
            include: [
                {
                    model: database_1.DB.Jobs,
                    as: "job",
                    include: [
                        {
                            model: database_1.DB.Users,
                            as: "employer",
                            attributes: ["user_id", "full_name", "email"],
                            include: [
                                {
                                    model: database_1.DB.Roles,
                                    as: "role",
                                    attributes: ["roleName", "roleType"],
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
                },
                {
                    model: database_1.DB.Users,
                    as: "student",
                    attributes: ["user_id", "full_name", "email", "mobile_number"],
                    include: [
                        {
                            model: database_1.DB.Roles,
                            as: "role",
                            attributes: ["roleName", "roleType"],
                        },
                    ],
                },
                {
                    model: database_1.DB.Users,
                    as: "reviewer",
                    attributes: ["user_id", "full_name", "email"],
                    required: false,
                },
                {
                    model: database_1.DB.JobApplicationAnswers,
                    as: "answers",
                    include: [
                        {
                            model: database_1.DB.JobQuestions,
                            as: "question",
                            attributes: ["question_id", "question_text", "question_type", "is_required"],
                        },
                    ],
                    required: false,
                },
            ],
        });
    }),
    findApplicationByJobAndStudent: (job_id, student_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.JobApplications.findOne({
            where: { job_id, student_id },
        });
    }),
    findAllApplicationsByJob: (job_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.JobApplications.findAll({
            where: { job_id },
            include: [
                {
                    model: database_1.DB.Users,
                    as: "student",
                    attributes: ["user_id", "full_name", "email", "mobile_number"],
                    include: [
                        {
                            model: database_1.DB.Roles,
                            as: "role",
                            attributes: ["roleName", "roleType"],
                        },
                    ],
                },
                {
                    model: database_1.DB.Users,
                    as: "reviewer",
                    attributes: ["user_id", "full_name", "email"],
                    required: false,
                },
                {
                    model: database_1.DB.JobApplicationAnswers,
                    as: "answers",
                    include: [
                        {
                            model: database_1.DB.JobQuestions,
                            as: "question",
                            attributes: ["question_id", "question_text", "question_type", "is_required"],
                        },
                    ],
                    required: false,
                },
            ],
            order: [["applied_at", "DESC"]],
        });
    }),
    findAllApplicationsByStudent: (student_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.JobApplications.findAll({
            where: { student_id },
            include: [
                {
                    model: database_1.DB.Jobs,
                    as: "job",
                    include: [
                        {
                            model: database_1.DB.Users,
                            as: "employer",
                            attributes: ["user_id", "full_name", "email"],
                            include: [
                                {
                                    model: database_1.DB.Roles,
                                    as: "role",
                                    attributes: ["roleName", "roleType"],
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
                },
                {
                    model: database_1.DB.Users,
                    as: "reviewer",
                    attributes: ["user_id", "full_name", "email"],
                    required: false,
                },
                {
                    model: database_1.DB.JobApplicationAnswers,
                    as: "answers",
                    include: [
                        {
                            model: database_1.DB.JobQuestions,
                            as: "question",
                            attributes: ["question_id", "question_text", "question_type", "is_required"],
                        },
                    ],
                    required: false,
                },
            ],
            order: [["applied_at", "DESC"]],
        });
    }),
    findAllApplicationsForEmployer: (employer_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.JobApplications.findAll({
            include: [
                {
                    model: database_1.DB.Jobs,
                    as: "job",
                    where: { employer_id },
                    include: [
                        {
                            model: database_1.DB.Users,
                            as: "employer",
                            attributes: ["user_id", "full_name", "email"],
                        },
                        {
                            model: database_1.DB.JobQuestions,
                            as: "questions",
                            order: [['display_order', 'ASC']],
                            required: false,
                        },
                    ],
                },
                {
                    model: database_1.DB.Users,
                    as: "student",
                    attributes: ["user_id", "full_name", "email", "mobile_number"],
                    include: [
                        {
                            model: database_1.DB.Roles,
                            as: "role",
                            attributes: ["roleName", "roleType"],
                        },
                    ],
                },
                {
                    model: database_1.DB.Users,
                    as: "reviewer",
                    attributes: ["user_id", "full_name", "email"],
                    required: false,
                },
                {
                    model: database_1.DB.JobApplicationAnswers,
                    as: "answers",
                    include: [
                        {
                            model: database_1.DB.JobQuestions,
                            as: "question",
                            attributes: ["question_id", "question_text", "question_type", "is_required"],
                        },
                    ],
                    required: false,
                },
            ],
            order: [["applied_at", "DESC"]],
        });
    }),
    updateApplication: (application_id, updates) => __awaiter(void 0, void 0, void 0, function* () {
        const [rows] = yield database_1.DB.JobApplications.update(updates, {
            where: { application_id },
        });
        if (rows === 0)
            return null;
        return yield database_1.DB.JobApplications.findOne({
            where: { application_id },
            include: [
                {
                    model: database_1.DB.Jobs,
                    as: "job",
                    include: [
                        {
                            model: database_1.DB.Users,
                            as: "employer",
                            attributes: ["user_id", "full_name", "email"],
                        },
                        {
                            model: database_1.DB.JobQuestions,
                            as: "questions",
                            order: [['display_order', 'ASC']],
                            required: false,
                        },
                    ],
                },
                {
                    model: database_1.DB.Users,
                    as: "student",
                    attributes: ["user_id", "full_name", "email", "mobile_number"],
                    include: [
                        {
                            model: database_1.DB.Roles,
                            as: "role",
                            attributes: ["roleName", "roleType"],
                        },
                    ],
                },
                {
                    model: database_1.DB.Users,
                    as: "reviewer",
                    attributes: ["user_id", "full_name", "email"],
                    required: false,
                },
                {
                    model: database_1.DB.JobApplicationAnswers,
                    as: "answers",
                    include: [
                        {
                            model: database_1.DB.JobQuestions,
                            as: "question",
                            attributes: ["question_id", "question_text", "question_type", "is_required"],
                        },
                    ],
                    required: false,
                },
            ],
        });
    }),
    deleteApplication: (application_id) => __awaiter(void 0, void 0, void 0, function* () {
        const rows = yield database_1.DB.JobApplications.destroy({ where: { application_id } });
        return rows > 0;
    }),
    incrementJobApplicationsCount: (job_id) => __awaiter(void 0, void 0, void 0, function* () {
        yield database_1.DB.Jobs.increment("applications", { where: { job_id } });
    }),
    createApplicationAnswers: (application_id, answers) => __awaiter(void 0, void 0, void 0, function* () {
        const answerPromises = answers.map(answer => database_1.DB.JobApplicationAnswers.create({
            application_id,
            question_id: answer.question_id,
            answer_text: typeof answer.answer_text === 'string'
                ? answer.answer_text
                : JSON.stringify(answer.answer_text),
        }));
        return yield Promise.all(answerPromises);
    }),
};
exports.default = repo;
