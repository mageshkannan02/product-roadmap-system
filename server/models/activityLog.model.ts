import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import type { Optional } from 'sequelize';

export interface ActivityLogAttributes {
  id: number;
  entity_type: 'Feature' | 'Task';
  entity_id: number;
  user_id: number;
  action: 'created' | 'status_change' | 'deleted';
  old_status: string | null;
  new_status: string | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes, 'id' | 'old_status' | 'new_status' | 'description'> {}

export class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  public id!: number;
  public entity_type!: 'Feature' | 'Task';
  public entity_id!: number;
  public user_id!: number;
  public action!: 'created' | 'status_change' | 'deleted';
  public old_status!: string | null;
  public new_status!: string | null;
  public description!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initActivityLog = () => {
  ActivityLog.init({
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    entity_type: { type: DataTypes.ENUM('Feature', 'Task'), allowNull: false },
    entity_id:   { type: DataTypes.INTEGER, allowNull: false },
    user_id:     { type: DataTypes.INTEGER, allowNull: false },
    action:      { type: DataTypes.ENUM('created', 'status_change', 'deleted'), allowNull: false, defaultValue: 'status_change' },
    old_status:  { type: DataTypes.STRING, allowNull: true },
    new_status:  { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true }
  }, { sequelize, modelName: 'ActivityLog' });
};
