import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import type { Optional } from 'sequelize';

export interface TaskAttributes {
  id: number;
  feature_id: number;
  assigned_user_id: number | null;
  title: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  deadline: Date | null;
  created_by?: number;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public feature_id!: number;
  public assigned_user_id!: number | null;
  public title!: string;
  public status!: 'To Do' | 'In Progress' | 'Review' | 'Done';
  public deadline!: Date | null;
  public created_by!: number;
}

export const initTask = () => {
  Task.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    feature_id: { type: DataTypes.INTEGER, allowNull: false },
    assigned_user_id: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('To Do', 'In Progress', 'Review', 'Done'), defaultValue: 'To Do' },
    deadline: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true }
  }, { sequelize, modelName: 'Task' });
};
