import { Router } from 'express';
import { chatWithLumina } from '../controllers/ai.controller';

const router = Router();

// Any authenticated user can chat with Lumina
router.post('/chat', chatWithLumina);

export default router;
