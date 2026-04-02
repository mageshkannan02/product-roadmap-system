import { Router } from 'express';
import { getUsers } from '../controllers/user.controller.ts';

const router = Router();

router.get('/', getUsers);

export default router;
