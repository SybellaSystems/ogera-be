"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionChecker = void 0;
/**
 * Permission Checker Utility
 * Provides helper functions to check user permissions
 */
class PermissionChecker {
    /**
     * Check if a user has permission for a specific route and action
     * @param permissions - Array of route permissions
     * @param route - The route to check
     * @param action - The action to check (view, edit, create, delete)
     * @returns boolean - true if permission granted
     */
    static hasPermission(permissions, route, action) {
        if (!permissions || !Array.isArray(permissions)) {
            return false;
        }
        const routePermission = permissions.find(p => p.route === route);
        if (!routePermission) {
            return false;
        }
        return routePermission.permission[action] === true;
    }
    /**
     * Check if a user has ANY permission for a route
     * @param permissions - Array of route permissions
     * @param route - The route to check
     * @returns boolean - true if user has any permission for the route
     */
    static hasAnyPermission(permissions, route) {
        if (!permissions || !Array.isArray(permissions)) {
            return false;
        }
        const routePermission = permissions.find(p => p.route === route);
        if (!routePermission) {
            return false;
        }
        const { edit, view, create, delete: del } = routePermission.permission;
        return edit || view || create || del;
    }
    /**
     * Check if a user has ALL permissions for a route
     * @param permissions - Array of route permissions
     * @param route - The route to check
     * @returns boolean - true if user has full access
     */
    static hasFullAccess(permissions, route) {
        if (!permissions || !Array.isArray(permissions)) {
            return false;
        }
        const routePermission = permissions.find(p => p.route === route);
        if (!routePermission) {
            return false;
        }
        const { edit, view, create, delete: del } = routePermission.permission;
        return edit && view && create && del;
    }
    /**
     * Check if a user has read-only permission for a route
     * @param permissions - Array of route permissions
     * @param route - The route to check
     * @returns boolean - true if user has only view permission
     */
    static hasReadOnlyAccess(permissions, route) {
        if (!permissions || !Array.isArray(permissions)) {
            return false;
        }
        const routePermission = permissions.find(p => p.route === route);
        if (!routePermission) {
            return false;
        }
        const { edit, view, create, delete: del } = routePermission.permission;
        return view && !edit && !create && !del;
    }
    /**
     * Get all routes a user has access to
     * @param permissions - Array of route permissions
     * @returns string[] - Array of route names
     */
    static getAccessibleRoutes(permissions) {
        if (!permissions || !Array.isArray(permissions)) {
            return [];
        }
        return permissions
            .filter(p => this.hasAnyPermission(permissions, p.route))
            .map(p => p.route);
    }
    /**
     * Get all routes a user has a specific permission for
     * @param permissions - Array of route permissions
     * @param action - The action to check
     * @returns string[] - Array of route names
     */
    static getRoutesWithPermission(permissions, action) {
        if (!permissions || !Array.isArray(permissions)) {
            return [];
        }
        return permissions
            .filter(p => p.permission[action] === true)
            .map(p => p.route);
    }
    /**
     * Get permission details for a specific route
     * @param permissions - Array of route permissions
     * @param route - The route to check
     * @returns object with permission details or null
     */
    static getRoutePermissions(permissions, route) {
        if (!permissions || !Array.isArray(permissions)) {
            return null;
        }
        const routePermission = permissions.find(p => p.route === route);
        return routePermission ? routePermission.permission : null;
    }
    /**
     * Check multiple permissions at once
     * @param permissions - Array of route permissions
     * @param checks - Array of {route, action} objects to check
     * @returns boolean - true if ALL checks pass
     */
    static hasAllPermissions(permissions, checks) {
        return checks.every(check => this.hasPermission(permissions, check.route, check.action));
    }
    /**
     * Check if user has at least one of the specified permissions
     * @param permissions - Array of route permissions
     * @param checks - Array of {route, action} objects to check
     * @returns boolean - true if ANY check passes
     */
    static hasAnyOfPermissions(permissions, checks) {
        return checks.some(check => this.hasPermission(permissions, check.route, check.action));
    }
    /**
     * Parse permission_json string to RoutePermission array
     * @param permissionJson - String or array of permissions
     * @returns RoutePermission[] - Parsed permissions
     */
    static parsePermissions(permissionJson) {
        if (typeof permissionJson === 'string') {
            try {
                return JSON.parse(permissionJson);
            }
            catch (error) {
                console.error('Failed to parse permission_json:', error);
                return [];
            }
        }
        return Array.isArray(permissionJson) ? permissionJson : [];
    }
    /**
     * Create a permission filter for API responses
     * Filters out data based on user permissions
     * @param data - The data to filter
     * @param permissions - User's permissions
     * @param route - The route being accessed
     * @param action - The action being performed
     * @returns Filtered data or null if no permission
     */
    static filterByPermission(data, permissions, route, action) {
        if (!this.hasPermission(permissions, route, action)) {
            return null;
        }
        return data;
    }
    /**
     * Generate a permission summary for a role
     * @param permissions - Array of route permissions
     * @returns Object with summary statistics
     */
    static getPermissionSummary(permissions) {
        if (!permissions || !Array.isArray(permissions)) {
            return {
                totalRoutes: 0,
                fullAccessRoutes: 0,
                readOnlyRoutes: 0,
                noAccessRoutes: 0,
                partialAccessRoutes: 0,
            };
        }
        const totalRoutes = permissions.length;
        const fullAccessRoutes = permissions.filter(p => this.hasFullAccess(permissions, p.route)).length;
        const readOnlyRoutes = permissions.filter(p => this.hasReadOnlyAccess(permissions, p.route)).length;
        const noAccessRoutes = permissions.filter(p => !this.hasAnyPermission(permissions, p.route)).length;
        const partialAccessRoutes = totalRoutes - fullAccessRoutes - readOnlyRoutes - noAccessRoutes;
        return {
            totalRoutes,
            fullAccessRoutes,
            readOnlyRoutes,
            noAccessRoutes,
            partialAccessRoutes,
        };
    }
}
exports.PermissionChecker = PermissionChecker;
/**
 * Usage Examples:
 *
 * // Check single permission
 * const canEdit = PermissionChecker.hasPermission(userPermissions, "/users", "edit");
 *
 * // Check full access
 * const hasFullAccess = PermissionChecker.hasFullAccess(userPermissions, "/users");
 *
 * // Get all accessible routes
 * const routes = PermissionChecker.getAccessibleRoutes(userPermissions);
 *
 * // Check multiple permissions
 * const canManageUsers = PermissionChecker.hasAllPermissions(userPermissions, [
 *   { route: "/users", action: "view" },
 *   { route: "/users", action: "edit" }
 * ]);
 *
 * // Parse permissions from database
 * const permissions = PermissionChecker.parsePermissions(role.permission_json);
 *
 * // Get permission summary
 * const summary = PermissionChecker.getPermissionSummary(userPermissions);
 * console.log(`User has full access to ${summary.fullAccessRoutes} routes`);
 */
