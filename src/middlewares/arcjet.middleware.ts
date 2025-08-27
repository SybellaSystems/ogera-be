import { Request, Response, NextFunction } from "express";
import arcjet, { validateEmail } from "@arcjet/node";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    validateEmail({
      mode: "LIVE", // or "DRY_RUN" for testing
      deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    }),
  ],
});

export const arcjetEmailValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new Error("Email is required"));
    }

    const decision = await aj.protect(req, { email });

    if (decision.isDenied() && decision.reason.isEmail()) {
      // Pass an error to the global error handler instead of returning res directly
      return next(new Error("Invalid email address"));
    }

    // Email passed validation
    next();
  } catch (error) {
    console.error("Arcjet error:", error);
    next(new Error("Email validation failed"));
  }
};
