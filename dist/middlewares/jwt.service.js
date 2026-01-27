"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
// Generate short-lived access token (15m)
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, config_1.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: '15m', // Changed from 1m to 15m for easier testing
    });
};
exports.generateAccessToken = generateAccessToken;
// Generate long-lived refresh token (7 days)
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, config_1.JWT_REFRESH_TOKEN_SECRET, {
        expiresIn: '7d',
    });
};
exports.generateRefreshToken = generateRefreshToken;
// Verify Access Token
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.JWT_ACCESS_TOKEN_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
// Verify Refresh Token (used for refresh endpoint)
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.JWT_REFRESH_TOKEN_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
