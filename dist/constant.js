"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TWO_FA = exports.JWT = void 0;
exports.JWT = {
    EXPIRY: process.env.JWT_EXPIRY || "1h",
    SECRET_KEY_NAME: "JWT_SECRET",
    DEFAULT_ALGO: "HS256",
};
exports.TWO_FA = {
    APP_NAME: "Ogera",
    WINDOW: 1,
};
