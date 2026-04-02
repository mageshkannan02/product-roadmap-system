import { Request, Response } from 'express';
import { User } from '../models/index.ts';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
  res.json(users);
};
