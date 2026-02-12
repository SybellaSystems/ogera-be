import helmet from "helmet";
import { Application } from "express";

export const helmetMiddleware = (app: Application) => {
  app.use(
    helmet({
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
    })
  );
};
