"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const trustScore_controller_1 = require("./trustScore.controller");
const trustScoreRouter = express_1.default.Router();
// Get authenticated user's TrustScore
trustScoreRouter.get('/me', auth_middleware_1.authMiddleware, trustScore_controller_1.getMyTrustScore);
// Get TrustScore for a specific user (requires authentication, can add admin middleware if needed)
trustScoreRouter.get('/:user_id', auth_middleware_1.authMiddleware, trustScore_controller_1.getUserTrustScore);
exports.default = trustScoreRouter;
