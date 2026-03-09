export const JWT = {
  EXPIRY: process.env.JWT_EXPIRY || "1h",
  SECRET_KEY_NAME: "JWT_SECRET",
  DEFAULT_ALGO: "HS256",
};

