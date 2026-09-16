# Maintenance Documentation

**File:** `/doc/11-maintenance.md`

This document defines the maintenance, monitoring, troubleshooting, backup, recovery, and operational procedures for the Ogera system after deployment.

Ogera is actively developed, so maintenance procedures must be updated when infrastructure, dependencies, scheduled jobs, database structure, integrations, or deployment processes change.

---

## 1. Routine Maintenance Tasks

Routine maintenance should include:

- Review application and rotated logs.
- Review database connection-pool and slow-query metrics.
- Check failed scheduled jobs.
- Monitor storage usage and growth.
- Review external provider errors.
- Review authentication and authorization failures.
- Review upload and file-storage failures.
- Check application health and availability.
- Review dependency security advisories.
- Confirm database backups are completing successfully.
- Perform database restoration drills according to the operational schedule.
- Verify that migrations are applied successfully after releases.
- Remove or archive operational data according to approved retention policies.

Database migrations must only be executed through the approved release/deployment process.

---

## 2. Dependency Updates

Backend dependencies should be reviewed regularly for:

- Security vulnerabilities.
- Available stable updates.
- Breaking changes.
- Deprecated packages.
- Compatibility with the current Node.js and TypeScript versions.

The dependency update process should be:

1. Review available dependency updates.
2. Check security advisories and release notes.
3. Update dependencies in a controlled development branch.
4. Run the test suite.
5. Run linting and TypeScript/build checks.
6. Verify affected API and integration workflows.
7. Review lockfile changes.
8. Deploy through the normal release process.

Commands currently used for validation include:

```bash
npm test
npm run lint
npm run build
```

Major dependency upgrades must be reviewed before being deployed to production.

---

## 3. Database Maintenance

Ogera uses PostgreSQL with Sequelize.

Routine database maintenance includes:

- Monitor database availability.
- Monitor connection-pool usage.
- Review slow queries.
- Monitor database storage growth.
- Review indexes and frequently queried relationships.
- Monitor failed database connections.
- Verify migration status.
- Review database performance after significant feature releases.

Database schema changes must be implemented through Sequelize migrations.

Example migration commands:

```bash
npm run migration
npm run migration:generate --name "description"
```

Migrations should be reviewed before deployment and should not be manually modified after they have been applied to a shared or production environment.

---

## 4. Backup Procedures

Production PostgreSQL data must be backed up using the approved database backup mechanism.

The supported operational approaches include:

- Managed PostgreSQL encrypted backups with point-in-time recovery where available.
- `pg_dump` for approved logical backups.
- `pg_restore` for approved restoration procedures.

Backup maintenance must include:

1. Confirm scheduled backups are completing successfully.
2. Monitor backup failures.
3. Verify backup retention.
4. Protect backups from unauthorized access.
5. Perform restoration tests periodically.
6. Document restoration results.
7. Investigate and correct failed restoration tests.

Backups must be stored separately from the primary application environment where possible.

Database credentials must never be stored in backup documentation or committed to source control.

---

## 5. Log Management

Application and infrastructure logs should be reviewed regularly.

Logs should be used to identify:

- API errors.
- Authentication failures.
- Authorization failures.
- Database errors.
- External provider failures.
- Upload failures.
- Scheduled-job failures.
- Payment callback failures.
- Unexpected application crashes.

Logs should be rotated or retained according to the configured infrastructure policy.

Logs must not contain sensitive information such as:

- Passwords.
- JWTs or refresh tokens.
- OTPs.
- Payment secrets.
- Database credentials.
- Private document contents.
- Other sensitive user information.

---

## 6. Monitoring

The Ogera environment should monitor:

- Application availability.
- API error rates.
- Server/container health.
- Database availability.
- Database connection-pool usage.
- Slow queries.
- Scheduled-job failures.
- Storage usage.
- External provider failures.
- Authentication and authorization failures.
- Upload failures.
- Payment processing failures.

Monitoring thresholds and alert destinations should be maintained by the responsible operations team.

---

## 7. Health Checks

When the API is unavailable or behaving unexpectedly, verify the following in order:

1. Application process or container status.
2. Server and reverse-proxy status.
3. Configured application port.
4. Application logs.
5. Database connectivity.
6. Required environment variables.
7. External service availability.
8. CORS origin configuration.
9. Recent deployment or migration changes.

The application should be considered healthy only when the application process, required database connection, and critical external dependencies are functioning as expected.

---

## 8. Scheduled Jobs

Ogera contains scheduled processes that start with the backend server.

Known scheduled functionality includes:

- Email digest scheduling.
- Badge subscription scheduling.

When the application runs multiple replicas, scheduled jobs must not execute multiple times unintentionally.

If a scheduler does not use a distributed locking mechanism, operations must ensure that only the intended application instance runs the scheduler.

### Scheduled Job Failure

When a scheduled job fails:

1. Review the application logs.
2. Identify whether the failure is caused by the database, application logic, or an external provider.
3. Correct the underlying issue.
4. Verify that the job can run successfully.
5. Rerun the job using the approved script or replay mechanism where one exists.
6. Confirm that duplicate processing has not occurred.

---

## 9. Certificate Renewal

TLS/SSL certificates must be monitored and renewed before expiration.

Certificate renewal responsibilities include:

- Monitor certificate expiration dates.
- Renew certificates according to the hosting/infrastructure provider's process.
- Verify the certificate after renewal.
- Confirm HTTPS connectivity.
- Confirm API and frontend communication after renewal.

The exact certificate provider, renewal mechanism, and responsible owner must be maintained by the deployment/operations team.

---

## 10. Storage Management

Ogera may store sensitive files such as:

- Resumes.
- Academic evidence.
- Profile images.
- Dispute evidence.
- Other permitted user uploads.

Storage maintenance should include:

- Monitor storage usage.
- Monitor storage growth.
- Review failed uploads.
- Verify object-storage connectivity.
- Review access permissions.
- Review signed URL behavior.
- Remove or archive files according to approved retention rules.
- Ensure sensitive files are not unintentionally exposed publicly.

For production, private object storage with controlled access and signed URLs should be preferred for sensitive documents.

---

## 11. Incident Response

Operational incidents should be handled through a controlled process.

### Incident Process

1. Identify and confirm the incident.
2. Determine the affected service or functionality.
3. Check application and infrastructure logs.
4. Identify recent deployments, migrations, or configuration changes.
5. Determine whether an external provider is affected.
6. Apply the approved mitigation.
7. Monitor the system after mitigation.
8. Restore normal operation.
9. Record the incident and its root cause.
10. Create follow-up actions where required.

Security-related incidents should also follow the project's security incident-response procedures.

Incident contacts and escalation responsibilities require assignment by the operations owner.

---

## 12. Troubleshooting Procedures

### 12.1 Problem: API Is Unavailable

**Check:**

1. Server/container status.
2. Application process status.
3. Reverse proxy configuration.
4. Application port configuration.
5. Application logs.
6. Database connection.
7. Required environment variables.
8. External service status.
9. CORS configuration.
10. Recent deployment or migration changes.

**Resolution:**

- Restart the affected service if the process has stopped.
- Correct reverse-proxy or port configuration.
- Correct missing or invalid environment configuration.
- Restore database connectivity.
- Resolve external provider failures where applicable.
- Roll back the affected deployment if the issue was introduced by a release.

---

### 12.2 Problem: Authentication Failure

**Check:**

1. Access-token expiry.
2. Refresh-token validity.
3. Cookie attributes.
4. JWT configuration.
5. Server clock synchronization.
6. Authentication middleware.
7. User role and permissions.
8. Recent authentication-related deployment changes.

**Resolution:**

- Correct invalid authentication configuration.
- Resolve cookie or domain/HTTPS configuration issues.
- Verify JWT configuration.
- Correct role or permission assignments where appropriate.
- Re-authenticate the affected user after correcting the issue.

---

### 12.3 Problem: Upload Failure

**Check:**

1. Multer configuration and upload limits.
2. Request file type and size.
3. Local filesystem access where applicable.
4. Object-storage credentials and connectivity.
5. Cloudinary/S3-compatible storage configuration.
6. Signed URL configuration.
7. File-access authorization.

**Resolution:**

- Correct invalid file size or type configuration.
- Restore storage connectivity.
- Correct storage permissions or credentials.
- Regenerate signed access URLs where required.
- Verify that the authenticated user has permission to access the file.

---

### 12.4 Problem: Database Connection Failure

**Check:**

1. PostgreSQL availability.
2. Database host and port.
3. Database credentials.
4. Database name.
5. Connection-pool configuration.
6. Network access.
7. Recent database or migration changes.

**Resolution:**

- Restore PostgreSQL availability.
- Correct database environment configuration.
- Resolve network or access restrictions.
- Correct connection-pool configuration.
- Verify the application can establish a new database connection.

---

### 12.5 Problem: Scheduled Job Failure

**Check:**

1. Scheduler logs.
2. Database availability.
3. External provider availability.
4. Required environment variables.
5. Duplicate scheduler instances.
6. Recent deployment changes.

**Resolution:**

- Correct the underlying application, database, or provider issue.
- Ensure only the intended scheduler instance is active.
- Rerun the failed job through the approved replay mechanism.
- Verify successful completion.

---

## 13. Rollback Procedures

A deployment should be rolled back when a release introduces a critical failure that cannot be safely corrected through configuration or an immediate forward fix.

Rollback should follow the approved deployment process:

1. Identify the failed release.
2. Confirm the affected functionality.
3. Review application and deployment logs.
4. Identify related database migrations.
5. Determine whether application rollback is safe.
6. Restore the previous known-good application version.
7. Handle database changes using an approved migration/rollback strategy.
8. Verify application health.
9. Test the affected workflow.
10. Monitor the system after rollback.

Database migrations must not be casually reversed in production. Any migration rollback must be reviewed for data-loss or compatibility risks before execution.

---

## 14. Disaster Recovery

Disaster recovery must protect the availability and integrity of Ogera's critical data and services.

Recovery planning should cover:

- PostgreSQL data.
- Application configuration.
- Object/document storage.
- Required deployment configuration.
- External service credentials.
- Application source and release versions.

The recovery process should include:

1. Identify the failure scope.
2. Activate the approved recovery procedure.
3. Provision or restore the required infrastructure.
4. Restore the PostgreSQL database from the appropriate backup.
5. Restore required object-storage access.
6. Configure environment variables and secrets.
7. Deploy the approved application version.
8. Run required migrations carefully.
9. Verify application and database health.
10. Validate critical business workflows.
11. Monitor the recovered environment.

The project's official RPO, RTO, disaster-recovery runbook, and recovery ownership require definition by the operations owner.

---

## 15. Ownership and Responsibilities

| Area | Responsibility |
|---|---|
| Application maintenance | Backend/frontend development team |
| Database maintenance | Backend/database or designated operations team |
| Deployment | Designated deployment/operations team |
| Infrastructure | Designated infrastructure/operations owner |
| Monitoring | Operations team |
| Backups | Database/operations owner |
| Disaster recovery | Operations/infrastructure owner |
| Security incidents | Designated security owner |
| External providers | Assigned integration/service owner |
| Certificate renewal | Infrastructure/operations owner |
| Documentation | Development and operations teams |

Specific names, escalation contacts, and on-call responsibilities must be assigned by the project/operations owner.

---

## 16. Maintenance Change Requirements

Any maintenance change that affects application behavior, infrastructure, database schema, security, integrations, or scheduled jobs should be:

1. Reviewed before implementation.
2. Tested in an appropriate non-production environment.
3. Validated with the relevant automated tests.
4. Deployed through the approved release process.
5. Monitored after deployment.
6. Reflected in the appropriate project documentation.

Changes to database schema must use migrations, and changes to security-sensitive configuration must be reviewed carefully before deployment.

---

## 17. Operational Ownership Gaps

The following operational information still requires confirmation from the project/deployment owner:

- Production hosting provider.
- Canonical production domain.
- Staging environment details.
- Operations owner.
- Escalation contacts.
- On-call responsibilities.
- Certificate provider and renewal process.
- Official RPO.
- Official RTO.
- Disaster-recovery runbook location.
- Backup retention period.
- Monitoring and alerting platform.
- Incident-management process.

These values should be added once officially assigned rather than being guessed or documented as confirmed values.