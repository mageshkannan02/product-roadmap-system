import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import type { Optional } from 'sequelize';

export interface MessageAttributes {
  id: number;
  roadmap_id: number;
  sender_id: number;
  content: string;
  created_at?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id'> {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number;
  public roadmap_id!: number;
  public sender_id!: number;
  public content!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initMessage = () => {
  Message.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    roadmap_id: { type: DataTypes.INTEGER, allowNull: false },
    sender_id: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false }
  }, { sequelize, modelName: 'Message' });
};
