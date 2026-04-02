import { Request, Response } from 'express';
import { Note, User } from '../models/index';

export const createNote = async (req: any, res: any): Promise<void> => {
  try {
    const { content, feature_id, task_id } = req.body;
    const author_id = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!feature_id && !task_id) {
      return res.status(400).json({ error: 'Either Feature ID or Task ID must be provided' });
    }

    const note = await Note.create({
      content,
      author_id,
      feature_id: feature_id ? parseInt(feature_id) : null,
      task_id: task_id ? parseInt(task_id) : null
    });

    const detailedNote = await Note.findByPk(note.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }]
    });

    res.status(201).json(detailedNote);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotesByFeature = async (req: any, res: any): Promise<void> => {
  try {
    const notes = await Note.findAll({
      where: { feature_id: req.params.featureId },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotesByTask = async (req: any, res: any): Promise<void> => {
  try {
    const notes = await Note.findAll({
      where: { task_id: req.params.taskId },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
