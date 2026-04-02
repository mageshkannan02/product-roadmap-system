import { Router } from 'express';
import { createNote, getNotesByFeature, getNotesByTask } from '../controllers/note.controller';

const router = Router();

router.post('/', createNote);
router.get('/feature/:featureId', getNotesByFeature);
router.get('/task/:taskId', getNotesByTask);

export default router;
