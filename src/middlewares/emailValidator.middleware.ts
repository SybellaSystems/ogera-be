import { Request, Response, NextFunction } from "express";
import validator from "validator";
import disposableDomains from "disposable-email-domains";
import dns from "dns/promises";

// Custom blocklist (extend as needed)
const customBlocklist = [
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "sharklasers.com",
  "yopmail.com",
];

export const validateEmailMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  // ✅ Format check
  if (!validator.isEmail(email)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }

  // ✅ Extract domain
  const domain = email.split("@")[1].toLowerCase();

  // ✅ Block disposable domains
  if (disposableDomains.includes(domain) || customBlocklist.includes(domain)) {
    res.status(400).json({ error: "Disposable or temporary emails are not allowed" });
    return;
  }

  try {
    // ✅ Check MX records (mail servers)
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      res.status(400).json({ error: "Email domain has no MX records" });
      return;
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid or unreachable email domain" });
    return;
  }

  return next(); // ✅ Passed all checks
};
