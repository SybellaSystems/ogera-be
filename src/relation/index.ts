import { JobModel } from "@/database/models/job.model";
import { UserModel } from "@/database/models/user.model"; 

type DBType = {
  Users: typeof UserModel;
  Jobs: typeof JobModel;
};

export const applyRelations = (DB: DBType): void => {
  const { Users, Jobs } = DB;

  // One employer (User) can have many jobs
  Users.hasMany(Jobs, { foreignKey: "employer_id", as: "jobs" });

  // A job belongs to one employer (User)
  Jobs.belongsTo(Users, { foreignKey: "employer_id", as: "employer" });
};
