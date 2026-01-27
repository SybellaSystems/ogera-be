"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helmetMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
const helmetMiddleware = (app) => {
    app.use((0, helmet_1.default)({
        // remove "X-Powered-By: Express"
        hidePoweredBy: true,
        // prevent clickjacking
        frameguard: { action: "deny" },
        // prevent MIME sniffing
        noSniff: true,
        // enforce HTTPS (only works on production with HTTPS)
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
        // basic XSS protection
        xssFilter: true,
    }));
};
exports.helmetMiddleware = helmetMiddleware;
