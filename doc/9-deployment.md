# Deployment

## Local

Install dependencies with `npm install`, provide PostgreSQL and environment variables, run `npm run migration`, then `npm run dev`. For a production-like local run use `npm run build` followed by `npm start`.

## Container and environments

The repository includes a backend Dockerfile. Build and run commands, registry, hosting provider, domains, TLS certificates, database provisioning, and environment-specific secret names must be supplied by the deployment owner. Development, staging, and production must use separate databases and credentials.

## Release sequence

1. Build and test the commit.
2. Build and publish the backend image or deploy the Node.js artifact.
3. Apply reviewed Sequelize migrations before starting code that requires them.
4. Run smoke checks for health, authentication, Swagger, database access, uploads, and critical API flows.
5. Verify logs, scheduled jobs, websocket connections, and frontend connectivity.

## Rollback

Stop or route away from the new release, restore the previous artifact, and only reverse migrations when the migration has an approved down path and data impact is understood. Restore database backups through the managed provider process when necessary. Record all emergency actions.
