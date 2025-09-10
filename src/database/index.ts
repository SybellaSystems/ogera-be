// database/index.ts
import logger from '@/utils/logger';
import { Sequelize, Dialect } from 'sequelize';
import { UserModel } from './models/user.model';
import { StudentProfileModel } from './models/studentProfile.model';
import { EmployerProfileModel } from './models/employerProfile.model';
import { RecordModel } from './models/records.model';
import { JobModel } from './models/job.model';
import { applyRelations } from '@/relation/index';
import {
  DB_DIALECT,
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USERNAME,
  NODE_ENV,
} from '@/config';

// Create Sequelize instance
export const sequelize = new Sequelize(
  DB_NAME as string,
  DB_USERNAME as string,
  DB_PASSWORD,
  {
    dialect: (DB_DIALECT as Dialect) || 'postgres',
    host: DB_HOST ?? 'localhost',
    port: parseInt(DB_PORT as string, 10),
    timezone: '+09:00',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      underscored: true,
      freezeTableName: true,
    },
    pool: {
      min: 0,
      max: 10,
      acquire: 30000,
      idle: 10000,
    },
    logQueryParameters: NODE_ENV === 'development',
    logging: (query, time) => {
      logger.info(`${time}ms ${query}`);
    },
    benchmark: true,
  }
);

// Test DB connection
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error('❌ Database connection error: ', err);
  }
})();

// Collect models
const models = {
  User: UserModel,
  StudentProfile: StudentProfileModel,
  EmployerProfile: EmployerProfileModel,
  AcademicRecord: RecordModel,
  Jobs: JobModel,
};

// Initialize models
Object.values(models).forEach((model: any) => {
  if (model && typeof model.initialize === 'function') {
    model.initialize(sequelize);
  }
});

// Setup associations
// Object.values(models).forEach((model: any) => {
//   if (model && typeof model.associate === 'function') {
//     model.associate(models);
//   }
// });

// Apply extra relations with DBType
applyRelations({ ...models, sequelize, Sequelize });

// Explicitly declare DB types
export const DB: typeof models & {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
} = {
  ...models,
  sequelize,
  Sequelize,
};

// Sync models with DB
sequelize
  .sync({ alter: true })
  .then(() => logger.info('✅ Database synced'))
  .catch((err) => logger.error('❌ Database sync error: ', err));
