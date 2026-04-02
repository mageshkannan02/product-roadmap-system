import { Request, Response } from 'express';
import { Feature, User, ActivityLog } from '../models/index.ts';
import { createNotification } from './notification.controller';

const logActivity = async (entity_type: 'Feature' | 'Task', entity_id: number, user_id: number, action: 'created' | 'status_change' | 'deleted', old_status?: string | null, new_status?: string | null, description?: string | null) => {
  try {
    await ActivityLog.create({ entity_type, entity_id, user_id, action, old_status: old_status ?? null, new_status: new_status ?? null, description: description ?? null });
  } catch (err) {
    console.error('ActivityLog Error:', err);
  }
};

export const createFeature = async (req: any, res: any): Promise<any> => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Product Manager') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const feature = await Feature.create({ ...req.body, created_by: req.user.id });
  if (req.body.assignees && Array.isArray(req.body.assignees)) {
    await (feature as any).setAssignees(req.body.assignees);
  }
  await logActivity('Feature', feature.id, req.user.id, 'created', null, feature.status, req.body.description);
  const updatedFeature = await Feature.findByPk(feature.id, {
    include: [
      { model: User, as: 'assignees', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'name'] }
    ]
  });
  // Notify each assignee
  if (req.body.assignees && Array.isArray(req.body.assignees)) {
    for (const assigneeId of req.body.assignees) {
      if (parseInt(assigneeId) !== req.user.id) {
        await createNotification(
          parseInt(assigneeId), 'task_assigned',
          'Feature Assigned to You',
          `You have been assigned to feature: "${req.body.title}"`,
          req.body.roadmap_id ?? null, null
        );
      }
    }
  }
  res.json(updatedFeature);
};

export const updateFeature = async (req: any, res: any): Promise<void> => {
  const feature = await Feature.findByPk(req.params.id, {
    include: [{ model: User, as: 'assignees', attributes: ['id', 'name'] }]
  });
  if (feature) {
    const oldStatus = feature.status;
    const newStatus = req.body.status;
    const oldAssigneeIds = new Set<number>(((feature as any).assignees || []).map((a: any) => a.id));

    await feature.update(req.body);

    if (newStatus && oldStatus !== newStatus) {
      await logActivity('Feature', feature.id, req.user.id, 'status_change', oldStatus, newStatus, req.body.description);
    }

    if (req.body.assignees && Array.isArray(req.body.assignees)) {
      const newAssigneeIds = req.body.assignees.map((id: any) => parseInt(id));
      await (feature as any).setAssignees(newAssigneeIds);

      // Notify newly added assignees
      for (const id of newAssigneeIds) {
        if (!oldAssigneeIds.has(id) && id !== req.user.id) {
          await createNotification(id, 'task_assigned', 'Feature Assigned to You',
            `You have been assigned to feature: "${feature.title || req.body.title}"`,
            (feature as any).roadmap_id ?? null, null);
        }
      }
      // Notify removed assignees
      for (const id of oldAssigneeIds) {
        if (!newAssigneeIds.includes(id) && id !== req.user.id) {
          await createNotification(id, 'task_assigned', 'Removed from Feature',
            `You have been removed from feature: "${feature.title || req.body.title}"`,
            (feature as any).roadmap_id ?? null, null);
        }
      }
    }

    const updatedFeature = await Feature.findByPk(feature.id, {
      include: [{ model: User, as: 'assignees', attributes: ['id', 'name'] }]
    });
    res.json(updatedFeature);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};

export const deleteFeature = async (req: any, res: any): Promise<void> => {
  const feature = await Feature.findByPk(req.params.id);
  if (feature) {
    await logActivity('Feature', feature.id, req.user.id, 'deleted', feature.status, null);
    await feature.destroy();
    res.json({ message: 'Feature deleted successfully' });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};
