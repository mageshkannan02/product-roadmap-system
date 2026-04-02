import { Router } from 'express';
import { createFeature, updateFeature, deleteFeature } from '../controllers/feature.controller.ts';

const router = Router();

router.post('/', createFeature);
router.put('/:id', updateFeature);
router.delete('/:id', deleteFeature);

export default router;
