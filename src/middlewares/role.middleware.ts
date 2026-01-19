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

            // ⭐ Superadmin bypasses all permissions (case-insensitive)
            // Superadmin has full access to everything
            if (roleName?.toLowerCase() === 'superadmin') {
                return next();
            }

            // ⭐ Admin also bypasses all permissions
            if (roleName === 'admin' || roleName === 'subadmin') {
                return next();
            }

            // Load role from DB
            const role = await DB.Roles.findOne({ where: { roleName } });
            if (!role) {
                return next(new CustomError('Role not found', 403));
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

        // Check if user is superadmin (case-insensitive) or admin/subadmin
        if (
            roleName?.toLowerCase() !== 'superadmin' &&
            roleName !== 'admin' &&
            roleName !== 'subadmin'
        ) {
            return next(
                new CustomError(
                    'Forbidden: Only admin or superadmin can perform this action',
                    403,
                ),
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};