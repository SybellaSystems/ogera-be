# Backend Documentation

## 1. Backend Framework

The backend is implemented using:

- **Node.js** — Server runtime
- **TypeScript** — Programming language
- **Express.js** — HTTP/API framework
- **Sequelize 6** — Database ORM
- **PostgreSQL** — Relational database

The backend provides REST APIs for authentication, users, jobs, applications, referrals, profiles, learning, assessments, communication, payments, and other platform functionality.

---

## 2. Runtime and Version

The backend runs on **Node.js**.

The project currently uses:

```text
Node.js 22.22.0
```

The TypeScript source code is compiled and executed according to the project's build and deployment configuration.

Runtime and dependency versions must be maintained in the project's package configuration files and deployment configuration.

---

## 3. Project Structure

Backend feature code is organized under:

```text
src/
├── modules/
│   └── <feature>/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       └── validators/
│
├── middleware/
├── config/
├── database/
│   ├── models/
│   ├── migrations/
│   └── seeders/
│
├── association/
├── interfaces/
├── utils/
├── server.ts
└── ...
```

### Module Structure

Feature-specific business logic should remain inside its corresponding module.

A typical module may contain:

```text
<feature>/
├── routes/
├── controllers/
├── services/
├── repositories/
└── validators/
```

Not every module is required to contain every layer. Layers should be introduced where they provide clear separation of responsibilities.

### Shared Code

Cross-module functionality belongs in appropriate shared directories such as:

- `middleware`
- `config`
- `utils`
- `interfaces`
- `database`
- `association`

---

## 4. Controllers

Controllers handle HTTP-level responsibilities.

A controller should:

- Receive the request
- Read validated request parameters/body/query data
- Obtain authenticated-user information where required
- Call the appropriate service
- Return the HTTP response
- Pass unexpected errors to the centralized error handler

Controllers should not contain large amounts of business logic.

Business rules should remain in the service layer.

---

## 5. Services

Services contain the application's business logic.

Services are responsible for:

- Applying business rules
- Coordinating repositories and database operations
- Performing business validations
- Managing multi-step operations
- Coordinating external integrations where appropriate
- Preparing business-level results for controllers

Important business logic must be documented when the implementation is not self-explanatory.

Examples include:

- Job eligibility and visibility rules
- Application status transitions
- Referral verification and availability rules
- Student badge/subscription-based access
- Trust-score calculations
- Payment and transaction processing
- Permission-based operations

Business rules should be kept independent from HTTP-specific controller logic whenever practical.

---

## 6. Repositories and Database Access

Repositories, where used, provide a dedicated layer for database operations.

Database access is implemented using:

```text
Sequelize 6
PostgreSQL
```

Database models are maintained under:

```text
src/database/models/
```

Database initialization is handled through:

```text
src/database/index.ts
```

Model relationships are centralized in:

```text
src/association/index.ts
```

Database schema changes must be implemented through Sequelize migrations.

Detailed database architecture is documented separately in:

```text
/doc/05-database.md
```

---

## 7. Routes

Routes define the HTTP endpoints exposed by the backend.

Routes are organized according to application modules and should delegate request processing to controllers.

A typical request flow is:

```text
HTTP Request
     │
     ▼
Route
     │
     ▼
Middleware
     │
     ▼
Validator
     │
     ▼
Controller
     │
     ▼
Service
     │
     ▼
Repository / Model
     │
     ▼
PostgreSQL
```

Routes should:

- Use clear resource-oriented paths
- Apply required authentication middleware
- Apply required authorization middleware
- Apply request validation
- Delegate business logic to services
- Return consistent API responses

---

## 8. Middleware

The main server configuration is handled in:

```text
src/server.ts
```

The backend uses middleware for cross-cutting concerns, including:

- CORS
- Helmet
- Body parsing
- Request logging
- Cookie parsing
- Rate limiting
- Authentication
- Authorization/permission checks
- Request validation
- Static upload serving
- Centralized error handling

CORS is configured to support the required frontend origin and credentials where applicable.

Security-related middleware should be applied before protected routes where required.

---

## 9. Authentication

Authentication is handled through the project's authentication middleware and JWT-based authentication system.

Authenticated requests identify the current user and make the authenticated user's information available to protected backend operations.

Authentication middleware should be applied to endpoints that require a logged-in user.

Authentication-related secrets must be provided through environment variables or an approved secret manager.

JWT secrets must never be committed to the repository or stored in documentation.

---

## 10. Authorization

Authorization determines whether an authenticated user is allowed to perform a specific operation.

The backend uses role- and permission-based access control.

Authorization middleware is responsible for protecting operations according to the user's:

- Role
- Permissions
- Ownership where applicable
- Other business-specific access requirements

Authorization checks should be enforced on the backend even when the frontend hides or disables an operation.

Frontend restrictions must not be considered a security boundary.

---

## 11. Validation

Request validation is implemented using **Joi** and module-level validators.

Validation should be performed before business logic is executed.

Validation covers applicable:

- Request bodies
- Query parameters
- Route parameters
- Input formats
- Required fields
- Allowed values
- Data types
- Field constraints

Example module structure:

```text
src/modules/<feature>/validators/
```

Business validation that depends on database state or application rules belongs in the service layer rather than only in the Joi schema.

---

## 12. Error Handling

The backend uses centralized error handling.

The main error handler is configured in:

```text
src/server.ts
```

Business and application failures use the project's custom error and response utilities.

The backend should:

- Return consistent error responses
- Use appropriate HTTP status codes
- Avoid exposing sensitive implementation details
- Distinguish validation, authentication, authorization, not-found, conflict, and server errors where applicable
- Log unexpected server-side failures appropriately

Errors should be passed through the centralized error-handling mechanism rather than being handled inconsistently in individual routes.

---

## 13. Logging

Request logging is configured at the server level.

Logging should provide enough information to diagnose application and integration failures without exposing sensitive information.

Logs must not contain:

- Passwords
- JWT secrets
- API keys
- Database credentials
- Payment credentials
- Other sensitive secrets

Production logging should follow the deployment environment's approved logging and retention policies.

---

## 14. Database Integration

The backend integrates with PostgreSQL through Sequelize 6.

Database initialization is performed during application startup.

The backend uses:

```text
src/database/
├── models/
├── migrations/
└── seeders/
```

and:

```text
src/database/index.ts
```

for database initialization and model setup.

Associations are maintained in:

```text
src/association/index.ts
```

Database migrations and seed procedures are documented in:

```text
/doc/05-database.md
```

---

## 15. Background Jobs

The backend performs background or startup-triggered operations for platform services where required.

Background processing should be separated from synchronous API request handling when the operation does not need to block the HTTP response.

Examples include:

- Email digest processing
- Subscription-related processing
- Other scheduled platform maintenance tasks

Background jobs must handle failures appropriately and must not expose sensitive information in logs.

---

## 16. Scheduled Tasks

The application initializes scheduled tasks during startup.

Current scheduled functionality includes:

### Email Digest Scheduling

Used to process and send scheduled email digest notifications.

### Badge Subscription Scheduling

Used to handle scheduled badge subscription-related processing.

Scheduled tasks should:

- Be initialized only once
- Handle failures safely
- Avoid duplicate execution where required
- Be monitored in production
- Use environment-specific configuration where applicable

If additional scheduled jobs are introduced, they must be documented here.

---

## 17. External Integrations

The backend integrates with several external services and libraries.

### Email

Email functionality uses:

- SMTP
- Nodemailer

### SMS

SMS functionality uses:

- Twilio

### Cloud Storage

File and media storage can use:

- Cloudinary
- S3-compatible storage

### Payments

Payment functionality includes integrations such as:

- Pesapal
- Mobile money

### HTTP Services

External HTTP APIs are accessed using:

- Axios

### QR Codes

QR code generation is supported for applicable platform functionality.

All external integrations must:

- Keep credentials outside source code
- Use environment variables or an approved secret manager
- Handle API failures
- Validate external responses
- Avoid exposing provider credentials in logs or API responses

---

## 18. File and Storage Handling

File uploads are handled using **Multer**.

Storage adapters are used to support external storage providers such as:

- Cloudinary
- S3-compatible storage

The backend may also expose configured static upload resources where required.

File handling should include appropriate:

- File-type validation
- File-size limits
- Access control
- Storage configuration
- Error handling

Uploaded files containing sensitive user information must not be publicly exposed unless explicitly intended by the application's access rules.

---

## 19. Configuration and Environment Variables

Application configuration is centralized under:

```text
src/config/
```

Environment-specific values must be supplied through environment variables or an approved deployment secret manager.

Important configuration groups include:

- Server URL and port
- Database connection
- JWT secrets
- Frontend origin
- Email/SMTP configuration
- SMS/Twilio configuration
- Cloudinary configuration
- S3/storage configuration
- Payment configuration
- Other cloud-provider settings

Example:

```text
SERVER_URL
PORT
DATABASE_URL
JWT_SECRET
FRONTEND_URL
SMTP_*
TWILIO_*
CLOUDINARY_*
S3_*
PAYMENT_*
```

The exact variable names must be maintained according to the project's configuration implementation.

### Security Rule

Environment files containing secrets must not be committed to Git.

Database credentials, passwords, JWT secrets, API keys, payment credentials, and other secrets must **never** be stored in:

- Documentation
- Source code
- Git history
- Public configuration files

---

## 20. Important Business Logic

Business logic that is not immediately self-explanatory must be documented close to the relevant implementation and, when significant, referenced from the appropriate project documentation.

Important areas include:

### Job Visibility and Eligibility

Job visibility may depend on factors such as:

- User role
- Job status
- Employer ownership
- Funding status
- Student badge/subscription eligibility
- Other configured filters

### Application Processing

Application operations include business rules for:

- Application status
- Employer access
- Student access
- Application updates
- Pagination and filtering

### Referral Processing

Referral operations include verification and availability rules. Only referrals meeting the required verification and availability conditions should be exposed through restricted referral functionality.

### Trust Score

Trust-score functionality combines configured scoring components and maintains score history. Changes to scoring rules should be documented because they affect user evaluation.

### Permissions

Operations that modify protected resources must enforce backend authorization regardless of frontend visibility.

Business rules should be updated in the documentation whenever a significant rule changes.

---

## 21. Backend Security Requirements

All backend development must follow the project's security standards.

The backend must:

- Validate all external input
- Authenticate protected requests
- Authorize protected operations
- Apply rate limiting where appropriate
- Use secure HTTP headers
- Protect secrets
- Avoid sensitive information in logs
- Validate uploaded files
- Use parameterized/ORM-based database operations
- Handle external integration failures safely
- Return controlled error messages

Security-sensitive changes must be reviewed before deployment.

---

## 22. Source of Truth

The following locations are the primary sources for backend implementation details:

```text
src/modules/
src/middleware/
src/config/
src/database/
src/association/
src/interfaces/
src/utils/
src/server.ts
```

This document describes the backend architecture and implementation standards.

When backend functionality changes, the corresponding routes, controllers, services, validators, middleware, integrations, configuration, tests, and documentation must be updated as applicable.