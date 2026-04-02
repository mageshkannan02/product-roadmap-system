import express from 'express';
import { getNotifications, markRead, markAllRead, deleteNotification, clearNotifications } from '../controllers/notification.controller';

const router = express.Router();

// Auth is applied at the parent router level (routes/index.ts)
router.get('/', getNotifications);
router.delete('/', clearNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;
