import { Notification } from '../models/notification.model';
import { User } from '../models/index.ts';

// Helper to create a notification
export const createNotification = async (
  user_id: number,
  type: 'task_assigned' | 'message' | 'role_request' | 'status_change',
  title: string,
  body: string,
  roadmap_id?: number | null,
  task_id?: number | null
) => {
  try {
    await Notification.create({ user_id, type, title, body, roadmap_id: roadmap_id ?? null, task_id: task_id ?? null });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

import { Op } from 'sequelize';

// GET /api/notifications — all for logged-in user
export const getNotifications = async (req: any, res: any): Promise<void> => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Auto-delete notifications for this user older than 24 hours
    await Notification.destroy({
      where: {
        user_id: req.user.id,
        createdAt: {
          [Op.lt]: oneDayAgo
        }
      }
    });

    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(notifications);
  } catch (err) {
    console.error('Failed to get notifications:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /api/notifications/:id/read
export const markRead = async (req: any, res: any): Promise<void> => {
  await Notification.update({ read: true }, { where: { id: req.params.id, user_id: req.user.id } });
  res.json({ success: true });
};

// PUT /api/notifications/read-all
export const markAllRead = async (req: any, res: any): Promise<void> => {
  await Notification.update({ read: true }, { where: { user_id: req.user.id } });
  res.json({ success: true });
};
// DELETE /api/notifications/:id
export const deleteNotification = async (req: any, res: any): Promise<void> => {
  await Notification.destroy({ where: { id: req.params.id, user_id: req.user.id } });
  res.json({ success: true });
};

// DELETE /api/notifications
export const clearNotifications = async (req: any, res: any): Promise<void> => {
  await Notification.destroy({ where: { user_id: req.user.id } });
  res.json({ success: true });
};
