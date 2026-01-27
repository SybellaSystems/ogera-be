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
exports.getMyTrustScoreService = exports.getTrustScoreService = void 0;
const custom_error_1 = require("../../utils/custom-error");
const http_status_codes_1 = require("http-status-codes");
const database_1 = require("../../database");
// Constants for TrustScore calculation
const EMAIL_VERIFICATION_WEIGHT = 33.33;
const PHONE_VERIFICATION_WEIGHT = 33.33;
const ACADEMIC_VERIFICATION_WEIGHT = 33.34;
/**
 * Calculate TrustScore breakdown based on verifications
 */
const calculateTrustScoreBreakdown = (emailVerified, phoneVerified, academicVerified) => {
    const emailScore = emailVerified ? EMAIL_VERIFICATION_WEIGHT : 0;
    const phoneScore = phoneVerified ? PHONE_VERIFICATION_WEIGHT : 0;
    const academicScore = academicVerified ? ACADEMIC_VERIFICATION_WEIGHT : 0;
    const totalScore = emailScore + phoneScore + academicScore;
    return {
        email_verification_score: emailScore,
        phone_verification_score: phoneScore,
        academic_verification_score: academicScore,
        total_score: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
    };
};
/**
 * Get TrustScore level and description based on score
 */
const getTrustScoreLevel = (score) => {
    if (score >= 85) {
        return {
            level: 'Exceptional',
            description: 'Demonstrates outstanding verification status with all credentials verified. Trusted for leadership and high-value transactions.',
        };
    }
    else if (score >= 70) {
        return {
            level: 'Competent',
            description: 'Reliable verification status. Performs well with majority of credentials verified.',
        };
    }
    else if (score >= 55) {
        return {
            level: 'Developing',
            description: 'Shows potential with some verifications completed. Requires additional verification for full access.',
        };
    }
    else if (score >= 40) {
        return {
            level: 'Emerging',
            description: 'Basic verification status. Limited verifications completed. High potential for growth.',
        };
    }
    else {
        return {
            level: 'Limited',
            description: 'Insufficient verification status. Please complete email, phone, and academic verifications to improve your TrustScore.',
        };
    }
};
/**
 * Get TrustScore for a user
 */
const getTrustScoreService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    // Get user with all verification fields
    const user = yield database_1.DB.Users.findOne({
        where: { user_id },
    });
    if (!user) {
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // Check academic verification status
    const academicVerification = yield database_1.DB.AcademicVerifications.findOne({
        where: { user_id },
    });
    const emailVerified = user.email_verified || false;
    const phoneVerified = user.phone_verified || false;
    const academicVerified = (academicVerification === null || academicVerification === void 0 ? void 0 : academicVerification.status) === 'accepted' ? true : false;
    // Calculate TrustScore breakdown
    const breakdown = calculateTrustScoreBreakdown(emailVerified, phoneVerified, academicVerified);
    // Get TrustScore level
    const { level, description } = getTrustScoreLevel(breakdown.total_score);
    return {
        user_id,
        trust_score: breakdown.total_score,
        email_verified: emailVerified,
        phone_verified: phoneVerified,
        academic_verified: academicVerified,
        breakdown,
        level,
        description,
    };
});
exports.getTrustScoreService = getTrustScoreService;
/**
 * Get TrustScore for current authenticated user
 */
const getMyTrustScoreService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, exports.getTrustScoreService)(user_id);
});
exports.getMyTrustScoreService = getMyTrustScoreService;
