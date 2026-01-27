"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleRepository = void 0;
const roles_model_1 = require("../../database/models/roles.model");
class RoleRepository {
    createRole(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return roles_model_1.RoleModel.create(data);
        });
    }
    getAllRoles() {
        return __awaiter(this, void 0, void 0, function* () {
            return roles_model_1.RoleModel.findAll();
        });
    }
    getRoleById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return roles_model_1.RoleModel.findOne({ where: { id } });
        });
    }
    getRoleByName(roleName) {
        return __awaiter(this, void 0, void 0, function* () {
            return roles_model_1.RoleModel.findOne({ where: { roleName } });
        });
    }
    updateRole(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return roles_model_1.RoleModel.update(data, { where: { id } });
        });
    }
    deleteRole(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return roles_model_1.RoleModel.destroy({ where: { id } });
        });
    }
}
exports.RoleRepository = RoleRepository;
