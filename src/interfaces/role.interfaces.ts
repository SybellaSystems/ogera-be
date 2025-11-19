export interface Role {
  id: string;
  roleName: "student" | "employer" | "admin";
  permission_json: string;
  created_at: Date;
  updated_at: Date;
}
