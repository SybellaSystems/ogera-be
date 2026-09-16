# Ogera Architecture

This document describes the architecture of the backend application in `ogera-be` and its dependencies on the separate React frontend, PostgreSQL database, storage, payment, communication, and hosting systems.

## 1. System architecture

```text
                         Browser user
                              |
                              v
                 Ogera React frontend application
                 Vite dev server / nginx / Vercel
                              |
                 HTTPS JSON, multipart, cookies
                              |
                              v
              +----------------------------------+
              | Ogera Node.js + Express backend  |
              |                                  |
              | /api      REST route modules     |
              | /api-docs Swagger UI             |
              | /uploads  static local files     |
              | Socket.IO realtime events        |
              +----------------+-----------------+
                               |
          +--------------------+----------------------+
          |                    |                      |
          v                    v                      v
   PostgreSQL via       Local/S3/Cloudinary       External services
     Sequelize                storage       SMTP, Twilio, Pesapal,
                                             MTN MoMo, FX provider
```

The backend is the system boundary for authentication, authorization, business rules, persistence, file access, payment orchestration, notifications, scheduled work, and realtime events. The frontend owns browser navigation, presentation, client state, and API consumption but is not trusted for authorization.

## 2. Application components

### Backend runtime components

-   `src/server.ts`: creates the HTTP server, configures middleware, mounts Swagger/static/API routes, connects to the database, initializes Socket.IO, and starts schedulers.
-   `src/routes/routes.ts`: mounts feature routers below `/api`.
-   `src/modules`: feature boundaries for authentication, roles, permissions, sessions, jobs, applications, profiles, academic verification/records, notifications, dashboards, disputes, messaging, interviews, tasks, courses, cognitive tests, problem metrics, trust score, badges, payments, referrals, reactions, community workspace, users, and contact.
-   `src/middlewares`: JWT authentication, role/permission checks, rate limiting, Helmet security headers, request logging, and related cross-cutting controls.
-   `src/database`: Sequelize connection, model initialization, associations, migrations, and seeders.
-   `src/interfaces` and `src/types`: request/domain contracts used across modules.
-   `src/schedulers`: email digest and badge subscription background scheduling.
-   `src/utils` and `src/services`: storage, mail, SMS, payment, Socket.IO, logging, validation, error, and shared integration services.

### Typical module structure

```text
HTTP request
    |
    v
module.routes.ts -> middleware -> module.controller.ts
                                      |
                                      v
                              module.service.ts
                                      |
                                      v
                                module.repo.ts
                                      |
                                      v
                              Sequelize model
```

Not every legacy module contains every layer, but new business logic should preserve this separation.

## 3. Frontend architecture

The frontend is a separate application in `ogera-frontend`:

```text
src/main.tsx
  +-- i18next provider
  +-- Material UI/theme providers
  +-- Redux Provider
  +-- application theme context
  +-- App.tsx
        +-- React Router route tree
        +-- ProtectedRoute / FeatureGate
        +-- AdminLayout, StudentLayout, EmployerLayout
        +-- feature pages and reusable components
        +-- RTK Query and Axios API services
```

The frontend uses React, TypeScript, React Router, Redux Toolkit/RTK Query, Axios, Formik/Yup, Material UI, Tailwind CSS, and Socket.IO client. Its API services call the backend `/api` routes, maintain cached server data, attach authentication, and handle refresh behavior. In local development, Vite proxies `/api` to `http://localhost:5000`; in deployed environments `VITE_API_URL` identifies the backend.

## 4. Backend architecture

`server.ts` establishes this middleware and dependency order:

```text
Incoming request
    |
    +--> trust proxy configuration
    +--> CORS and OPTIONS handling
    +--> Helmet security headers
    +--> JSON / URL-encoded body parsers
    +--> request logging
    +--> cookie parser
    +--> /api-docs Swagger handler
    +--> /api rate limiter
    +--> /uploads static handler
    +--> /api route registry
    +--> centralized error handler
    +--> 404 fallback
```

The route registry maps feature prefixes such as `/auth`, `/jobs`, `/profile`, `/disputes`, `/messages`, `/courses`, `/payments`, `/momo`, `/trust-score`, `/job-referrals`, and `/community-workspace` to module routers. Some routers are mounted at `/` because their route declarations already contain their resource prefix, such as applications, tasks, and job reactions.

## 5. Database architecture

PostgreSQL is accessed only by the backend through Sequelize. `src/database/index.ts` creates the Sequelize connection, initializes models, applies associations, and performs connection/compatibility checks.

```text
Express controllers/services
            |
            v
       Repositories
            |
            v
       Sequelize models
            |
            v
        PostgreSQL
```

The main entity groups are:

-   Identity/access: users, roles, permissions, sessions, activity logs.
-   Marketplace: jobs, categories, questions, applications, answers, interviews, tasks, reactions, referrals.
-   Profiles/trust: extended profiles, skills, employment, education, projects, accomplishments, academic records, trust history, feedback, badges.
-   Learning/assessment: courses, course steps/progress, cognitive tests/questions, problem metrics/questions, user tests.
-   Communication/resolution: notifications, conversations, messages, disputes, evidence, dispute messages/timeline, student links, peer reviews/replies.
-   Finance: transactions, badge purchases, job funding and payout fields.

Schema changes are applied through Sequelize migrations configured by `.sequelizerc`. Seed data is managed through Sequelize seeders. Database credentials never belong in this document.

## 6. External integrations and dependencies

| Dependency            | Responsibility                                                | Backend boundary                                         |
| --------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| React frontend        | Browser UI, client state, API calls, route presentation       | HTTPS REST, cookies, multipart uploads, Socket.IO client |
| PostgreSQL            | Durable relational data and transactions                      | Sequelize models/repositories                            |
| Local filesystem      | Development or configured local uploads                       | `uploads/` and storage service                           |
| AWS S3 / Cloudinary   | Optional object/image storage                                 | storage configuration and signed/file URLs               |
| SMTP/Brevo/Nodemailer | Verification, reset, digest, notification, and task emails    | mail services                                            |
| Twilio or console SMS | Phone OTP delivery                                            | SMS initialization/service                               |
| Pesapal               | Payment order, status, and IPN callbacks                      | `/api/payments/*`                                        |
| MTN MoMo              | Collections, invoices, job funding, and student disbursements | `/api/momo/*` and badge services                         |
| FX provider           | Currency conversion for financial records                     | FX utility used by payment services                      |
| Socket.IO             | Notifications, messaging, and dispute realtime events         | HTTP server and socket utility                           |
| Swagger/OpenAPI       | Interactive API contract                                      | `/api-docs`                                              |

An external provider failure must not expose provider secrets or cause sensitive credentials to be returned in API responses. Provider-specific configuration is loaded from environment variables.

## 7. Primary data flow

### Standard API flow

```text
User action in frontend
        |
        v
RTK Query / Axios request
        |
        v
CORS -> security -> parsing -> logging -> rate limit
        |
        v
JWT/permission middleware
        |
        v
Controller validates request shape
        |
        v
Service applies business and ownership rules
        |
        +--> Repository / Sequelize --> PostgreSQL
        +--> Storage service ----------> Local/S3/Cloudinary
        +--> Provider service ----------> Email/SMS/Payments
        +--> Socket utility ------------> Connected clients
        |
        v
ResponseFormat / module response
        |
        v
Frontend cache, UI state, or error state
```

### File flow

```text
multipart upload
      |
      v
Multer memory buffer -> MIME/size checks -> storage.service
                                      |
                         +------------+------------+
                         v                         v
                    local path                 S3/Cloudinary key
                         |                         |
                         +------ path stored in database
```

Protected files such as resumes, academic documents, certificates, and dispute evidence should be read through authenticated controller endpoints. Direct `/uploads` static access is intended for configured public/static content, not sensitive records.

## 8. Authentication flow

```text
Register
  -> password bcrypt hash and email verification token
  -> verification email / phone OTP

Login
  -> credentials and optional captcha checked
  -> access JWT + refresh token cookie
  -> if 2FA enabled: temporary 2FA challenge
  -> /auth/2fa/verify-login
  -> access JWT + refresh token cookie

API request
  -> Authorization: Bearer <access-token>
  -> authMiddleware verifies JWT and attaches req.user

Access token expires
  -> frontend calls /auth/refresh with refresh cookie
  -> backend verifies refresh token and rotates access credentials

Logout or session revoke
  -> backend invalidates/clears cookies and session records
```

Refresh/session cookies require secure attributes and correct proxy/HTTPS configuration in non-local environments. Sensitive credential fields are excluded from user responses.

## 9. Authorization flow

```text
JWT verified
    |
    v
req.user = { user_id, role, ... }
    |
    +--> role middleware: student/employer/admin/superadmin
    |
    +--> PermissionChecker('/resource', 'action')
    |       reads role permission_json
    |
    +--> Service ownership/business checks
            e.g. employer owns job, student owns profile/document,
            participant belongs to conversation/dispute
```

Authorization is layered. A role check may allow entry to a route, a permission check may require a route action, and the service must still verify the target resource and business state. Admin and superadmin bypass behavior is implemented in role middleware and individual services; custom roles are data-driven through `roles.permission_json`.

## 10. Deployment architecture

```text
Developer / CI
     |
     +--> npm install / npm run build / npm test
     |
     v
Backend artifact or Docker image
     |
     v
Reverse proxy / managed host
     |
     +--> Node.js process: dist/server.js
     +--> HTTPS domain and secure cookies
     +--> PostgreSQL connection
     +--> private storage and provider credentials

Separate frontend deployment
     |
     +--> Vercel SPA rewrite or nginx container
     +--> VITE_API_URL -> backend HTTPS base URL
```

The backend Dockerfile builds TypeScript in a Node 20 builder stage, installs production dependencies in a Node 20 runtime stage, copies `dist`, exposes port 8000, and starts `node dist/server.js`. Local development normally uses port 5000 from application configuration; the deployed process port is supplied by `PORT`/hosting configuration and should be reconciled with the container contract.

Deployment should run migrations before application code that depends on new schema, then smoke-test database connectivity, authentication, Swagger, uploads, payment callbacks, Socket.IO, and frontend CORS connectivity.

## 11. Environment architecture

### Local development

-   Backend: Node.js/TypeScript process, usually `http://localhost:5000`.
-   Frontend: Vite development server, usually `http://localhost:5173`.
-   Database: local PostgreSQL or an explicitly configured development database.
-   Storage: local `uploads/` by default when `USE_LOCAL_STORAGE=true`.
-   Providers: console SMS and sandbox payment providers are suitable for development.

### Development or staging

-   Separate API process/container, frontend deployment, PostgreSQL database, storage bucket, and provider credentials.
-   CORS allows the configured frontend origin and selected non-production Vercel previews.
-   Payment integrations should use sandbox credentials and callback URLs.
-   Logs and database access should be isolated from production.

### Production

-   HTTPS frontend and backend behind a trusted reverse proxy.
-   `trust proxy` enabled so secure cookies and protocol detection work correctly.
-   Separate production PostgreSQL, private storage, SMTP/SMS, and payment credentials.
-   CORS restricted to approved frontend domains; no development preview wildcard.
-   Database TLS enabled for non-local database hosts when configured.
-   Monitoring and backups owned by the deployment/operations team.

### Configuration groups

`src/config/index.ts` loads environment values for server URLs/ports, PostgreSQL, JWT secrets, storage, email, schedulers, Pesapal, MTN MoMo, MoMo disbursement, SMS/Twilio, and frontend links. Exact secret values must remain in the environment or secret manager and must never be copied into architecture documentation.

## 12. Dependency summary

The dependency direction is intentionally one-way for business data:

```text
Frontend -> HTTP/Socket.IO backend -> services -> repositories -> PostgreSQL
                                      |             |
                                      v             v
                                external APIs    file storage
```

The frontend must not connect directly to PostgreSQL or trusted provider APIs. Controllers should not contain database queries when a service/repository boundary exists. Database migrations must not substitute for runtime business logic, and external callbacks must remain isolated from authenticated browser flows.

## 13. Architecture ownership and known gaps

The backend owns API and data contracts; the frontend owns presentation and client interaction; operations owns hosting, domains, TLS, backups, monitoring, and provider credentials. The repository does not currently define one canonical production hosting topology or complete OpenAPI schemas for every route. Those details must be finalized and kept synchronized with this document before production approval.
