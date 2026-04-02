import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import type { Optional } from 'sequelize';

export interface RoadmapAttributes {
  id: number;
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  created_by: number;
}

interface RoadmapCreationAttributes extends Optional<RoadmapAttributes, 'id'> {}

export class Roadmap extends Model<RoadmapAttributes, RoadmapCreationAttributes> implements RoadmapAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public start_date!: Date;
  public end_date!: Date;
  public status!: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  public created_by!: number;
}

export const initRoadmap = () => {
  Roadmap.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    start_date: { type: DataTypes.DATE },
    end_date: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('planning', 'in_progress', 'completed', 'on_hold'), defaultValue: 'planning' },
    created_by: { type: DataTypes.INTEGER, allowNull: false }
  }, { sequelize, modelName: 'Roadmap' });
};
