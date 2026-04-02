import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import type { Optional } from 'sequelize';

export interface MilestoneAttributes {
  id: number;
  roadmap_id: number;
  name: string;
  due_date: Date;
}

interface MilestoneCreationAttributes extends Optional<MilestoneAttributes, 'id'> {}

export class Milestone extends Model<MilestoneAttributes, MilestoneCreationAttributes> implements MilestoneAttributes {
  public id!: number;
  public roadmap_id!: number;
  public name!: string;
  public due_date!: Date;
}

export const initMilestone = () => {
  Milestone.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    roadmap_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    due_date: { type: DataTypes.DATE }
  }, { sequelize, modelName: 'Milestone' });
};
