"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
const user_1 = require("./user");
const auth_1 = require("./auth");
const generic_1 = require("./generic");
const job_1 = require("./job");
const course_1 = require("./course");
exports.Messages = {
    User: user_1.UserMessages,
    Auth: auth_1.AuthMessages,
    Generic: generic_1.GenericMessages,
    Job: job_1.JobMessages,
    Course: course_1.CourseMessages,
};
