# Project Overview

**File:** `/doc/01-project-overview.md`

## 1. Project Purpose

Ogera is a student-employer platform designed to connect students with employment and work opportunities while providing employers with tools to manage jobs, applications, assigned work, communication, and payments.

The backend provides the secure API and business logic required to support the platform. It handles authentication, authorization, job and application workflows, academic verification, trust-related functionality, disputes, payments, notifications, file access, and other platform operations.

The system is intended to provide a structured environment where students can discover and complete work opportunities while employers can recruit and manage student workers.

---

## 2. Business Objective

The primary business objective of Ogera is to provide a trusted platform for student-employer interactions.

The system aims to:

- Connect students with suitable work opportunities.
- Allow employers to publish and manage jobs.
- Provide a structured application and hiring workflow.
- Allow employers to assign and manage work through tasks.
- Support communication between students and employers.
- Maintain student academic and professional information.
- Support academic verification by authorized administrators.
- Provide trust-related information to help establish confidence between platform participants.
- Support peer reviews, referrals, and other trust-building activities.
- Provide dispute management and resolution workflows.
- Support payment and transaction processing.
- Provide administrators with tools for managing users, permissions, content, verification, disputes, and platform analytics.

---

## 3. Target Users

### 3.1 Students

Students use Ogera to:

- Create and maintain their profiles.
- Discover available jobs.
- Apply for jobs.
- Track application status.
- Complete assigned tasks.
- Communicate with employers.
- Maintain academic and professional records.
- Submit permitted academic evidence for verification.
- Take available assessments.
- Build trust-related records.
- Participate in peer reviews.
- Receive payments for completed work.

### 3.2 Employers

Employers use Ogera to:

- Create and manage jobs.
- Review student applications.
- Accept or reject applications.
- Assign tasks to accepted students.
- Track work and task status.
- Communicate with students.
- Manage relevant payment and transaction information.

### 3.3 Administrators

Administrators manage platform operations according to their assigned permissions.

Depending on their configured role, administrators may manage:

- Users.
- Jobs and applications.
- Academic verification.
- Courses and assessments.
- Trust-related functionality.
- Referrals.
- Disputes.
- Notifications.
- Analytics and reports.
- Platform content.

### 3.4 Super Administrators

Super administrators have elevated platform-management responsibilities and may manage:

- Users and roles.
- Permissions.
- Platform configuration.
- Administrative functionality.
- Jobs and other platform data.
- Verification workflows.
- Disputes.
- Assessments.
- Referrals.
- Analytics.
- Notifications.

The exact permissions available to each administrator are controlled by the application's role and permission system.

### 3.5 Specialized Administrators

The platform can support specialized administrator roles through the configurable role and permission system.

Examples include:

- Verification administrators.
- Course administrators.
- Job administrators.
- Other administrative roles defined according to project requirements.

---

## 4. Main Features

The major features of Ogera include:

### 4.1 Authentication and Authorization

- User registration.
- Email and phone verification.
- User authentication.
- Session refresh.
- Password reset.
- Optional two-factor authentication.
- Role-based and permission-based access control.

### 4.2 User Profiles

- Student profiles.
- Employer profiles.
- Academic records.
- Skills and professional information.
- Projects and accomplishments.
- Employment-related information.
- Trust-related records.

### 4.3 Job Management

- Job creation and management.
- Job categories.
- Job questions.
- Job status management.
- Job discovery and filtering.
- Job reactions.
- Employer job management.

### 4.4 Job Applications

- Student job applications.
- Application status management.
- Employer application review.
- Application acceptance and rejection.
- Application-related questions and answers.

### 4.5 Task Management

- Assignment of work to accepted students.
- Task status management.
- Tracking assigned work.
- Task-related communication and records.

### 4.6 Academic Verification

- Submission of academic evidence.
- Storage and controlled access to uploaded documents.
- Authorized staff review.
- Verification status management.
- Approval, rejection, or resubmission workflows.

Academic verification is performed by authorized administrators. Uploaded academic evidence is reviewed as part of the platform's verification process.

### 4.7 Trust and Peer Review

- Trust-score-related records.
- Student trust information.
- Referrals.
- Badges.
- Peer reviews.
- Reactions and feedback.

### 4.8 Communication and Notifications

- Notifications.
- User messaging.
- Conversations.
- Interview-related communication.
- Realtime communication using Socket.IO where supported.
- Dispute-related communication.

### 4.9 Dispute Management

- Dispute creation.
- Evidence submission.
- Dispute messages.
- Dispute timelines.
- Moderator review.
- Authorized dispute resolution.

### 4.10 Payments and Transactions

- Payment-related job and application information.
- Transaction records.
- External payment provider integrations.
- Mobile-money payment support.
- Pesapal integration.
- Payment callback handling.

### 4.11 Assessments and Learning

- Courses.
- Course steps.
- Course progress.
- Cognitive tests.
- Cognitive test questions.
- Problem metrics and questions.
- User assessment records.

### 4.12 Administration and Analytics

- User administration.
- Role and permission management.
- Platform data management.
- Verification management.
- Dispute administration.
- Referrals and assessment administration.
- Dashboard analytics and reporting.

---

## 5. Major Workflows

### 5.1 Registration and Authentication

1. A user registers as a student or employer.
2. Required contact information is verified.
3. The user authenticates with the platform.
4. The backend creates and manages the authenticated session.
5. Access and refresh authentication mechanisms are used according to the configured authentication flow.
6. Authorization rules determine which resources the user can access.

### 5.2 Profile and Trust Workflow

1. A student or employer completes their profile.
2. Supporting information and permitted documents may be uploaded.
3. Relevant academic, professional, assessment, referral, or peer-review information is recorded.
4. Trust-related data is calculated or maintained according to the platform's trust functionality.

### 5.3 Job and Application Workflow

1. An employer creates a job.
2. The job becomes available according to its configured status and access rules.
3. Students discover and review available jobs.
4. A student submits an application.
5. The employer reviews submitted applications.
6. The employer accepts or rejects an application.
7. Accepted work can proceed to task assignment and related workflows.

### 5.4 Work and Task Workflow

1. An employer assigns work to an accepted student.
2. The assigned task receives a status.
3. The student completes or updates the assigned work.
4. Relevant task, communication, and payment records are maintained.
5. Work completion can lead to the corresponding payment workflow.

### 5.5 Academic Verification Workflow

1. A student submits permitted academic evidence.
2. The evidence is stored using the configured file-storage mechanism.
3. Authorized staff review the submitted evidence.
4. The reviewer records the appropriate verification result.
5. If additional information is required, the evidence can be rejected or returned for resubmission according to the configured workflow.

### 5.6 Dispute Resolution Workflow

1. A platform participant creates a dispute.
2. Relevant evidence is submitted.
3. Parties can exchange messages and supporting information.
4. An authorized moderator reviews the dispute.
5. The moderator records the resolution.
6. The dispute timeline and related records are retained.

### 5.7 Payment Workflow

1. A payment-related event is initiated by the applicable platform workflow.
2. The backend communicates with the configured payment provider.
3. Provider responses or callbacks are processed.
4. Transaction information is recorded.
5. Payment status is updated according to the result.

---

## 6. System Boundaries

The Ogera backend is responsible for:

- HTTP API endpoints.
- Authentication.
- Authorization and permission enforcement.
- Business logic.
- Feature modules.
- Database access.
- Database migrations and seeders.
- File-upload handling and access control.
- Scheduled backend jobs.
- Notifications.
- Realtime Socket.IO events.
- Integration with external services.
- API-level validation and error handling.

The React frontend is a separate client application that consumes the backend APIs.

The backend does not own the implementation of the React user interface.

PostgreSQL and external service providers are dependencies of the backend rather than components owned entirely by the application.

---

## 7. External Services

Ogera integrates with or depends on external services for specific platform capabilities.

These include:

| Service | Purpose |
|---|---|
| PostgreSQL | Primary relational database |
| SMTP / Nodemailer | Email delivery |
| Twilio | SMS communication |
| Cloudinary | Cloud-based file/media storage |
| S3-compatible storage | Object/document storage |
| Pesapal | Payment processing |
| Mobile-money providers | Payment processing |
| Axios | HTTP communication with external services |
| Socket.IO | Realtime communication |

External service credentials and secrets must be provided through environment configuration and must not be committed to source control or documentation.

---

## 8. Project Ownership

Ogera is part of the Sybella project ecosystem.

Project ownership, deployment ownership, production infrastructure ownership, and operational contacts should be maintained by the responsible Sybella project/deployment owners.

The canonical production owner and escalation contacts should be confirmed with the project owner before being added to this document.

Technical ownership is divided according to the project's frontend, backend, database, infrastructure, and operational responsibilities.

---

## 9. Environment Information

### 9.1 Local Development

The backend supports local development using:

- Node.js.
- TypeScript.
- Express.
- PostgreSQL.
- Sequelize.

The local backend development server uses port:

```text
5000
```

The frontend is a separate React application and communicates with the backend through its configured API URL.

### 9.2 Environment Configuration

Environment-specific values are configured through environment variables.

Configuration may include:

- Server URL and port.
- Database connection information.
- JWT configuration.
- Frontend origin.
- Email configuration.
- SMS configuration.
- Storage configuration.
- Payment provider configuration.
- Cloud-service credentials.

Secrets must never be hard-coded into application source code or committed to the repository.

### 9.3 Development, Staging, and Production

Development, staging, and production environments may use different infrastructure and configuration.

Canonical hosting details, production domains, deployment infrastructure, and environment ownership require confirmation from the deployment owner and should be maintained as deployment documentation once confirmed.

---

## 10. Current Development Status

Ogera is currently under active development.

The backend already contains major platform functionality covering:

- Authentication and authorization.
- User and profile management.
- Jobs and job applications.
- Tasks.
- Academic records and verification workflows.
- Trust-related functionality.
- Referrals and peer reviews.
- Notifications and communication.
- Disputes and evidence.
- Assessments and courses.
- Payment and transaction integrations.
- Administrative functionality.
- Analytics and reporting.

The frontend and backend continue to evolve as new platform functionality and improvements are implemented.

Because the project is actively developed, this document should be updated when there are significant changes to the project's purpose, business workflows, system boundaries, external dependencies, environments, ownership, or development status.

---

## 11. Project Documentation Context

This document provides the high-level project context and should be read before reviewing technical implementation documentation.

Related documentation includes:

```text
/doc/01-project-overview.md
/doc/02-requirements.md
/doc/03-architecture.md
/doc/04-api.md
/doc/05-database.md
/doc/06-frontend.md
/doc/07-backend.md
/doc/08-testing.md
/doc/09-security.md
/doc/10-deployment.md
/doc/11-maintenance.md
/doc/12-changelog.md
```

The project overview explains **what Ogera does, who uses it, why it exists, and where its system boundary lies**. Detailed implementation and operational information should be maintained in the corresponding documentation files.