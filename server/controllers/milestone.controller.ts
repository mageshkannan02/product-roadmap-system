import { Request, Response } from 'express';
import { Milestone } from '../models/index.ts';

export const createMilestone = async (req: any, res: any): Promise<any> => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Product Manager') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const milestone = await Milestone.create(req.body);
  res.json(milestone);
};
