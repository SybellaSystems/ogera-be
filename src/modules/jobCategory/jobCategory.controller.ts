import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
    createCategoryService,
    getAllCategoriesService,
    getCategoryByIdService,
    updateCategoryService,
    deleteCategoryService,
} from './jobCategory.service';

const response = new ResponseFormat();

export const createCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const category = await createCategoryService(
            req.body,
            req.user.role,
        );
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            category,
            'Category created successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getAllCategories = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const categories = await getAllCategoriesService();
        response.response(
            res,
            true,
            StatusCodes.OK,
            categories,
            'Categories retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getCategoryById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const category = await getCategoryByIdService(req.params.id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            category,
            'Category retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.NOT_FOUND,
            false,
            error.message,
        );
    }
};

export const updateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.user) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const category = await updateCategoryService(
            req.params.id,
            req.body,
            req.user.role,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            category,
            'Category updated successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.BAD_REQUEST,
            false,
            error.message,
        );
    }
};

export const deleteCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.user) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const result = await deleteCategoryService(
            req.params.id,
            req.user.role,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Category deleted successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.NOT_FOUND,
            false,
            error.message,
        );
    }
};

