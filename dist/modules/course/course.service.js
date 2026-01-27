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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourseService = exports.updateCourseService = exports.getCourseByIdService = exports.getAllCoursesService = exports.createCourseService = void 0;
const course_repo_1 = __importDefault(require("./course.repo"));
const custom_error_1 = require("../../utils/custom-error");
const http_status_codes_1 = require("http-status-codes");
const createCourseService = (courseData) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate required fields
    if (!courseData.course_name) {
        throw new custom_error_1.CustomError('Course name is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!courseData.type) {
        throw new custom_error_1.CustomError('Course type is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!courseData.tag) {
        throw new custom_error_1.CustomError('Tag is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const { steps } = courseData, coursePayloadData = __rest(courseData, ["steps"]);
    const coursePayload = Object.assign({}, coursePayloadData);
    const course = yield course_repo_1.default.createCourse(coursePayload);
    // Create steps if provided
    if (steps && Array.isArray(steps) && steps.length > 0) {
        yield course_repo_1.default.createCourseSteps(course.course_id, steps);
    }
    // Return course with steps
    const createdCourse = yield course_repo_1.default.findCourseById(course.course_id);
    if (!createdCourse) {
        throw new custom_error_1.CustomError('Failed to retrieve created course', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return createdCourse;
});
exports.createCourseService = createCourseService;
const getAllCoursesService = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield course_repo_1.default.findAllCourses();
});
exports.getAllCoursesService = getAllCoursesService;
const getCourseByIdService = (course_id) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_repo_1.default.findCourseById(course_id);
    if (!course) {
        throw new custom_error_1.CustomError('Course not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    return course;
});
exports.getCourseByIdService = getCourseByIdService;
const updateCourseService = (course_id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_repo_1.default.findCourseById(course_id);
    if (!course) {
        throw new custom_error_1.CustomError('Course not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    const { steps } = updates, courseUpdates = __rest(updates, ["steps"]);
    // Update course fields
    if (Object.keys(courseUpdates).length > 0) {
        yield course_repo_1.default.updateCourse(course_id, courseUpdates);
    }
    // Update steps if provided
    if (steps !== undefined) {
        // Delete existing steps
        yield course_repo_1.default.deleteCourseSteps(course_id);
        // Create new steps if provided
        if (Array.isArray(steps) && steps.length > 0) {
            yield course_repo_1.default.createCourseSteps(course_id, steps);
        }
    }
    // Return updated course
    const updatedCourse = yield course_repo_1.default.findCourseById(course_id);
    if (!updatedCourse) {
        throw new custom_error_1.CustomError('Failed to retrieve updated course', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return updatedCourse;
});
exports.updateCourseService = updateCourseService;
const deleteCourseService = (course_id) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_repo_1.default.findCourseById(course_id);
    if (!course) {
        throw new custom_error_1.CustomError('Course not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    yield course_repo_1.default.deleteCourse(course_id);
    return { message: 'Course deleted successfully' };
});
exports.deleteCourseService = deleteCourseService;
