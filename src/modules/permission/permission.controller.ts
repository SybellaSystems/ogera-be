import { Request, Response } from 'express';
import { PermissionService } from './permission.service';
import { StatusCodes } from 'http-status-codes';
import { CustomError } from '@/utils/custom-error';

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
        throw new CustomError(
            error.message || 'Failed to create permission',
            StatusCodes.BAD_REQUEST,
        );
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
        throw new CustomError(
            error.message || 'Failed to retrieve permissions',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
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
        throw new CustomError(
            error.message || 'Failed to retrieve permission',
            StatusCodes.NOT_FOUND,
        );
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
        throw new CustomError(
            error.message || 'Failed to update permission',
            StatusCodes.BAD_REQUEST,
        );
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
        throw new CustomError(
            error.message || 'Failed to delete permission',
            StatusCodes.BAD_REQUEST,
        );
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
        throw new CustomError(
            error.message || 'Failed to retrieve routes',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};


