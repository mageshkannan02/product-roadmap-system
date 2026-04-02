import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import type { Optional } from 'sequelize';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Product Manager' | 'Team Member';
  refreshToken?: string;
  refreshTokenExpires?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'Admin' | 'Product Manager' | 'Team Member';
  public refreshToken?: string;
  public refreshTokenExpires?: Date;
}

export const initUser = () => {
  User.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('Admin', 'Product Manager', 'Team Member'), defaultValue: 'Team Member' },
    refreshToken: { type: DataTypes.STRING, allowNull: true },
    refreshTokenExpires: { type: DataTypes.DATE, allowNull: true }
  }, { sequelize, modelName: 'User' });
};
