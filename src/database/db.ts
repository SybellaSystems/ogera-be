import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { UserModel } from '../models/users.model.js';
import { StudentProfileModel } from '../models/studentProfile.model.js';
import { RecordModel } from '../models/records.model.js';
import { EmployerProfileModel } from '../models/employerProfile.js';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    dialect: 'postgres',
    logging: (sql, timing) => {
      console.log(`${timing}ms: ${sql}`);
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

// Test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

const models = {
  User: UserModel,
  StudentProfile: StudentProfileModel,
  EmployerProfile :EmployerProfileModel,
  AcademicRecord: RecordModel
};

// Initialize models
Object.values(models).forEach((model: any) => {
  if(model.initialize) {
    model.initialize(sequelize);
  }
});

// Setup all associations after initialization
Object.values(models).forEach((model: any) => {
  if(model.associate) {
    model.associate(models);
  }
});

// Explicitly declare DB types
const DB: {
  User: typeof UserModel;
  StudentProfile: typeof StudentProfileModel;
  EmployerProfile: typeof EmployerProfileModel;
  AcademicRecord: typeof RecordModel;
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
} = {
  User: UserModel,
  StudentProfile: StudentProfileModel,
  EmployerProfile: EmployerProfileModel,
  AcademicRecord: RecordModel,
  sequelize,
  Sequelize,
};

// Auto-create tables
sequelize
  .sync({ alter: true })
  .then(() => console.log('Database synchronized.'))
  .catch((err) => console.error('Database synchronization failed:', err));

export default DB;
