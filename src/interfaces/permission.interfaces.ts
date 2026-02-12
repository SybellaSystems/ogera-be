export interface Permission {
    edit: boolean;
    view: boolean;
    create: boolean;
    delete: boolean;
}

export interface ApiPermission {
    id: string;
    api_name: string;
    route: string;
    permission: Permission;
    created_at: Date;
    updated_at: Date;
}

export interface CreatePermissionDTO {
    api_name: string;
    route: string;
    permission: Permission;
}

export interface UpdatePermissionDTO {
    api_name?: string;
    route?: string;
    permission?: Permission;
}


