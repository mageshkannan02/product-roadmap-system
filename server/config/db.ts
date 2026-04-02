import { Sequelize, DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import path from 'path';
import 'dotenv/config';

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT as any,
    logging: false,
  }
);

export { sequelize, DataTypes, Model };
export type { Optional };