# Requirements

## Functional requirements

- REQ-001: Users can register as students or employers and verify account contact details.
- REQ-002: Authenticated users can sign in, refresh sessions, sign out, reset passwords, and optionally complete 2FA.
- REQ-003: The API enforces role and route permissions for protected operations.
- REQ-004: Students and employers can manage profiles and relevant supporting records.
- REQ-005: Employers can create, update, review, activate, and complete jobs.
- REQ-006: Students can submit job applications and employers can accept or reject them.
- REQ-007: Employers can assign and update tasks for accepted students.
- REQ-008: The platform supports notifications, messaging, interviews, and realtime dispute messages.
- REQ-009: Authorized staff can review academic verification records and administer courses and assessments.
- REQ-010: The platform supports trust-score inputs, job referrals, badges, reactions, and peer reviews.
- REQ-011: Parties can create disputes with evidence and authorized moderators can resolve them.
- REQ-012: Payment integrations can create and track transactions and mobile-money/Pesapal flows.

## Non-functional requirements

- NFR-001 Security: validate input, hash passwords, use signed tokens/cookies, apply Helmet, CORS, rate limiting, and permission checks.
- NFR-002 Reliability: use migrations, structured logging, centralized error handling, and graceful external-service failures.
- NFR-003 Maintainability: preserve module boundaries, typed interfaces, repository/service/controller layering, and automated tests.
- NFR-004 Compatibility: support current Node.js LTS-compatible tooling, PostgreSQL, and the React frontend API contract.
- NFR-005 Scalability: use database pooling, pagination, indexed relationships, and external object storage where configured.
- NFR-006 Availability: health, database, provider, and deployment monitoring procedures must be defined by operations.

## Permission model

Permissions are represented by roles with `roleType`, `roleName`, and route-level view/create/edit/delete flags. Super administrators manage roles and permissions. Exact production role assignments are data-driven and must be verified in the deployed database.
