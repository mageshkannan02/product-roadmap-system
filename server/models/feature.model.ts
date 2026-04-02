import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import type { Optional } from 'sequelize';

export interface FeatureAttributes {
  id: number;
  roadmap_id: number;
  title: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Planned' | 'In Progress' | 'Completed' | 'Blocked';
  deadline?: Date;
  created_by?: number;
}

interface FeatureCreationAttributes extends Optional<FeatureAttributes, 'id'> {}

export class Feature extends Model<FeatureAttributes, FeatureCreationAttributes> implements FeatureAttributes {
  public id!: number;
  public roadmap_id!: number;
  public title!: string;
  public priority!: 'Low' | 'Medium' | 'High' | 'Critical';
  public status!: 'Planned' | 'In Progress' | 'Completed' | 'Blocked';
  public deadline!: Date;
  public created_by!: number;
}

export const initFeature = () => {
  Feature.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    roadmap_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    priority: { type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), defaultValue: 'Medium' },
    status: { type: DataTypes.ENUM('Planned', 'In Progress', 'Completed', 'Blocked'), defaultValue: 'Planned' },
    deadline: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true }
  }, { sequelize, modelName: 'Feature' });
};
