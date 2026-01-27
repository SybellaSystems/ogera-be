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
exports.PermissionRepository = void 0;
const permission_model_1 = require("../../database/models/permission.model");
class PermissionRepository {
    createPermission(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return permission_model_1.PermissionModel.create(data);
        });
    }
    getAllPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            return permission_model_1.PermissionModel.findAll({
                order: [['created_at', 'DESC']],
            });
        });
    }
    getPermissionById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return permission_model_1.PermissionModel.findOne({ where: { id } });
        });
    }
    getPermissionByApiName(api_name) {
        return __awaiter(this, void 0, void 0, function* () {
            return permission_model_1.PermissionModel.findOne({ where: { api_name } });
        });
    }
    updatePermission(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return permission_model_1.PermissionModel.update(data, { where: { id } });
        });
    }
    deletePermission(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return permission_model_1.PermissionModel.destroy({ where: { id } });
        });
    }
}
exports.PermissionRepository = PermissionRepository;
