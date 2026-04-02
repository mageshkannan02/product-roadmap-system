import { Request, Response } from 'express';
import { ActivityLog, User } from '../models/index.ts';

export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  const { entity_type, entity_id } = req.params;
  
  if (!entity_type || !entity_id) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  try {
    const logs = await ActivityLog.findAll({
      where: {
        entity_type,
        entity_id: parseInt(entity_id)
      },
      include: [
        { model: User, as: 'user', attributes: ['name', 'id'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(logs);
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
