# Database Documentation

## 1. Database Technology

The project uses **PostgreSQL** as the relational database and **Sequelize 6** as the ORM.

Database initialization and model loading are handled through:

```text
src/database/index.ts
```

Sequelize CLI configuration is defined in:

```text
.sequelizerc
```

Database-related files are organized under:

```text
src/database/
├── models/
├── migrations/
└── seeders/
```

Model relationships and associations are centralized in:

```text
src/association/index.ts
```

Database credentials and connection settings must be provided through environment variables and must not be stored in source code or documentation.

---

## 2. Database Structure

The database follows a relational structure using PostgreSQL.

The main entities are grouped into the following functional areas:

### Identity and Access

- Users
- Roles
- Permissions
- Sessions
- Activity Logs

### Marketplace

- Jobs
- Categories
- Questions
- Applications
- Answers
- Reactions
- Referrals
- Interviews
- Tasks

### Profiles and Trust

- Extended Profiles
- Skills
- Employment
- Education
- Projects
- Accomplishments
- Academic Records
- Trust Score History
- Feedback
- Badges

### Learning and Assessment

- Courses
- Course Steps
- Course Progress
- Cognitive Tests
- Cognitive Test Questions
- Problem Metrics
- Problem Metric Questions
- User Tests

### Communication and Resolution

- Notifications
- Conversations
- Messages
- Disputes
- Evidence
- Timeline
- Student Links
- Peer Reviews
- Replies

### Finance

- Transactions
- Badge Purchases
- Payment-related Job Fields
- Payment-related Application Fields

The complete entity definitions are maintained in:

```text
src/database/models/
```

---

## 3. Tables and Entities

Each database entity is represented by a Sequelize model.

The major entities include:

| Entity | Purpose |
|---|---|
| Users | Stores user accounts and identity information |
| Roles | Defines system roles |
| Permissions | Defines access permissions |
| Jobs | Stores job and opportunity information |
| Categories | Organizes jobs and other categorized content |
| Applications | Stores applications submitted for jobs |
| Questions | Stores job-related questions |
| Answers | Stores answers associated with questions |
| Reactions | Stores user reactions such as likes/dislikes |
| Referrals | Stores job referral information |
| Interviews | Stores interview-related information |
| Tasks | Stores assigned tasks |
| Profiles | Stores extended user profile information |
| Skills | Stores user skills |
| Employment | Stores employment history |
| Education | Stores educational information |
| Projects | Stores user projects |
| Accomplishments | Stores user accomplishments |
| Academic Records | Stores academic verification records |
| Trust Score History | Stores historical trust-score information |
| Feedback | Stores feedback information |
| Badges | Stores user badges |
| Courses | Stores learning courses |
| Course Steps | Stores individual course steps |
| Course Progress | Tracks user course progress |
| Cognitive Tests | Stores cognitive assessments |
| Cognitive Test Questions | Stores cognitive test questions |
| Problem Metrics | Stores problem-solving assessments |
| Problem Metric Questions | Stores problem metric questions |
| User Tests | Stores user assessment attempts/results |
| Notifications | Stores user notifications |
| Conversations | Stores conversations |
| Messages | Stores conversation messages |
| Disputes | Stores dispute records |
| Evidence | Stores dispute-related evidence |
| Timeline | Stores activity/timeline events |
| Student Links | Stores submitted student links |
| Peer Reviews | Stores peer-review records |
| Replies | Stores peer-review replies |
| Transactions | Stores financial transactions |
| Badge Purchases | Stores badge purchase information |

The authoritative table and column definitions are the Sequelize models and database migrations under `src/database`.

---

## 4. Columns and Data Types

Columns are defined in the corresponding Sequelize model files under:

```text
src/database/models/
```

Each model should explicitly define:

- Column name
- Sequelize data type
- Allow-null behavior
- Default value
- Primary-key status
- Foreign-key references
- Validation rules
- Unique constraints where applicable

Common PostgreSQL/Sequelize data types used by the project include:

- `UUID`
- `INTEGER`
- `BIGINT`
- `STRING`
- `TEXT`
- `BOOLEAN`
- `DATE`
- `DECIMAL`
- `JSON`
- `JSONB`

The model definitions and migrations are the source of truth for the exact columns and data types.

---

## 5. Primary Keys

Every database entity must have a clearly defined primary key.

Primary keys uniquely identify records within their respective tables.

Where UUIDs are used, they should be generated and managed consistently according to the model and migration definitions.

Primary-key definitions must be maintained in both:

```text
src/database/models/
```

and the corresponding migrations under:

```text
src/database/migrations/
```

---

## 6. Foreign Keys

Foreign keys establish relationships between related entities.

Examples include:

```text
Users
  └──< Applications >── Jobs
```

and:

```text
Users
  └──< Notifications
```

Other marketplace, profile, learning, communication, and finance entities use foreign keys to connect records to their parent entities.

Foreign-key definitions should specify appropriate:

- Referenced table
- Referenced column
- Delete behavior
- Update behavior

Foreign-key relationships must be maintained consistently between Sequelize associations and database migrations.

---

## 7. Relationships

Database relationships are centralized in:

```text
src/association/index.ts
```

Relationships may include:

- One-to-one
- One-to-many
- Many-to-many

Examples:

```text
Users
 ├──< Applications >── Jobs
 ├──< Notifications
 ├──< Messages
 ├──< Peer Reviews
 ├──< Transactions
 └──< Trust Score History
```

```text
Jobs
 ├──< Applications
 ├──< Questions
 ├──< Reactions
 └──< Referrals
```

The association file and model definitions must remain synchronized with the database foreign-key constraints.

---

## 8. Indexes

Indexes should be created for columns that are frequently used for:

- Filtering
- Searching
- Sorting
- Joining
- Uniqueness enforcement

Examples may include indexes on:

- Foreign-key columns
- Status columns
- User identifiers
- Employer identifiers
- Job identifiers
- Category identifiers
- Frequently queried date columns
- Other high-frequency query fields

Indexes must be defined through database migrations rather than being created manually in production.

Before adding an index, its performance benefit and maintenance cost should be considered.

---

## 9. Constraints

The database must use appropriate constraints to maintain data integrity.

Supported constraints may include:

- Primary-key constraints
- Foreign-key constraints
- Unique constraints
- Not-null constraints
- Default values
- Check constraints where appropriate

Business validation should be handled at the application layer where necessary, while database constraints should protect critical data integrity at the database level.

---

## 10. Important Queries

Important and performance-sensitive database queries should be documented when they are complex, frequently used, or business-critical.

Examples include:

### Job Search

Jobs can be filtered using criteria such as:

- Status
- Employer
- Category
- Currency
- Funding status
- Budget range
- Search text
- Location

### Job Applications

Applications can be queried by:

- Job
- Student/user
- Application status
- Employer
- Pagination parameters

### Job Referrals

Referral data can be filtered by verification and availability status.

### Trust Score

Trust-score-related queries calculate or retrieve information from:

- Academic information
- Experience
- Cognitive/problem-solving metrics
- Peer interaction/feedback
- Trust-score history

Complex queries should be reviewed for appropriate indexes and database performance.

---

## 11. Migration Strategy

Database schema changes must be implemented through Sequelize migrations.

Migration files are maintained under:

```text
src/database/migrations/
```

Run existing migrations with:

```bash
npm run migration
```

Generate a new migration with:

```bash
npm run migration:generate --name "description"
```

### Migration Rules

Migrations must:

- Be append-only
- Have a clear and descriptive name
- Contain both `up` and `down` operations where applicable
- Be reviewed before deployment
- Avoid destructive changes unless explicitly approved
- Preserve existing production data where required
- Be tested against a representative database before production deployment

Database schema changes must not be performed manually in production unless the change is part of an approved operational procedure.

---

## 12. Seed Data

Seed data is managed through Sequelize seeders.

Seed files are maintained under:

```text
src/database/seeders/
```

Apply seed data with:

```bash
npm run seed
```

Remove seed data with:

```bash
npm run seed:undo
```

Seed data should be used for:

- Required baseline data
- Development data
- Test data
- Default roles and permissions
- Other approved static configuration data

Production seeders must be reviewed carefully to ensure that they do not overwrite or unintentionally modify existing production data.

---

## 13. ER Diagram

An Entity Relationship (ER) diagram should be maintained because the project contains multiple related database entities.

At minimum, the diagram should represent the major relationships between identity, marketplace, profile, learning, communication, and finance entities.

Example:

```text
                  ┌──────────────┐
                  │    Users     │
                  └──────┬───────┘
                         │
          ┌──────────────┼───────────────┐
          │              │               │
          ▼              ▼               ▼
   ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
   │ Applications│ │ Notifications│ │ Transactions │
   └──────┬──────┘ └──────────────┘ └──────────────┘
          │
          ▼
     ┌─────────┐
     │  Jobs   │
     └────┬────┘
          │
    ┌─────┴─────┐
    ▼           ▼
Questions    Referrals
```

The maintained ER diagram should be updated whenever significant entities or relationships are added, removed, or changed.

Recommended location:

```text
/doc/diagrams/
```

---

## 14. Backup and Restoration

Database backup and restoration are operational responsibilities and are not automated by this repository.

The production PostgreSQL database should use the managed database provider's approved:

- Encrypted backups
- Point-in-time recovery (PITR)
- Backup retention policies
- Disaster-recovery procedures

For approved manual operations, PostgreSQL tools such as:

```bash
pg_dump
pg_restore
```

may be used.

### Restoration Process

A restoration should follow the approved operational procedure:

1. Confirm the backup or recovery point.
2. Verify the target database/environment.
3. Restore the database using the approved method.
4. Run required migrations if applicable.
5. Verify database connectivity.
6. Verify critical tables and relationships.
7. Run application/database health checks.
8. Confirm application functionality.

Backups should be periodically tested to ensure they can actually be restored.

---

## 15. Database Security

Database credentials, passwords, API keys, connection strings containing secrets, and other sensitive information must **never** be stored in this document.

Secrets must be provided through approved environment-variable or secret-management mechanisms.

Access to production databases must follow the project's access-control and security policies.

Production database credentials must not be committed to Git.

---

## 16. Source of Truth

The following locations are the authoritative sources for database implementation details:

```text
src/database/models/
src/database/migrations/
src/database/seeders/
src/database/index.ts
src/association/index.ts
.sequelizerc
```

This document describes the database architecture and standards. When a schema changes, the corresponding model, migration, associations, indexes, constraints, and ER diagram must be updated as required.