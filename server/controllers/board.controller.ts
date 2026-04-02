import { Request, Response } from 'express';
import { Board, Roadmap, User } from '../models/index.ts';

export const getBoards = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role === 'Admin') {
      const allBoards = await Board.findAll({
        include: [
          { model: Roadmap, as: 'roadmap', attributes: ['id', 'title'] },
          { model: User, as: 'shared_with', attributes: ['id', 'name', 'email'], through: { attributes: [] } }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json(allBoards);
      return;
    }

    const myBoards = await Board.findAll({
      where: { created_by: req.user.id },
      include: [
        { model: Roadmap, as: 'roadmap', attributes: ['id', 'title'] },
        { model: User, as: 'shared_with', attributes: ['id', 'name', 'email'], through: { attributes: [] } }
      ]
    });

    const sharedBoards = await Board.findAll({
      include: [
        { model: Roadmap, as: 'roadmap', attributes: ['id', 'title'] },
        { 
          model: User, 
          as: 'shared_with', 
          attributes: ['id', 'name', 'email'], 
          through: { attributes: [] },
          where: { id: req.user.id }
        }
      ]
    });

    const allBoardsMap = new Map();
    [...myBoards, ...sharedBoards].forEach(b => allBoardsMap.set(b.id, b));
    
    const boards = Array.from(allBoardsMap.values()).sort((a: any, b: any) => b.createdAt - a.createdAt);
    res.json(boards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBoardById = async (req: any, res: Response): Promise<void> => {
  try {
    const board = await Board.findByPk(req.params.id, {
      include: [
        { model: User, as: 'shared_with', attributes: ['id', 'name', 'email'], through: { attributes: [] } }
      ]
    });
    if (!board) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const isOwner = board.created_by === req.user.id;
    const isSharedToMe = (board as any).shared_with?.some((u: any) => u.id === req.user.id);
    const isAdmin = req.user.role === 'Admin';
    
    if (isOwner || isSharedToMe || isAdmin) {
      res.json(board);
    } else {
      res.status(403).json({ error: 'Not authorized' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createBoard = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role === 'Team Member') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const board = await Board.create({ ...req.body, created_by: req.user.id });
    res.json(board);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBoard = async (req: any, res: Response): Promise<void> => {
  try {
    const board = await Board.findByPk(req.params.id);
    if (!board) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    
    // Only the owner can edit or admin
    if (board.created_by === req.user.id || req.user.role === 'Admin') {
      await board.update(req.body);
      res.json(board);
    } else {
      res.status(403).json({ error: 'Not authorized to edit this board' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const shareBoard = async (req: any, res: Response): Promise<void> => {
  try {
    const board = await Board.findByPk(req.params.id);
    if (!board || (board.created_by !== req.user.id && req.user.role !== 'Admin')) {
      res.status(404).json({ error: 'Not found or unauthorized' });
      return;
    }
    
    const userIds = req.body.userIds || [];
    const users = await User.findAll({ where: { id: userIds } });
    await (board as any).setShared_with(users);
    
    const updatedBoard = await Board.findByPk(req.params.id, {
      include: [
        { model: User, as: 'shared_with', attributes: ['id', 'name', 'email'], through: { attributes: [] } }
      ]
    });
    res.json(updatedBoard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBoard = async (req: any, res: Response): Promise<void> => {
  try {
    const board = await Board.findByPk(req.params.id);
    if (!board || (board.created_by !== req.user.id && req.user.role !== 'Admin')) {
      res.status(404).json({ error: 'Not found or unauthorized' });
      return;
    }
    await board.destroy();
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
