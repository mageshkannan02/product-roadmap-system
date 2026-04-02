import { Router } from 'express';
import { getActivityLogs } from '../controllers/log.controller.ts';

const router = Router();

router.get('/:entity_type/:entity_id', getActivityLogs);

export default router;
