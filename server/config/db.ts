import { Sequelize, DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import path from 'path';
import 'dotenv/config';

let sequelize: Sequelize;

if (process.env.DB_DIALECT === 'postgres') {
  console.log('Connecting to PostgreSQL database...');
  sequelize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD!,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Required for Render's managed PostgreSQL.
        }
      }
    }
  );
} else {
  // Default to SQLite for local development to avoid MySQL connection errors.
  console.log('Connecting to local SQLite database...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'database.sqlite'),
    logging: false,
  });
}

export { sequelize, DataTypes, Model };
export type { Optional };