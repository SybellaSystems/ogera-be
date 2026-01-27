"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSecret = void 0;
const crypto_1 = __importDefault(require("crypto"));
const encryptSecret = (secret) => {
    const key = process.env.SECRET_KEY;
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
    let encrypted = cipher.update(secret, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
};
exports.encryptSecret = encryptSecret;
