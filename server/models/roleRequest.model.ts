import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export class RoleRequest extends Model {
  declare id: number;
  declare user_id: number;
  declare requested_role: 'Admin' | 'Product Manager';
  declare description: string;
  declare status: 'Pending' | 'Approved' | 'Rejected';
  declare decided_by: number | null;
  declare rejection_reason: string | null;
}

export const initRoleRequest = () => {
  RoleRequest.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      requested_role: { type: DataTypes.ENUM('Admin', 'Product Manager'), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' },
      decided_by: { type: DataTypes.INTEGER, allowNull: true },
      rejection_reason: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, modelName: 'RoleRequest', tableName: 'RoleRequests', timestamps: true }
  );
};
