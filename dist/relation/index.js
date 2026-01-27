"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyRelations = void 0;
const applyRelations = (DB) => {
    const { Users, Jobs } = DB;
    // One employer (User) can have many jobs
    Users.hasMany(Jobs, { foreignKey: "employer_id", as: "jobs" });
    // A job belongs to one employer (User)
    Jobs.belongsTo(Users, { foreignKey: "employer_id", as: "employer" });
};
exports.applyRelations = applyRelations;
