# 🎓 Ogera Backend API

<div align="center">

A robust, scalable backend API for the Ogera platform - connecting students with employers through a comprehensive job management and academic verification system.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.37.4-blue.svg)](https://sequelize.org/)

</div>

---

## 🌟 Overview

**Ogera** is a comprehensive platform that bridges the gap between students and employers. This backend API provides secure, RESTful endpoints for managing users, jobs, academic verifications, disputes, and analytics across three distinct user roles: Students, Employers, and Administrators.

Built with TypeScript, Express.js, and PostgreSQL, the API offers type-safe, scalable, and maintainable code with comprehensive authentication, authorization, and security features.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Run the Server](#-run-the-server-and-the-test)
- [Additional Tools](#-additional)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Role-Based Access Control](#-role-based-access)

---

## 🚀 Quick Start

**New to Ogera API?** Check out the [**Quick Start Guide**](./QUICK_START.md) for a step-by-step tutorial!

---

## 🚀 Prerequisites

Make sure you have installed the following tools:

- **Node.js** >= v18.x.x  
- **npm**
- **PostgreSQL** >= v12.x

---

## 🛠️ Tech Stack

### **Core**
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Express.js](https://expressjs.com/)** - Web application framework

### **Database**
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database
- **[Sequelize](https://sequelize.org/)** - ORM for database operations
- **[Sequelize CLI](https://github.com/sequelize/cli)** - Database migrations

### **Authentication & Security**
- **[JWT](https://jwt.io/)** - JSON Web Tokens for authentication
- **[Bcrypt](https://www.npmjs.com/package/bcrypt)** - Password hashing
- **[Speakeasy](https://www.npmjs.com/package/speakeasy)** - Two-factor authentication
- **[Helmet](https://helmetjs.github.io/)** - Security headers
- **[Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)** - Rate limiting

### **File Storage**
- **[AWS S3 SDK](https://aws.amazon.com/sdk-for-javascript/)** - Cloud storage (optional)
- **[Multer](https://www.npmjs.com/package/multer)** - File upload handling

### **Email**
- **[Nodemailer](https://nodemailer.com/)** - Email sending

### **Documentation**
- **[Swagger](https://swagger.io/)** - API documentation

### **Utilities**
- **[Winston](https://github.com/winstonjs/winston)** - Logging
- **[Joi](https://joi.dev/)** - Schema validation
- **[Cookie Parser](https://www.npmjs.com/package/cookie-parser)** - Cookie handling

---

## 📥 Installation

1. Clone repository:

   ```bash
   git clone <repository-url>
   cd ogera-be
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
    FRONTEND_URL = http://localhost:5173
    
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
    SMTP_HOST = smtp.gmail.com
    SMTP_PORT = 587
    SMTP_USER = your_email@gmail.com
    SMTP_PASS = your_app_password
    EMAIL_FROM = noreply@ogera.com
    EMAIL_FROM_NAME = Ogera Support
    
    # Storage Configuration
    USE_LOCAL_STORAGE = true
    LOCAL_STORAGE_PATH = ./uploads
    
    # AWS S3 Configuration (Optional - if USE_LOCAL_STORAGE = false)
    # AWS_ACCESS_KEY_ID = your_aws_access_key
    # AWS_SECRET_ACCESS_KEY = your_aws_secret_key
    # AWS_REGION = us-east-1
    # AWS_S3_BUCKET_NAME = your_bucket_name
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

- **Running tests:**

  ```bash
  npm test          # Run all tests
  npm run test:watch # Run tests in watch mode
  ```
---

## 📚 API Documentation

### Interactive Documentation (Swagger)
Access interactive API documentation at: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

### Comprehensive Documentation
For detailed API documentation including request/response examples, authentication guide, and more, see:
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference guide

### Postman Collection
If available, import the Postman collection to test all API endpoints:
- **Ogera_API.postman_collection.json** - Ready-to-use Postman collection (if provided)

To use the Postman collection:
1. Import `Ogera_API.postman_collection.json` into Postman (if available)
2. The collection includes environment variables for easy testing
3. Login request automatically saves the access token for authenticated requests

### Quick Overview

The API includes the following modules:
- **Authentication** (`/api/auth`) - User registration, login, 2FA, password reset
- **Jobs** (`/api/jobs`) - Job posting management with CRUD operations
- **Job Applications** (`/api/job-applications`) - Job application management
- **Roles** (`/api/roles`) - Role and permission management
- **Academic Verification** (`/api/academic-verification`) - Academic document verification
- **Users** (`/api/users`) - User management and profiles
- **Notifications** (`/api/notifications`) - Notification management

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
│   └── server.ts        # Entry point of the app
├── /tests               # Unit test main folder
│   ├── /middleware      # Middleware tests
│   ├── /modules         # Modules tests
├── .env.development     # Development environment variables
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

## 🔒 Security

### Dependency Vulnerability Scanning
```bash
snyk test
```

### Security Features
- **Helmet.js** - Security headers middleware
- **Rate Limiting** - API rate limiting to prevent abuse
- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for password encryption
- **2FA Support** - Two-factor authentication for enhanced security
- **CORS Configuration** - Cross-origin resource sharing protection

## 🔐 Role-Based Access Control

The API implements a comprehensive role-based access control (RBAC) system. Routes are protected using middleware that checks user roles and permissions.

### Example Usage

```typescript
// Employer and Admin only
authRouter.post(
  "/2fa/setup",
  authMiddleware,
  authorizeRoles("employer", "admin"),
  setup2FA
);

// Student and Admin only
authRouter.post(
  "/forgot-password",
  authMiddleware,
  authorizeRoles("student", "admin"),
  forgotPassword
);
```

### Available Roles
- **Admin/SuperAdmin** - Full system access
- **Employer** - Job posting and management
- **Student** - Job browsing and application

### Permission System
Permissions are stored as JSON in the roles table, allowing fine-grained control over resource access:
```json
{
  "resource": "/jobs",
  "actions": ["view", "create", "edit", "delete"]
}
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👨‍💻 Development Team

For questions, issues, or contributions, please contact the development team.

---

<div align="center">

**Built with ❤️ using Node.js, TypeScript, and Express**

</div>

