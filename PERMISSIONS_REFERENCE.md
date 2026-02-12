# API Routes Permissions Reference

This document lists all API routes and their required permissions.

## Permission System Overview

The permission system uses 4 actions:
- **view**: Read/view access
- **create**: Create/new resource access
- **edit**: Update/modify access
- **delete**: Delete/remove access

### Special Notes:
- **Superadmin**: Bypasses all permissions (has full access)
- **Admin/Subadmin**: Bypasses all permissions (has full access)
- All routes require `authMiddleware` unless specified as public

---

## 1. Authentication Routes (`/auth`)

### Public Routes (No Authentication Required)
| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| POST | `/auth/register` | None | User registration |
| POST | `/auth/login` | None | User login |
| GET | `/auth/refresh` | None | Refresh access token |
| POST | `/auth/forgot-password` | None | Request password reset |
| POST | `/auth/verify-otp` | None | Verify reset OTP |
| POST | `/auth/reset-password` | None | Reset password |
| GET | `/auth/verify-email` | None | Verify email address |
| POST | `/auth/resend-verification-email` | None | Resend verification email |
| POST | `/auth/2fa/setup` | None | Setup 2FA |
| POST | `/auth/2fa/verify` | None | Verify 2FA |

### Authenticated Routes (Auth Required Only)
| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| POST | `/auth/logout` | None | Logout user |
| GET | `/auth/me` | None | Get current user info |
| POST | `/auth/send-phone-verification-otp` | None | Send phone verification OTP |
| POST | `/auth/verify-phone` | None | Verify phone number |
| GET | `/auth/profile` | None | Get user profile |
| PUT | `/auth/profile` | None | Update user profile |
| GET | `/auth/get-user` | None | Get all users |
| GET | `/auth/get-students` | None | Get all students |
| GET | `/auth/get-employers` | None | Get all employers |

### Superadmin Only Routes
| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| POST | `/auth/create-subadmin` | `superadminOnly` | Create subadmin |
| GET | `/auth/subadmins` | `superadminOnly` | Get all subadmins |
| GET | `/auth/subadmins/:id` | `superadminOnly` | Get subadmin by ID |
| PUT | `/auth/subadmins/:id` | `superadminOnly` | Update subadmin |
| DELETE | `/auth/subadmins/:id` | `superadminOnly` | Delete subadmin |

---

## 2. Jobs Routes (`/jobs`)

| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/jobs` | `/jobs` → `view` | Get all jobs |
| GET | `/jobs/active` | `/jobs` → `view` | Get active jobs |
| GET | `/jobs/pending` | `/jobs` → `view` | Get pending jobs |
| GET | `/jobs/completed` | `/jobs` → `view` | Get completed jobs |
| GET | `/jobs/:id` | `/jobs` → `view` | Get job by ID |
| POST | `/jobs` | `/jobs` → `create` | Create new job |
| PUT | `/jobs/:id` | `/jobs` → `edit` | Update job |
| DELETE | `/jobs/:id` | `/jobs` → `delete` | Delete job |
| PATCH | `/jobs/:id/toggle-status` | `/jobs` → `edit` | Toggle job status (Active/Inactive) |

**Permission JSON Example:**
```json
{
  "route": "/jobs",
  "permission": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": true
  }
}
```

---

## 3. Job Applications Routes (`/` - base route)

| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| POST | `/upload-resume` | `/job-applications` → `create` | Upload resume for job application (student) |
| GET | `/resumes/download` | `/job-applications` → `view` | Download resume file (employer/admin) |
| GET | `/jobs/:job_id/check-application` | `/job-applications` → `view` | Check if student has applied (student) |
| POST | `/jobs/:job_id/apply` | `/job-applications` → `create` | Apply for a job (student) |
| GET | `/jobs/:job_id/applications` | `/job-applications` → `view` | Get all applications for a job (employer/admin) |
| GET | `/employer/applications` | `/job-applications` → `view` | Get all applications for an employer |
| GET | `/student/applications` | `/job-applications` → `view` | Get student's own applications |
| GET | `/applications/:application_id` | `/job-applications` → `view` | Get application by ID |
| PATCH | `/applications/:application_id/status` | `/job-applications` → `edit` | Accept/reject application (employer/admin) |

**Permission JSON Example:**
```json
{
  "route": "/job-applications",
  "permission": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": false
  }
}
```

---

## 4. Academic Verifications Routes (`/academic-verifications`)

| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| POST | `/academic-verifications` | `/academic-verifications` → `create` | Upload academic document (student) |
| GET | `/academic-verifications/my-verification` | `/academic-verifications` → `view` | Get my academic verification (student) |
| POST | `/academic-verifications/:id/reupload` | `/academic-verifications` → `edit` | Re-upload academic document (student - if rejected) |
| PATCH | `/academic-verifications/:id/review` | `/academic-verifications` → `edit` | Review academic document (admin) |
| GET | `/academic-verifications/:id` | `/academic-verifications` → `view` | Get academic verification by ID |
| GET | `/academic-verifications/user/:user_id` | `/academic-verifications` → `view` | Get academic verification by user ID |
| GET | `/academic-verifications` | `/academic-verifications` → `view` | Get all academic verifications (admin) |
| GET | `/academic-verifications/pending/list` | `/academic-verifications` → `view` | Get pending academic verifications (admin) |

**Permission JSON Example:**
```json
{
  "route": "/academic-verifications",
  "permission": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": false
  }
}
```

**Note:** To check document status (accepted/rejected), students need **`view`** permission.

---

## 5. Notifications Routes (`/notifications`)

| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/notifications` | `/notifications` → `view` | Get all notifications for authenticated user |
| GET | `/notifications/unread/count` | `/notifications` → `view` | Get unread notification count |
| PATCH | `/notifications/:notification_id/read` | `/notifications` → `edit` | Mark notification as read |
| PATCH | `/notifications/read-all` | `/notifications` → `edit` | Mark all notifications as read |
| DELETE | `/notifications/:notification_id` | `/notifications` → `delete` | Delete notification |

**Permission JSON Example:**
```json
{
  "route": "/notifications",
  "permission": {
    "view": true,
    "create": false,
    "edit": true,
    "delete": true
  }
}
```

---

## 6. Profile Routes (`/profile`)

**Note:** All profile routes require `authMiddleware` only (no permission checker).

| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/profile/full` | None (auth only) | Get full profile |
| GET | `/profile/extended` | None (auth only) | Get extended profile |
| PUT | `/profile/extended` | None (auth only) | Update extended profile |

### Skills
| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/profile/skills` | None (auth only) | Get user skills |
| POST | `/profile/skills` | None (auth only) | Add skill |
| POST | `/profile/skills/bulk` | None (auth only) | Add bulk skills |
| PUT | `/profile/skills/:id` | None (auth only) | Update skill |
| DELETE | `/profile/skills/:id` | None (auth only) | Delete skill |

### Employment
| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/profile/employments` | None (auth only) | Get employments |
| POST | `/profile/employments` | None (auth only) | Add employment |
| PUT | `/profile/employments/:id` | None (auth only) | Update employment |
| DELETE | `/profile/employments/:id` | None (auth only) | Delete employment |

### Education
| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/profile/educations` | None (auth only) | Get educations |
| POST | `/profile/educations` | None (auth only) | Add education |
| PUT | `/profile/educations/:id` | None (auth only) | Update education |
| DELETE | `/profile/educations/:id` | None (auth only) | Delete education |

### Projects
| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/profile/projects` | None (auth only) | Get projects |
| POST | `/profile/projects` | None (auth only) | Add project |
| PUT | `/profile/projects/:id` | None (auth only) | Update project |
| DELETE | `/profile/projects/:id` | None (auth only) | Delete project |

### Accomplishments
| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/profile/accomplishments` | None (auth only) | Get accomplishments |
| POST | `/profile/accomplishments` | None (auth only) | Add accomplishment |
| PUT | `/profile/accomplishments/:id` | None (auth only) | Update accomplishment |
| DELETE | `/profile/accomplishments/:id` | None (auth only) | Delete accomplishment |

---

## 7. Trust Score Routes (`/trust-score`)

**Note:** All trust score routes require `authMiddleware` only (no permission checker).

| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/trust-score/me` | None (auth only) | Get authenticated user's trust score |
| GET | `/trust-score/:user_id` | None (auth only) | Get trust score for a specific user |

---

## 8. Roles Routes (`/roles`)

**Note:** Role routes have permission checks handled in the controller/service layer.

| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| POST | `/roles/create` | Controller check | Create role (superadmin check in controller) |
| GET | `/roles` | None | Get all roles |
| GET | `/roles/:id` | None | Get role by ID |
| PUT | `/roles/:id` | Controller check | Update role (superadmin check in controller) |
| DELETE | `/roles/:id` | Controller check | Delete role (superadmin check in controller) |

---

## Summary: Permission Requirements by Route

### Routes Requiring Permissions

1. **`/jobs`** - Jobs management
   - `view`: View jobs
   - `create`: Create jobs
   - `edit`: Update/toggle job status
   - `delete`: Delete jobs

2. **`/job-applications`** - Job applications
   - `view`: View applications, resumes, check application status
   - `create`: Apply for jobs, upload resumes
   - `edit`: Update application status (accept/reject)
   - `delete`: Not used

3. **`/academic-verifications`** - Academic document verification
   - `view`: View verification status (including accepted/rejected)
   - `create`: Upload academic documents
   - `edit`: Re-upload documents, review documents (admin)
   - `delete`: Not used

4. **`/notifications`** - User notifications
   - `view`: View notifications, unread count
   - `create`: Not used
   - `edit`: Mark notifications as read
   - `delete`: Delete notifications

### Routes with No Permission Checks (Auth Only)

- `/auth/*` (most routes - see details above)
- `/profile/*` (all routes)
- `/trust-score/*` (all routes)
- `/roles/*` (controller-level checks)

---

## Student Role Example Configuration

To give a student access to all necessary features, configure permissions like this:

```json
[
  {
    "route": "/jobs",
    "permission": {
      "view": true,
      "create": false,
      "edit": false,
      "delete": false
    }
  },
  {
    "route": "/job-applications",
    "permission": {
      "view": true,
      "create": true,
      "edit": false,
      "delete": false
    }
  },
  {
    "route": "/academic-verifications",
    "permission": {
      "view": true,
      "create": true,
      "edit": true,
      "delete": false
    }
  },
  {
    "route": "/notifications",
    "permission": {
      "view": true,
      "create": false,
      "edit": true,
      "delete": true
    }
  }
]
```

---

## Employer Role Example Configuration

```json
[
  {
    "route": "/jobs",
    "permission": {
      "view": true,
      "create": true,
      "edit": true,
      "delete": true
    }
  },
  {
    "route": "/job-applications",
    "permission": {
      "view": true,
      "create": false,
      "edit": true,
      "delete": false
    }
  },
  {
    "route": "/academic-verifications",
    "permission": {
      "view": true,
      "create": false,
      "edit": false,
      "delete": false
    }
  },
  {
    "route": "/notifications",
    "permission": {
      "view": true,
      "create": false,
      "edit": true,
      "delete": true
    }
  }
]
```

---

## Notes

1. **Superadmin and Admin roles bypass all permission checks** - they have full access to all routes.

2. **Permission checking is case-sensitive** - route paths must match exactly.

3. **All authenticated routes require `authMiddleware`** - ensure users are logged in before permission checks.

4. **Profile and Trust Score routes** don't use the permission checker - they only require authentication.

5. **Role management** uses controller-level checks instead of middleware permission checker.

