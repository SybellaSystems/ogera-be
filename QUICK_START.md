# Quick Start Guide - Ogera API

This guide will help you get started with the Ogera API in just a few minutes.

## Prerequisites

- Node.js >= v18.x.x
- PostgreSQL database
- Postman (optional, for testing)

---

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.development` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Database Configuration
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=ogera_db
DB_HOST=localhost
DB_DIALECT=postgres

# JWT Configuration
JWT_ACCESS_TOKEN_SECRET=your_secret_key_here
JWT_REFRESH_TOKEN_SECRET=your_refresh_secret_key_here

# Email Configuration (for OTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=noreply@ogera.com
```

### 3. Run Migrations

```bash
npm run migration
```

### 4. Start the Server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

---

## Testing the API

### Option 1: Using Swagger UI (Recommended for Beginners)

1. Open your browser and navigate to: `http://localhost:5000/api-docs`
2. You'll see an interactive API documentation
3. Click on any endpoint to expand it
4. Click "Try it out" to test the endpoint
5. Fill in the required parameters
6. Click "Execute"

### Option 2: Using Postman

1. Import the Postman collection:
   - File → Import → Select `Ogera_API.postman_collection.json`
2. The collection is pre-configured with all endpoints
3. Start with the "Login" request to get an access token
4. The token is automatically saved for subsequent requests

### Option 3: Using cURL

See examples below for basic operations.

---

## Basic Operations

### 1. Create a Role (Admin Setup)

First, you need to create roles for the system:

```bash
curl -X POST http://localhost:5000/api/roles/create \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "student",
    "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\"]}]"
  }'
```

Response:
```json
{
  "message": "Role created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "roleName": "student",
    "created_at": "2025-11-27T10:30:00Z"
  }
}
```

**Note:** Save the `id` value - you'll need it for user registration.

### 2. Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "mobile_number": "+1234567890",
    "password": "SecurePass123!",
    "role_id": "550e8400-e29b-41d4-a716-446655440000",
    "terms": true,
    "privacy": true
  }'
```

Response:
```json
{
  "success": true,
  "status": 201,
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "full_name": "John Doe"
  },
  "message": "User registered successfully"
}
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "status": 200,
  "data": {
    "user": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "john.doe@example.com",
      "full_name": "John Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "two_fa_enabled": false
  },
  "message": "User logged in successfully"
}
```

**Important:** Copy the `accessToken` value - you'll need it for authenticated requests.

### 4. Get User Profile (Authenticated)

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Replace `YOUR_ACCESS_TOKEN` with the token from the login response.

### 5. Create a Job (Requires Permissions)

First, create an employer role with job creation permissions:

```bash
curl -X POST http://localhost:5000/api/roles/create \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "employer",
    "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\", \"create\", \"edit\", \"delete\"]}]"
  }'
```

Register as an employer, login, then create a job:

```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "employer_id": "YOUR_USER_ID",
    "job_title": "Full Stack Developer",
    "category": "Technology",
    "budget": 5000.00,
    "duration": "3 months",
    "location": "New York, NY",
    "status": "Active"
  }'
```

### 6. Get All Jobs

```bash
curl -X GET http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Common Workflows

### Workflow 1: Student Registration and Job Browsing

1. Create "student" role (if not exists)
2. Register as a student
3. Login
4. Browse available jobs using GET `/api/jobs`

### Workflow 2: Employer Job Posting

1. Create "employer" role (if not exists)
2. Register as an employer
3. Login
4. Create a job posting using POST `/api/jobs`
5. View applications (when implemented)
6. Update job status using PUT `/api/jobs/:id`

### Workflow 3: Password Reset

1. Request password reset: POST `/api/auth/forgot-password`
2. Check email for OTP
3. Verify OTP: POST `/api/auth/verify-otp`
4. Reset password: POST `/api/auth/reset-password`

### Workflow 4: Enable Two-Factor Authentication

1. Setup 2FA: POST `/api/auth/2fa/setup`
2. Scan QR code with authenticator app
3. Verify setup: POST `/api/auth/2fa/verify`
4. Future logins will require 2FA token

---

## Role-Based Access Control

The API uses a role-based permission system. Here are the typical roles:

### Student Role
```json
{
  "roleName": "student",
  "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\"]}]"
}
```

**Can:**
- View jobs
- Apply to jobs
- View own profile

### Employer Role
```json
{
  "roleName": "employer",
  "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\", \"create\", \"edit\", \"delete\"]}]"
}
```

**Can:**
- All student permissions
- Create job postings
- Edit own job postings
- Delete own job postings
- View applications

### Admin Role
```json
{
  "roleName": "admin",
  "permission_json": "[{\"resource\": \"*\", \"actions\": [\"*\"]}]"
}
```

**Can:**
- Full system access
- Manage users
- Manage roles
- Manage all jobs

---

## Environment-Specific Tips

### Development

```bash
npm run dev
```
- Hot reloading enabled with nodemon
- Detailed error messages
- Debug logs enabled

### Production

```bash
npm run build
npm start
```
- Optimized build
- Error logs only
- Production-ready configuration

---

## Troubleshooting

### Database Connection Issues

**Problem:** Cannot connect to database

**Solution:**
1. Verify PostgreSQL is running
2. Check database credentials in `.env.development`
3. Ensure database exists: `createdb ogera_db`
4. Run migrations: `npm run migration`

### Authentication Errors

**Problem:** 401 Unauthorized

**Solution:**
1. Ensure you're logged in
2. Check access token is valid and not expired
3. Include token in Authorization header: `Authorization: Bearer <token>`
4. Refresh token if expired: GET `/api/auth/refresh`

### Permission Errors

**Problem:** 403 Forbidden

**Solution:**
1. Check your user role has required permissions
2. Verify the permission_json in your role includes the action
3. For jobs: ensure role has permission for `/jobs` resource

### Rate Limiting

**Problem:** 429 Too Many Requests

**Solution:**
1. Wait 15 minutes for rate limit reset
2. For development, you can modify rate limits in `rateLimiter.middleware.ts`

---

## Next Steps

1. **Explore Full Documentation**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. **Interactive Testing**: Use Swagger UI at `http://localhost:5000/api-docs`
3. **Import Postman Collection**: Use `Ogera_API.postman_collection.json`
4. **Review Code**: Check the `/src` directory structure
5. **Add Features**: Extend the API with custom modules

---

## Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm run lint                   # Check code quality
npm run lint:fix              # Fix linting issues

# Database
npm run migration:generate    # Generate new migration
npm run migration            # Run migrations

# Testing
npm test                      # Run tests
npm run test:watch           # Run tests in watch mode

# Production
npm run build                # Build for production
npm start                    # Start production server
```

---

## Support

- **Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Swagger UI**: http://localhost:5000/api-docs
- **Issues**: Report bugs or request features on GitHub

---

**Happy Coding! 🚀**

