import { Request, Response } from 'express';
import { Task, Feature, Roadmap, User, ActivityLog } from '../models/index.ts';
import { createNotification } from './notification.controller';

const logActivity = async (entity_type: 'Feature' | 'Task', entity_id: number, user_id: number, action: 'created' | 'status_change' | 'deleted', old_status?: string | null, new_status?: string | null, description?: string | null) => {
  try {
    await ActivityLog.create({ entity_type, entity_id, user_id, action, old_status: old_status ?? null, new_status: new_status ?? null, description: description ?? null });
  } catch (err) {
    console.error('ActivityLog Error:', err);
  }
};

export const getTasks = async (req: any, res: any): Promise<void> => {
  const userId = req.user.id;
  const userRole = req.user.role;

  const tasks = await Task.findAll({
    include: [
      { 
        model: Feature, 
        attributes: ['title', 'roadmap_id'],
        include: [{ model: Roadmap, as: 'Roadmap', attributes: ['created_by'] }] 
      },
      { model: User, as: 'assignee', attributes: ['name'] },
      { model: User, as: 'creator', attributes: ['id', 'name'] }
    ]
  });

  const filteredTasks = tasks.filter((t: any) => {
    if (userRole === 'Admin') return true;
    if (t.assigned_user_id === userId) return true;
    // Product Managers can see tasks in Roadmaps they created
    if (userRole === 'Product Manager' && t.Feature?.Roadmap?.created_by === userId) return true;
    return false;
  });

  res.json(filteredTasks);
};

export const createTask = async (req: any, res: any): Promise<void> => {
  if (req.user.role === 'Team Member') {
    res.status(403).json({ error: 'Forbidden: Team Members cannot create tasks.' });
    return;
  }
  const task = await Task.create({ ...req.body, created_by: req.user.id });
  await logActivity('Task', task.id, req.user.id, 'created', null, task.status, req.body.description);
  // Notify assigned user
  if (req.body.assigned_user_id && req.body.assigned_user_id !== req.user.id) {
    await createNotification(
      req.body.assigned_user_id,
      'task_assigned',
      'New Task Assigned',
      `You have been assigned: "${req.body.title}"`,
      null,
      task.id
    );
  }
  res.json(task);
};

export const updateTask = async (req: any, res: any): Promise<void> => {
  const task = await Task.findByPk(req.params.id);
  if (task) {
    const oldStatus = task.status;
    const newStatus = req.body.status;

    await task.update(req.body);

    if (newStatus && oldStatus !== newStatus) {
      await logActivity('Task', task.id, req.user.id, 'status_change', oldStatus, newStatus, req.body.description);
    }

    // Auto-complete feature if all sibling tasks are Done
    if (newStatus === 'Done' && task.feature_id) {
      const siblingTasks = await Task.findAll({ where: { feature_id: task.feature_id } });
      const allDone = siblingTasks.every((t: any) => t.status === 'Done');
      if (allDone) {
        const feature = await Feature.findByPk(task.feature_id);
        if (feature && feature.status !== 'Completed') {
          await feature.update({ status: 'Completed' });
          await logActivity('Feature', feature.id, req.user.id, 'status_change', feature.status, 'Completed', 'Auto-completed: all tasks finished');
        }
      }
    }

    // Notify if task reassigned to a new user
    const newAssignee = req.body.assigned_user_id;
    if (newAssignee && newAssignee !== task.assigned_user_id && newAssignee !== req.user.id) {
      await createNotification(
        newAssignee,
        'task_assigned',
        'Task Assigned to You',
        `You have been assigned: "${task.title}"`,
        null,
        task.id
      );
    }

    res.json(task);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};

export const deleteTask = async (req: any, res: any): Promise<void> => {
  const task = await Task.findByPk(req.params.id);
  if (task) {
    await logActivity('Task', task.id, req.user.id, 'deleted', task.status, null);
    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};
