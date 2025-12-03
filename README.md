## 🚀 Quick Start

**New to Ogera API?** Check out the [**Quick Start Guide**](./QUICK_START.md) for a step-by-step tutorial!

**Looking for documentation?** See the [**Documentation Index**](./DOCUMENTATION_INDEX.md) for all available resources.

---

## 🚀 Prerequisite

Make sure you have installed the following tools:

- **Node.js** >= v18.x.x  
- **npm**
- **PostgreSQL** >= v12.x

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

   ```env
    # Server Configuration
    PORT = 5000
    NODE_ENV = development
    BASE_URL = http://localhost:5000
    
    # Database Configuration
    DB_PORT = 5432
    DB_USERNAME = your_db_username
    DB_PASSWORD = your_db_password
    DB_NAME = ogera_db
    DB_HOST = localhost
    DB_DIALECT = postgres
    
    # JWT Configuration
    JWT_ACCESS_TOKEN_SECRET = your_access_token_secret
    JWT_REFRESH_TOKEN_SECRET = your_refresh_token_secret
    
    # Email Configuration (for OTP)
    MAIL_HOST = smtp.gmail.com
    MAIL_PORT = 587
    MAIL_USER = your_email@gmail.com
    MAIL_PASSWORD = your_app_password
    MAIL_FROM = noreply@ogera.com
   ```

5. Run database migrations:

   ```bash
   npm run migration
   ```

## 🏃 Run the server and the test

Run the server in the development mode:

```bash
npm run dev
```

Or in the production mode

```bash
npm run build
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

### Interactive Documentation (Swagger)
Access interactive API documentation at: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

### Comprehensive Documentation
For detailed API documentation including request/response examples, authentication guide, and more, see:
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference guide

### Postman Collection
Import the Postman collection to test all API endpoints:
- **[Ogera_API.postman_collection.json](./Ogera_API.postman_collection.json)** - Ready-to-use Postman collection

To use the Postman collection:
1. Import `Ogera_API.postman_collection.json` into Postman
2. The collection includes environment variables for easy testing
3. Login request automatically saves the access token for authenticated requests

### Quick Overview

The API includes the following modules:
- **Authentication** (`/api/auth`) - User registration, login, 2FA, password reset
- **Jobs** (`/api/jobs`) - Job posting management with CRUD operations
- **Roles** (`/api/roles`) - Role and permission management

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

