import { Router } from 'express';
import { getRoadmaps, getRoadmapById, createRoadmap, updateRoadmap, deleteRoadmap, addMember, removeMember } from '../controllers/roadmap.controller.ts';
import { getMessages, sendMessage } from '../controllers/message.controller.ts';

const router = Router();

router.get('/', getRoadmaps);
router.post('/', createRoadmap);
router.get('/:id', getRoadmapById);
router.put('/:id', updateRoadmap);
router.delete('/:id', deleteRoadmap);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
