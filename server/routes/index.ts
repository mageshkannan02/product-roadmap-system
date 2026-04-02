import { Router } from 'express';
import authRoutes from './auth.routes.ts';
import userRoutes from './user.routes.ts';
import roadmapRoutes from './roadmap.routes.ts';
import featureRoutes from './feature.routes.ts';
import milestoneRoutes from './milestone.routes.ts';
import taskRoutes from './task.routes.ts';
import boardRoutes from './board.routes.ts';
import logRoutes from './log.routes.ts';
import notificationRoutes from './notification.routes.ts';
import noteRoutes from './note.routes.ts';
import aiRoutes from './ai.routes.ts';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/roadmaps', authenticate, roadmapRoutes);
router.use('/features', authenticate, featureRoutes);
router.use('/milestones', authenticate, milestoneRoutes);
router.use('/tasks', authenticate, taskRoutes);
router.use('/boards', authenticate, boardRoutes);
router.use('/logs', authenticate, logRoutes);
router.use('/notifications', authenticate, notificationRoutes);
router.use('/notes', authenticate, noteRoutes);
router.use('/ai', authenticate, aiRoutes);

export default router;
