import { Response, NextFunction } from 'express';
import { CustomError } from '@/utils/custom-error';
import { DB } from '@/database';

export const PermissionChecker = (route: string, action: string) => {
    return async (req: any, _res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(new CustomError('Unauthorized', 401));
            }

            const roleName = req.user.role;
            const normalizedRole = roleName?.toLowerCase?.() || '';

            // ⭐ Superadmin bypasses all permissions (case-insensitive)
            // Superadmin has full access to everything
            if (normalizedRole === 'superadmin') {
                return next();
            }

            // Keep built-in product roles aligned with the frontend permission defaults.
            // Employers are expected to manage jobs even when their role record does not
            // include explicit permission_json rules for "/jobs".
            if (normalizedRole === 'employer' && route === '/jobs') {
                return next();
            }

            // Students can access jobs/disputes and academic verification views by default.
            if (
                normalizedRole === 'student' &&
                (route === '/jobs' ||
                    route === '/disputes' ||
                    (route === '/academic-verifications' && action === 'view'))
            ) {
                return next();
            }

           // Students can VIEW job referrals.
//
// Students can also increment referral activity counters
// through the dedicated /:referral_id/counter endpoint.
//
// They still CANNOT create, edit, delete, approve, reject,
// verify, or change the status of a job referral.
if (
    normalizedRole === 'student' &&
    route === '/job-referrals'
) {
    // Normal referral viewing
    if (action === 'view') {
        return next();
    }

    // Referral activity tracking only.
    //
    // The router uses PermissionChecker('/job-referrals', 'create')
    // for the counter endpoint, so specifically allow that endpoint
    // without granting students general "create" permission.
    if (
        action === 'create' &&
        req.path?.endsWith('/counter')
    ) {
        return next();
    }
}

            // Verification admins retain default academic verification access.
            if (
                normalizedRole === 'verifydocadmin' &&
                route === '/academic-verifications'
            ) {
                return next();
            }

            // Load role from DB to check roleType
            const role = await DB.Roles.findOne({ where: { roleName } });
            if (!role) {
                return next(new CustomError('Role not found', 403));
            }

            // ⭐ If roleType is 'admin', bypass permission checks (for backward compatibility)
            // But note: Custom admin roles (like "job-admin") should still check permissions
            // So we only bypass if the roleName is exactly "admin" (legacy behavior)
            // For custom admin roles, we check permissions below
            if (normalizedRole === 'admin' && role.roleType === 'admin') {
                return next();
            }

            // Parse permission_json if it's a string, otherwise use it as-is
            const permissions: any[] =
                typeof role.permission_json === 'string'
                    ? JSON.parse(role.permission_json)
                    : role.permission_json || [];

            for (const perm of permissions) {
                const permRoute = perm.route || '';
                const permActions = perm.permission || {};

                const isMatch =
                    route === permRoute ||
                    route.startsWith(permRoute + '/') ||
                    (permRoute.includes('{') &&
                        route.split('/')[1] === permRoute.split('/')[1]);

                if (isMatch) {
                    if (permActions[action] === true) {
                        return next(); // ✔ PERMISSION GRANTED
                    }
                    return next(
                        new CustomError(
                            'Forbidden: You cannot perform this action',
                            403,
                        ),
                    );
                }
            }

            return next(
                new CustomError(
                    'Forbidden: No permission rule for this route',
                    403,
                ),
            );
        } catch (error) {
            next(error); // ⭐ Prevent crashes
        }
    };
};

// -------------------- SUPERADMIN ONLY MIDDLEWARE --------------------
export const superadminOnly = async (
    req: any,
    _res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.user) {
            return next(new CustomError('Unauthorized', 401));
        }

        const roleName = req.user.role;

        // Check if user is superadmin (case-insensitive check)
        if (roleName?.toLowerCase() !== 'superadmin') {
            return next(
                new CustomError(
                    'Forbidden: Only superadmin can perform this action',
                    403,
                ),
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

// -------------------- ADMIN OR SUPERADMIN MIDDLEWARE --------------------
export const adminOrSuperadminOnly = async (
    req: any,
    _res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.user) {
            return next(new CustomError('Unauthorized', 401));
        }

        const roleName = req.user.role;
        const normalizedRole = roleName?.toLowerCase?.();

        // Superadmin always allowed.
        if (normalizedRole === 'superadmin') {
            return next();
        }

        // Allow any admin-type role from DB (covers admin, subadmin, verifyDocAdmin, etc.)
        const role = await DB.Roles.findOne({ where: { roleName } });
        if (role?.roleType === 'admin') {
            return next();
        }

        return next(
            new CustomError(
                'Forbidden: Only admin or superadmin can perform this action',
                403,
            ),
        );
    } catch (error) {
        next(error);
    }
};

/** Only `superadmin` or built-in `admin` (by role name). Matches frontend isBuiltInAdmin for cognitive tests. */
export const superadminOrBuiltInAdminOnly = async (
    req: any,
    _res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.user) {
            return next(new CustomError('Unauthorized', 401));
        }
        const n = req.user.role?.toLowerCase?.();
        if (n === 'superadmin' || n === 'admin') {
            return next();
        }
        return next(
            new CustomError(
                'Forbidden: Only admin or superadmin can perform this action',
                403,
            ),
        );
    } catch (error) {
        next(error);
    }
};

export const studentRoleOnly = async (
    req: any,
    _res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.user) {
            return next(new CustomError('Unauthorized', 401));
        }
        if (req.user.role?.toLowerCase?.() !== 'student') {
            return next(new CustomError('Forbidden: Students only', 403));
        }
        next();
    } catch (error) {
        next(error);
    }
};

// -------------------- COURSE ADMIN OR SUPERADMIN MIDDLEWARE --------------------
export const courseAdminOrSuperadminOnly = async (
    req: any,
    _res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.user) {
            return next(new CustomError('Unauthorized', 401));
        }

        const roleName = req.user.role;

        // ⭐ Superadmin bypasses (case-insensitive check)
        if (roleName?.toLowerCase() === 'superadmin') {
            return next();
        }

        // Load role from DB to check roleType
        const role = await DB.Roles.findOne({ where: { roleName } });
        if (!role) {
            return next(
                new CustomError(
                    'Forbidden: Only CourseAdmin or superAdmin can create courses',
                    403,
                ),
            );
        }

        // Check if user is CourseAdmin (case-insensitive) with admin roleType
        if (
            roleName?.toLowerCase() === 'courseadmin' &&
            role.roleType === 'admin'
        ) {
            return next();
        }

        return next(
            new CustomError(
                'Forbidden: Only CourseAdmin or superAdmin can create courses',
                403,
            ),
        );
    } catch (error) {
        next(error);
    }
};
