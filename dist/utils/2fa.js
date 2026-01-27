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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enable2FA = exports.verifyOTP = exports.generate2FASecret = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const database_1 = require("../database");
const messages_1 = require("../utils/messages");
const constant_1 = require("../constant");
// Generate a new 2FA secret and QR code
const generate2FASecret = (userId, email) => __awaiter(void 0, void 0, void 0, function* () {
    const secret = speakeasy_1.default.generateSecret({
        name: `${constant_1.TWO_FA.APP_NAME}: ${email}`,
    });
    if (!secret.otpauth_url)
        throw new Error(messages_1.Messages.User.TWO_FA_FAILED);
    yield database_1.DB.Users.update({ two_fa_secret: secret.base32 }, { where: { user_id: userId } });
    const qrCodeUrl = yield qrcode_1.default.toDataURL(secret.otpauth_url);
    return { secret: secret.base32, qrCodeUrl };
});
exports.generate2FASecret = generate2FASecret;
// Verify OTP
const verifyOTP = (userId, token) => __awaiter(void 0, void 0, void 0, function* () {
    const userInstance = yield database_1.DB.Users.findOne({ where: { user_id: userId } });
    if (!userInstance)
        throw new Error(messages_1.Messages.User.USER_NOT_FOUND);
    const user = userInstance.get({ plain: true });
    if (!user.two_fa_secret)
        throw new Error(messages_1.Messages.User.TWO_FA_NOT_FOUND);
    return speakeasy_1.default.totp.verify({
        secret: user.two_fa_secret,
        encoding: "base32",
        token,
        window: constant_1.TWO_FA.WINDOW,
    });
});
exports.verifyOTP = verifyOTP;
// Enable 2FA flag in DB
const enable2FA = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield database_1.DB.Users.update({ two_fa_enabled: true }, { where: { user_id: userId } });
});
exports.enable2FA = enable2FA;
