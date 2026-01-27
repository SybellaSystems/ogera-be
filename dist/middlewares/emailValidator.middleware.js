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
exports.validateEmailMiddleware = void 0;
const validator_1 = __importDefault(require("validator"));
const disposable_email_domains_1 = __importDefault(require("disposable-email-domains"));
const promises_1 = __importDefault(require("dns/promises"));
// Custom blocklist (extend as needed)
const customBlocklist = [
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "sharklasers.com",
    "yopmail.com",
];
const validateEmailMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
    }
    // ✅ Format check
    if (!validator_1.default.isEmail(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
    }
    // ✅ Extract domain
    const domain = email.split("@")[1].toLowerCase();
    // ✅ Block disposable domains
    if (disposable_email_domains_1.default.includes(domain) || customBlocklist.includes(domain)) {
        res.status(400).json({ error: "Disposable or temporary emails are not allowed" });
        return;
    }
    try {
        // ✅ Check MX records (mail servers)
        const mxRecords = yield promises_1.default.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
            res.status(400).json({ error: "Email domain has no MX records" });
            return;
        }
    }
    catch (err) {
        res.status(400).json({ error: "Invalid or unreachable email domain" });
        return;
    }
    return next(); // ✅ Passed all checks
});
exports.validateEmailMiddleware = validateEmailMiddleware;
