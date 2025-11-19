import { RoleRepository } from "./role.repo";

export class RoleService {
  private repo = new RoleRepository();

  async createRole(payload: any) {
    // Convert permission_json array → string
    if (Array.isArray(payload.permission_json)) {
      payload.permission_json = JSON.stringify(payload.permission_json);
    }
    return this.repo.createRole(payload);
  }

  async getAllRoles() {
    return this.repo.getAllRoles();
  }

  async getRoleById(id: string) {
    const role = await this.repo.getRoleById(id);
    if (!role) throw new Error("Role not found");
    return role;
  }

  async updateRole(id: string, payload: any) {
    await this.getRoleById(id);

    if (Array.isArray(payload.permission_json)) {
      payload.permission_json = JSON.stringify(payload.permission_json);
    }

    await this.repo.updateRole(id, payload);
    return this.repo.getRoleById(id);
  }

  async deleteRole(id: string) {
    await this.getRoleById(id);
    return this.repo.deleteRole(id);
  }
}
