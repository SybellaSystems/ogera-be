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
exports.getUserTrustScore = exports.getMyTrustScore = void 0;
const http_status_codes_1 = require("http-status-codes");
const responseFormat_1 = require("../../exception/responseFormat");
const trustScore_service_1 = require("./trustScore.service");
const response = new responseFormat_1.ResponseFormat();
/**
 * Get TrustScore for authenticated user
 */
const getMyTrustScore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const trustScore = yield (0, trustScore_service_1.getMyTrustScoreService)(user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, trustScore, 'TrustScore retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getMyTrustScore = getMyTrustScore;
/**
 * Get TrustScore for a specific user (admin only)
 */
const getUserTrustScore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id } = req.params;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'User ID is required');
            return;
        }
        const trustScore = yield (0, trustScore_service_1.getTrustScoreService)(user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, trustScore, 'TrustScore retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getUserTrustScore = getUserTrustScore;
