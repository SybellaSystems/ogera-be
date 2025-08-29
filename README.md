## 🚀 Prerequisite

Make sure you have installed the following tools:

- **Node.js** >= v18.x.x  
- **npm**

---

## 📥 Installation

1. Clone repository:

   ```bash
   git clone https://github.com/pius706975/express-typescript-sequelize-boilerplate.git
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create `.env.development` to store the environment configuration:

   ```bash
   .env.development
   ```

4. Fill the `.env.development` file based on your requirements:

   ```
    PORT = port number
    NODE_ENV = env
    BASE_URL = base url
    
    DB_PORT = db port
    DB_USERNAME = db username
    DB_PASSWORD = db password
    DB_NAME = db name
    DB_HOST = host
    DB_DIALECT = dialect
    
    JWT_ACCESS_TOKEN_SECRET = JWT secret
   ```

## 🏃 Run the server and the test

Run the server in the development mode:

```bash
npm run dev
```

Or in the production mode

```bash
npm start
```

## 🛠 Additional

- **Linting and code formatting:**

  ```bash
  npm run lint      # Linting check
  npm run lint:fix  # Formatting code with prettier
  ```

- **Creating DB table:**

  ```bash
  npm run migration:generate --name "create-table-name"
  ```
---

## 📚 API Documentation

Access swagger documentations: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

Swagger will automatically return the documentations based on route file annotation.

---

## 📂 Project structure

Let's have a look at this structure:

```
├── /node_modules
├── /src                 
│   ├── /config          # Base configuration such as .env key and sequelize-cli configuration
│   ├── /database
│   │   ├── /migrations  # DB migration files to migrate our DB tables
│   │   └── /models      # DB model files that will be used in the development
│   ├── /docs            # Swagger documentations
│   ├── /interfaces      # Interfaces
│   ├── /logs            # Access logs
│   ├── /middleware      # App middlewares
│   ├── /modules         # App modules
│   │   ├── /auth        #    
│   │   ├── /user        # These module directories will store repo, service, controller, routes, and validator files.
│   │   └── /etc         #
│   ├── /routes          # Main route file that store all of the module routes 
│   ├── /types           # typescript support
│   ├── /utils           # Utils
│   └── server.js        # Entry point of the app
├── /tests               # Unit test main folder
│   ├── /middleware      # Middleware tests
│   ├── /modules         # Modules tests
├── .env.development     # Development environment variables
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

## dependency scans
```bash
snyk test
```

## role based access

```
authRouter.post(
  "/2fa/setup",
  authMiddleware,
  authorizeRoles("employer", "admin"),
  setup2FA
);

authRouter.post(
  "/2fa/verify",
  authMiddleware,
  authorizeRoles("employer", "admin"),
  verify2FA
);

/**
 * Student-only (admin also has access)
 */
authRouter.post(
  "/forgot-password",
  authMiddleware,
  authorizeRoles("student", "admin"),
  forgotPassword
);

authRouter.post(
  "/verify-otp",
  authMiddleware,
  authorizeRoles("student", "admin"),
  verifyResetOTP
);

authRouter.post(
  "/reset-password",
  authMiddleware,
  authorizeRoles("student", "admin"),
  resetPassword
);
```

