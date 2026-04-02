import { Router } from 'express';
import { getBoards, getBoardById, createBoard, updateBoard, deleteBoard, shareBoard } from '../controllers/board.controller.ts';

const router = Router();

router.get('/', getBoards);
router.get('/:id', getBoardById);
router.post('/', createBoard);
router.put('/:id', updateBoard);
router.put('/:id/share', shareBoard);
router.delete('/:id', deleteBoard);

export default router;
