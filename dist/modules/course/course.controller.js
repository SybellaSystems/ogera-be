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
exports.deleteCourse = exports.updateCourse = exports.getCourseById = exports.getAllCourses = exports.createCourse = void 0;
const http_status_codes_1 = require("http-status-codes");
const responseFormat_1 = require("../../exception/responseFormat");
const messages_1 = require("../../utils/messages");
const course_service_1 = require("./course.service");
const response = new responseFormat_1.ResponseFormat();
const createCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const course = yield (0, course_service_1.createCourseService)(req.body);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, course, messages_1.Messages.Course.CREATE_COURSE);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.createCourse = createCourse;
const getAllCourses = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield (0, course_service_1.getAllCoursesService)();
        response.response(res, true, http_status_codes_1.StatusCodes.OK, courses, messages_1.Messages.Course.GET_ALL_COURSES);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAllCourses = getAllCourses;
const getCourseById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield (0, course_service_1.getCourseByIdService)(id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, course, messages_1.Messages.Course.GET_COURSE_BY_ID);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getCourseById = getCourseById;
const updateCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield (0, course_service_1.updateCourseService)(id, req.body);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, course, messages_1.Messages.Course.UPDATE_COURSE);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateCourse = updateCourse;
const deleteCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, course_service_1.deleteCourseService)(id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, messages_1.Messages.Course.DELETE_COURSE);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.deleteCourse = deleteCourse;
