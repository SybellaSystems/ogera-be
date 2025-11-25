export interface Permission {
  edit: boolean;
  view: boolean;
  create: boolean;
  delete: boolean;
}

export interface RoutePermission {
  route: string;
  permission: Permission;
}

export interface Role {
  id: string;
  roleName: string;
  permission_json: RoutePermission[] | string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoleDTO {
  roleName: string;
  permission_json: RoutePermission[];
}
