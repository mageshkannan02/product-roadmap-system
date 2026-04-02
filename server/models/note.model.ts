import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import type { Optional } from 'sequelize';

export interface NoteAttributes {
  id: number;
  content: string;
  author_id: number;
  feature_id?: number | null;
  task_id?: number | null;
  created_at?: Date;
}

interface NoteCreationAttributes extends Optional<NoteAttributes, 'id'> {}

export class Note extends Model<NoteAttributes, NoteCreationAttributes> implements NoteAttributes {
  public id!: number;
  public content!: string;
  public author_id!: number;
  public feature_id!: number | null;
  public task_id!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initNote = () => {
  Note.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    feature_id: { type: DataTypes.INTEGER, allowNull: true },
    task_id: { type: DataTypes.INTEGER, allowNull: true }
  }, { 
    sequelize, 
    modelName: 'Note',
    tableName: 'Notes',
    underscored: true
  });
};
