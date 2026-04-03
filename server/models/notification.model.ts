import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export class Notification extends Model {
  declare id: number;
  declare user_id: number;
  declare type: 'task_assigned' | 'message' | 'role_request' | 'status_change';
  declare title: string;
  declare body: string;
  declare read: boolean;
  declare roadmap_id: number | null;
  declare task_id: number | null;
}

export const initNotification = () => {
  Notification.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.ENUM('task_assigned', 'message', 'role_request', 'status_change'), allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.TEXT },
      read: { type: DataTypes.BOOLEAN, defaultValue: false },
      roadmap_id: { type: DataTypes.INTEGER, allowNull: true },
      task_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    { sequelize, modelName: 'Notification', tableName: 'Notifications', timestamps: true }
  );
};
