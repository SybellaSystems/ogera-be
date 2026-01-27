"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNumericOTP = void 0;
const generateNumericOTP = (length = 4) => {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
};
exports.generateNumericOTP = generateNumericOTP;
