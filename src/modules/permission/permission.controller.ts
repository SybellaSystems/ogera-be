import { Request, Response } from 'express';
import { PermissionService } from './permission.service';
import { StatusCodes } from 'http-status-codes';

const permissionService = new PermissionService();

export const createPermission = async (req: Request, res: Response) => {
    try {
        const permission = await permissionService.createPermission(req.body);
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Permission created successfully',
            data: permission,
        });
    } catch (error: any) {
        // Check if permission already exists - return existing one with helpful message
        if (error.message && error.message.includes('already exists')) {
            try {
                const existingPermission = await permissionService.getPermissionByApiName(req.body.api_name);
                if (existingPermission) {
                    // Return existing permission with a message suggesting to use update
                    return res.status(StatusCodes.CONFLICT).json({
                        success: false,
                        message: `Permission with API name '${req.body.api_name}' already exists. Please update the existing permission instead.`,
                        data: existingPermission,
                        errorCode: 'PERMISSION_ALREADY_EXISTS',
                    });
                }
            } catch (findError: any) {
                // If we can't find it, continue with original error
            }
        }
        
        // Return error response instead of throwing (prevents app crash)
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: error.message || 'Failed to create permission',
            error: error.message,
        });
    }
};

export const getAllPermissions = async (_req: Request, res: Response) => {
    try {
        const permissions = await permissionService.getAllPermissions();
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Permissions retrieved successfully',
            data: permissions,
        });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to retrieve permissions',
            error: error.message,
        });
    }
};

export const getPermissionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const permission = await permissionService.getPermissionById(id as string);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Permission retrieved successfully',
            data: permission,
        });
    } catch (error: any) {
        res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: error.message || 'Failed to retrieve permission',
            error: error.message,
        });
    }
};

export const updatePermission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const permission = await permissionService.updatePermission(id as string, req.body);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Permission updated successfully',
            data: permission,
        });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: error.message || 'Failed to update permission',
            error: error.message,
        });
    }
};

export const deletePermission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await permissionService.deletePermission(id as string);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Permission deleted successfully',
        });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: error.message || 'Failed to delete permission',
            error: error.message,
        });
    }
};

// Get all available routes (excluding auth routes)
export const getAllRoutes = async (_req: Request, res: Response) => {
    try {
        // List of all routes excluding auth routes
        const routes = [
            '/jobs',
            '/academic-verifications',
            '/notifications',
            '/roles',
            '/disputes',
            '/analytics',
            '/transactions',
            '/job-applications',
            '/trust-score',
            '/profile',
            '/users',
            '/courses',
        ];

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Routes retrieved successfully',
            data: routes,
        });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to retrieve routes',
            error: error.message,
        });
    }
};


