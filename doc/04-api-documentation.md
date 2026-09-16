# Ogera API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Jobs](#jobs-endpoints)
  - [Roles](#roles-endpoints)

---

## Overview

The Ogera API is a RESTful API built with Node.js, Express, TypeScript, and Sequelize. It provides endpoints for user authentication, job management, and role-based access control.

### Key Features
- JWT-based authentication with access and refresh tokens
- Two-factor authentication (2FA) support
- Role-based access control (RBAC)
- Password reset with OTP verification
- Pagination support for list endpoints
- Rate limiting for security
- Comprehensive error handling

---

## Base URL

```
Development: http://localhost:5000/api
Production: [Your production URL]/api
```

### Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:5000/api-docs
```

---

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Two types of tokens are used:

1. **Access Token**: Short-lived token (15 minutes) for API requests
2. **Refresh Token**: Long-lived token (7 days) stored in HTTP-only cookie

### Using Bearer Token

Include the access token in the Authorization header:

```http
Authorization: Bearer <your_access_token>
```

### Token Refresh Flow

1. When access token expires, call `/api/auth/refresh` endpoint
2. The refresh token is automatically sent via cookies
3. Receive a new access token

---

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "status": 200,
  "data": {
    // Response data
  },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "status": 400,
  "message": "Error message"
}
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server error |

---

## API Endpoints

## Authentication Endpoints

### 1. Register User

Register a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "mobile_number": "+1234567890",
  "password": "SecurePass123!",
  "role_id": "123e4567-e89b-12d3-a456-426614174000",
  "national_id_number": "1234567890",
  "business_registration_id": "BRN123456",
  "terms": true,
  "privacy": true
}
```

**Required Fields:**
- `full_name` (string, max 255 chars)
- `email` (valid email format)
- `mobile_number` (string, max 15 chars)
- `password` (string)
- `role_id` (UUID)
- `terms` (boolean, must be true)
- `privacy` (boolean, must be true)

**Optional Fields:**
- `national_id_number` (string, max 50 chars)
- `business_registration_id` (string, max 50 chars, for employers)

**Response:** `201 Created`
```json
{
  "success": true,
  "status": 201,
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "full_name": "John Doe",
    "mobile_number": "+1234567890",
    "role_id": "123e4567-e89b-12d3-a456-426614174001",
    "two_fa_enabled": false,
    "terms_accepted": true,
    "privacy_accepted": true,
    "created_at": "2025-11-27T10:30:00Z"
  },
  "message": "User registered successfully"
}
```

---

### 2. Login

Authenticate a user and receive tokens.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "user": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "role_id": "123e4567-e89b-12d3-a456-426614174001",
      "two_fa_enabled": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "two_fa_enabled": false
  },
  "message": "User logged in successfully"
}
```

**Note:** Refresh token is set as an HTTP-only cookie.

---

### 3. Refresh Access Token

Get a new access token using the refresh token.

**Endpoint:** `GET /api/auth/refresh`

**Headers:**
- Cookie: `refreshToken=<refresh_token>` (automatically sent by browser)

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token refreshed successfully"
}
```

---

### 4. Logout

Logout the user and clear refresh token.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {},
  "message": "Logged out successfully"
}
```

---

### 5. Setup Two-Factor Authentication (2FA)

Generate QR code and secret for 2FA setup.

**Endpoint:** `POST /api/auth/2fa/setup`

**Request Body:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john.doe@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "secret": "JBSWY3DPEHPK3PXP"
  },
  "message": "2FA setup successful"
}
```

**Usage:**
1. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)
2. Verify the setup using the `/auth/2fa/verify` endpoint

---

### 6. Verify Two-Factor Authentication

Verify the 2FA token.

**Endpoint:** `POST /api/auth/2fa/verify`

**Request Body:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "token": "123456"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {},
  "message": "2FA verified successfully"
}
```

---

### 7. Forgot Password

Request a password reset OTP.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "OTP sent successfully"
}
```

**Note:** An OTP will be sent to the user's email.

---

### 8. Verify Reset OTP

Verify the OTP sent to the user's email.

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "otp": "123456",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {},
  "message": "OTP verification successful"
}
```

---

### 9. Reset Password

Reset the user's password using the verified reset token.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "newPassword": "NewSecurePass123!",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {},
  "message": "Password reset successful"
}
```

---

### 10. Get User Profile

Get the authenticated user's profile.

**Endpoint:** `GET /api/auth/profile`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "full_name": "John Doe",
    "mobile_number": "+1234567890",
    "role_id": "123e4567-e89b-12d3-a456-426614174001",
    "two_fa_enabled": false,
    "national_id_number": "1234567890",
    "business_registration_id": "BRN123456",
    "terms_accepted": true,
    "privacy_accepted": true,
    "created_at": "2025-11-27T10:30:00Z",
    "updated_at": "2025-11-27T10:30:00Z"
  },
  "message": "User profile retrieved successfully"
}
```

---

### 11. Get All Users

Get a paginated list of all users.

**Endpoint:** `GET /api/auth/get-user`

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 10) - Items per page

**Example:** `GET /api/auth/get-user?page=1&limit=10`

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "Users fetched successfully",
  "success": true,
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10
  },
  "data": [
    {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "role_id": "123e4567-e89b-12d3-a456-426614174001",
      "created_at": "2025-11-27T10:30:00Z"
    }
    // ... more users
  ]
}
```

---

### 12. Get All Students

Get a paginated list of all students.

**Endpoint:** `GET /api/auth/get-students`

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 10)

**Response:** Same format as "Get All Users"

---

### 13. Get All Employers

Get a paginated list of all employers.

**Endpoint:** `GET /api/auth/get-employers`

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 10)

**Response:** Same format as "Get All Users"

---

### 14. Test Protected Route

Test endpoint to verify authentication.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Protected API working",
  "user": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com"
  }
}
```

---

## Jobs Endpoints

### 1. Create Job

Create a new job posting.

**Endpoint:** `POST /api/jobs`

**Authentication:** Required

**Permissions:** Create permission on `/jobs` resource

**Request Body:**
```json
{
  "employer_id": "123e4567-e89b-12d3-a456-426614174000",
  "job_title": "Full Stack Developer",
  "category": "Technology",
  "budget": 5000.00,
  "duration": "3 months",
  "location": "New York, NY",
  "status": "Active"
}
```

**Required Fields:**
- `employer_id` (UUID)
- `job_title` (string, max 255 chars)
- `category` (string, max 100 chars)
- `budget` (number)
- `duration` (string, max 100 chars)
- `location` (string, max 255 chars)

**Optional Fields:**
- `status` (enum: "Pending", "Active", "Completed", default: "Pending")

**Response:** `201 Created`
```json
{
  "success": true,
  "status": 201,
  "data": {
    "job_id": "123e4567-e89b-12d3-a456-426614174000",
    "employer_id": "123e4567-e89b-12d3-a456-426614174001",
    "job_title": "Full Stack Developer",
    "applications": 0,
    "category": "Technology",
    "budget": 5000.00,
    "duration": "3 months",
    "location": "New York, NY",
    "status": "Active",
    "created_at": "2025-11-27T10:30:00Z",
    "updated_at": "2025-11-27T10:30:00Z"
  },
  "message": "Job created successfully"
}
```

---

### 2. Get All Jobs

Retrieve all job postings.

**Endpoint:** `GET /api/jobs`

**Authentication:** Required

**Permissions:** View permission on `/jobs` resource

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "job_id": "123e4567-e89b-12d3-a456-426614174000",
      "employer_id": "123e4567-e89b-12d3-a456-426614174001",
      "job_title": "Full Stack Developer",
      "applications": 5,
      "category": "Technology",
      "budget": 5000.00,
      "duration": "3 months",
      "location": "New York, NY",
      "status": "Active",
      "created_at": "2025-11-27T10:30:00Z",
      "updated_at": "2025-11-27T10:30:00Z"
    }
    // ... more jobs
  ],
  "message": "Jobs retrieved successfully"
}
```

---

### 3. Get Job by ID

Retrieve a specific job by its ID.

**Endpoint:** `GET /api/jobs/:id`

**Authentication:** Required

**Permissions:** View permission on `/jobs` resource

**Parameters:**
- `id` (UUID) - Job ID

**Example:** `GET /api/jobs/123e4567-e89b-12d3-a456-426614174000`

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "job_id": "123e4567-e89b-12d3-a456-426614174000",
    "employer_id": "123e4567-e89b-12d3-a456-426614174001",
    "job_title": "Full Stack Developer",
    "applications": 5,
    "category": "Technology",
    "budget": 5000.00,
    "duration": "3 months",
    "location": "New York, NY",
    "status": "Active",
    "created_at": "2025-11-27T10:30:00Z",
    "updated_at": "2025-11-27T10:30:00Z"
  },
  "message": "Job retrieved successfully"
}
```

---

### 4. Update Job

Update an existing job posting.

**Endpoint:** `PUT /api/jobs/:id`

**Authentication:** Required

**Permissions:** Edit permission on `/jobs` resource

**Parameters:**
- `id` (UUID) - Job ID

**Request Body:** (All fields are optional)
```json
{
  "job_title": "Senior Full Stack Developer",
  "category": "Technology",
  "budget": 6000.00,
  "duration": "4 months",
  "location": "San Francisco, CA",
  "status": "Active"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "job_id": "123e4567-e89b-12d3-a456-426614174000",
    "job_title": "Senior Full Stack Developer",
    "budget": 6000.00,
    "duration": "4 months",
    "location": "San Francisco, CA",
    "status": "Active",
    "updated_at": "2025-11-27T11:00:00Z"
  },
  "message": "Job updated successfully"
}
```

---

### 5. Delete Job

Delete a job posting.

**Endpoint:** `DELETE /api/jobs/:id`

**Authentication:** Required

**Permissions:** Delete permission on `/jobs` resource

**Parameters:**
- `id` (UUID) - Job ID

**Example:** `DELETE /api/jobs/123e4567-e89b-12d3-a456-426614174000`

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "data": {},
  "message": "Job deleted successfully"
}
```

---

## Roles Endpoints

### 1. Create Role

Create a new role with permissions.

**Endpoint:** `POST /api/roles/create`

**Authentication:** Required

**Request Body:**
```json
{
  "roleName": "student",
  "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\"]}]"
}
```

**Required Fields:**
- `roleName` (enum: "student", "employer", "admin")
- `permission_json` (JSON string of permissions)

**Response:** `201 Created`
```json
{
  "message": "Role created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "roleName": "student",
    "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\"]}]",
    "created_at": "2025-11-27T10:30:00Z",
    "updated_at": "2025-11-27T10:30:00Z"
  }
}
```

---

### 2. Get All Roles

Retrieve all roles.

**Endpoint:** `GET /api/roles`

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "roleName": "student",
    "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\"]}]",
    "created_at": "2025-11-27T10:30:00Z",
    "updated_at": "2025-11-27T10:30:00Z"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "roleName": "employer",
    "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\", \"create\", \"edit\", \"delete\"]}]",
    "created_at": "2025-11-27T10:30:00Z",
    "updated_at": "2025-11-27T10:30:00Z"
  }
]
```

---

### 3. Get Role by ID

Retrieve a specific role by its ID.

**Endpoint:** `GET /api/roles/:id`

**Authentication:** Required

**Parameters:**
- `id` (UUID) - Role ID

**Example:** `GET /api/roles/123e4567-e89b-12d3-a456-426614174000`

**Response:** `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "roleName": "student",
  "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\"]}]",
  "created_at": "2025-11-27T10:30:00Z",
  "updated_at": "2025-11-27T10:30:00Z"
}
```

---

### 4. Update Role

Update an existing role.

**Endpoint:** `PUT /api/roles/:id`

**Authentication:** Required

**Parameters:**
- `id` (UUID) - Role ID

**Request Body:** (All fields are optional)
```json
{
  "roleName": "employer",
  "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\", \"create\", \"edit\"]}]"
}
```

**Response:** `200 OK`
```json
{
  "message": "Role updated successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "roleName": "employer",
    "permission_json": "[{\"resource\": \"/jobs\", \"actions\": [\"view\", \"create\", \"edit\"]}]",
    "updated_at": "2025-11-27T11:00:00Z"
  }
}
```

---

### 5. Delete Role

Delete a role.

**Endpoint:** `DELETE /api/roles/:id`

**Authentication:** Required

**Parameters:**
- `id` (UUID) - Role ID

**Example:** `DELETE /api/roles/123e4567-e89b-12d3-a456-426614174000`

**Response:** `200 OK`
```json
{
  "message": "Role deleted successfully"
}
```

---

## Permission System

The Ogera API uses a role-based permission system. Permissions are stored as JSON in the `permission_json` field of roles.

### Permission Structure

```json
[
  {
    "resource": "/jobs",
    "actions": ["view", "create", "edit", "delete"]
  },
  {
    "resource": "/users",
    "actions": ["view"]
  }
]
```

### Available Actions
- `view` - View/read access
- `create` - Create new resources
- `edit` - Modify existing resources
- `delete` - Delete resources

### Built-in Roles

1. **Student**
   - Can view jobs
   - Can apply to jobs

2. **Employer**
   - Can view, create, edit, and delete their own jobs
   - Can view job applications

3. **Admin**
   - Full access to all resources
   - Can manage users and roles

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **API Routes:** 100 requests per 15 minutes
- **Login Endpoint:** 5 requests per 15 minutes (configurable)

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

---

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **HTTP-Only Cookies**: Refresh tokens stored securely
3. **Password Hashing**: Bcrypt for password encryption
4. **2FA Support**: TOTP-based two-factor authentication
5. **Rate Limiting**: Protection against brute force attacks
6. **Helmet**: Security headers for Express
7. **Email Validation**: Disposable email domain blocking
8. **CORS**: Configured for specific origins
9. **Request Logging**: Winston for access and error logs

---

## Environment Variables

Required environment variables in `.env.development`:

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
JWT_ACCESS_TOKEN_SECRET=your_access_token_secret
JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Email Configuration (for OTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_email_password
MAIL_FROM=noreply@ogera.com
```

---

## Testing with Postman

### Import Collection

1. Visit: `http://localhost:5000/api-docs`
2. Download the OpenAPI/Swagger JSON
3. Import into Postman

### Environment Setup

Create a Postman environment with these variables:

```
base_url: http://localhost:5000/api
access_token: (will be set after login)
refresh_token: (will be set after login)
```

### Authentication Flow

1. Register a new user
2. Login and copy the `accessToken` from response
3. Set `access_token` environment variable
4. Use `{{access_token}}` in Authorization header for protected routes

---

## Common Issues and Solutions

### 1. Token Expired

**Problem:** `401 Unauthorized - Token expired`

**Solution:** Use the `/auth/refresh` endpoint to get a new access token.

### 2. Insufficient Permissions

**Problem:** `403 Forbidden - Insufficient permissions`

**Solution:** Ensure your user has the required role and permissions for the endpoint.

### 3. Validation Errors

**Problem:** `400 Bad Request - Validation error`

**Solution:** Check the request body matches the required schema. Review field requirements.

### 4. Rate Limit Exceeded

**Problem:** `429 Too Many Requests`

**Solution:** Wait 15 minutes or implement exponential backoff in your client.

---

## Support and Contact

For issues, questions, or contributions:
- GitHub Issues: [Your GitHub Repository]
- Email: support@ogera.com
- Documentation: http://localhost:5000/api-docs

---

## Changelog

### Version 1.0.0 (2025-11-27)
- Initial API release
- Authentication endpoints
- Job management endpoints
- Role management endpoints
- 2FA support
- Password reset flow
- Role-based access control

---

**Last Updated:** November 27, 2025
**API Version:** 1.0.0

