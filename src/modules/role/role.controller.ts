import { Request, Response } from "express";
import { RoleService } from "./role.service";

const roleService = new RoleService();

export class RoleController {
  async createRole(req: Request, res: Response) {
    try {
      const role = await roleService.createRole(req.body);
      res.status(201).json({ message: "Role created successfully", data: role });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getAllRoles(req: Request, res: Response) {
    try {
      const roles = await roleService.getAllRoles();
      res.status(200).json(roles);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getRoleById(req: Request, res: Response) {
    try {
      const role = await roleService.getRoleById(req.params.id);
      res.status(200).json(role);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const updated = await roleService.updateRole(req.params.id, req.body);
      res.status(200).json({ message: "Role updated successfully", data: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async deleteRole(req: Request, res: Response) {
    try {
      await roleService.deleteRole(req.params.id);
      res.status(200).json({ message: "Role deleted successfully" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
