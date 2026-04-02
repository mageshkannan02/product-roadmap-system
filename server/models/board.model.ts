import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export interface BoardAttributes {
  id: number;
  title: string;
  nodes: string;
  edges: string;
  created_by: number;
  roadmap_id?: number | null;
  is_shared?: boolean;
}

interface BoardCreationAttributes extends Omit<BoardAttributes, 'id'> {}

export class Board extends Model<BoardAttributes, BoardCreationAttributes> implements BoardAttributes {
  public id!: number;
  public title!: string;
  public nodes!: string;
  public edges!: string;
  public created_by!: number;
  public roadmap_id!: number | null;
  public is_shared!: boolean;
}

export const initBoard = () => {
  Board.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Untitled Sketch' },
    nodes: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
    edges: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    roadmap_id: { type: DataTypes.INTEGER, allowNull: true },
    is_shared: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, { sequelize, modelName: 'Board' });
};
