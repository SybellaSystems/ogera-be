import logger from "@/utils/logger";
import Sequelize from "sequelize";

import userModel from "./models/user.model";
import rolesModel from "./models/roles.model";
import jobModel from "./models/job.model";
import { setupAssociations } from "@/association/index";

import {
  DB_DIALECT,
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USERNAME,
  NODE_ENV,
} from "@/config";


const sequelize = new Sequelize.Sequelize(
  DB_NAME!,
  DB_USERNAME!,
  DB_PASSWORD,
  {
    dialect: DB_DIALECT as Sequelize.Dialect,
    host: DB_HOST,
    port: parseInt(DB_PORT!, 10),
    timezone: "+09:00",
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
      underscored: true,
      freezeTableName: true,
    },
    pool: { min: 0, max: 5 },
    logging: (query, time) => logger.info(time + "ms " + query),
    benchmark: true,
  }
);

// Test DB connection
sequelize
  .authenticate()
  .then(() => logger.info("✅ Database connected"))
  .catch((err) => logger.error("❌ Database connection error:", err));

// Initialize models
const Users = userModel(sequelize);
const Roles = rolesModel(sequelize);
const Jobs = jobModel(sequelize);

// Apply Associations
setupAssociations();


// Sync DB
sequelize
  .sync({ alter: true })
  .then(() => logger.info("✅ Database synced"))
  .catch((err) => logger.error("❌ Database sync error:", err));

export const DB = {
  Users,
  Roles,
  Jobs,
  sequelize,
  Sequelize,
};
