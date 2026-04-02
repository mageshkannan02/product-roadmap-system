import { Router } from 'express';
import { createMilestone } from '../controllers/milestone.controller.ts';

const router = Router();

router.post('/', createMilestone);

export default router;
