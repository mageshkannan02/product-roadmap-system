import { Request, Response } from 'express';
import { Roadmap, Feature, Milestone, Task, User, Board, sequelize } from '../models/index.ts';
import { createNotification } from './notification.controller';

export const getRoadmaps = async (req: any, res: any): Promise<void> => {
  const roadmaps = await Roadmap.findAll({
    include: [
      { 
        model: Feature, 
        as: 'features',
        include: [
          { model: User, as: 'assignees', attributes: ['id', 'name'] },
          { model: User, as: 'creator', attributes: ['id', 'name'] },
          { model: Task, as: 'tasks', include: [
            { model: User, as: 'assignee', attributes: ['id', 'name'] },
            { model: User, as: 'creator', attributes: ['id', 'name'] }
          ] }
        ]
      },
      { model: Milestone, as: 'milestones' },
      { model: User, as: 'members', attributes: ['id', 'name', 'role'] },
      { model: User, as: 'creator', attributes: ['id', 'name'] }
    ]
  });

  const userId = req.user.id;
  const userRole = req.user.role;
  const { view } = req.query;
  const isOverview = view === 'overview';

  const filteredRoadmaps = roadmaps.filter((r: any) => {
    // Admins see all
    if (userRole === 'Admin') return true;
    
    // Product Managers: see projects they created OR are members of
    if (userRole === 'Product Manager') {
      return r.created_by === userId || r.members?.some((m: any) => m.id === userId);
    }
    
    // Team Members: check project membership or feature/task assignment
    if (r.members?.some((m: any) => m.id === userId)) return true;
    const inFeatures = r.features?.some((f: any) =>
      f.assignees?.some((a: any) => a.id === userId) ||
      f.tasks?.some((t: any) => t.assigned_user_id === userId)
    );
    return inFeatures;
  }).map((r: any) => {
    // For Team Members: strictly filter tasks and only keep relevant features
    // UNLESS we are in overview mode (Project Overview page)
    if (userRole === 'Team Member' && !isOverview) {
      const json = r.toJSON() as any;
      return {
        ...json,
        features: (json.features || []).map((f: any) => ({
          ...f,
          tasks: (f.tasks || []).filter((t: any) => t.assigned_user_id === userId)
        })).filter((f: any) => 
          f.assignees?.some((a: any) => a.id === userId) || 
          f.tasks.length > 0
        )
      };
    }
    return r;
  });

  res.json(filteredRoadmaps);
};

export const getRoadmapById = async (req: any, res: any): Promise<any> => {
  const roadmap = await Roadmap.findByPk(req.params.id, {
    include: [
      { 
        model: Feature, 
        as: 'features',
        include: [
          { model: Task, as: 'tasks', include: [
            { model: User, as: 'assignee', attributes: ['id', 'name'] },
            { model: User, as: 'creator', attributes: ['id', 'name'] }
          ] },
          { model: User, as: 'assignees', attributes: ['id', 'name'] },
          { model: User, as: 'creator', attributes: ['id', 'name'] }
        ]
      },
      { model: Milestone, as: 'milestones' },
      { model: User, as: 'members', attributes: ['id', 'name', 'role'] },
      { model: User, as: 'creator', attributes: ['id', 'name'] }
    ]
  });

  if (roadmap) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { view } = req.query;
    const isOverview = view === 'overview';
    
    let hasAccess = false;
    if (userRole === 'Admin') hasAccess = true;
    else if (roadmap.created_by === userId) hasAccess = true;
    else if ((roadmap as any).members?.some((m: any) => m.id === userId)) hasAccess = true;
    else {
      hasAccess = (roadmap as any).features?.some((f: any) => 
        f.assignees?.some((a: any) => a.id === userId) ||
        f.tasks?.some((t: any) => t.assigned_user_id === userId)
      );
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this project.' });
    }

    // For Team Members: filter the features/tasks shown in the single roadmap as well
    // UNLESS we are in overview mode (Project Overview page)
    if (userRole === 'Team Member' && !isOverview) {
      const json = roadmap.toJSON() as any;
      const filtered = {
        ...json,
        features: (json.features || []).map((f: any) => ({
          ...f,
          tasks: (f.tasks || []).filter((t: any) => t.assigned_user_id === userId)
        })).filter((f: any) => 
          f.assignees?.some((a: any) => a.id === userId) || 
          f.tasks.length > 0
        )
      };
      return res.json(filtered);
    }

    res.json(roadmap);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};

export const createRoadmap = async (req: any, res: any): Promise<any> => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Product Manager') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const roadmap = await Roadmap.create({ ...req.body, created_by: req.user.id || req.body.created_by });
  
  // Automatically add creator as a member
  await (roadmap as any).addMember(req.user.id);
  
  res.json(roadmap);
};

export const updateRoadmap = async (req: any, res: any): Promise<any> => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Product Manager') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const roadmap = await Roadmap.findByPk(req.params.id);
  if (roadmap) {
    await roadmap.update(req.body);
    res.json(roadmap);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};

export const deleteRoadmap = async (req: any, res: any): Promise<any> => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Product Manager') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const roadmap = await Roadmap.findByPk(req.params.id);
  if (roadmap) {
    await roadmap.destroy();
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};

// Add a member to a roadmap
export const addMember = async (req: any, res: any): Promise<any> => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Product Manager') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const roadmap = await Roadmap.findByPk(req.params.id);
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });
    const user = await User.findByPk(req.body.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await (roadmap as any).addMember(user);
    // Notify added user
    if ((user as any).id !== req.user.id) {
      await createNotification(
        (user as any).id, 'message',
        'Added to Project',
        `You have been added to the project: "${(roadmap as any).title}"`,
        roadmap.id, null
      );
    }
    const updated = await Roadmap.findByPk(req.params.id, {
      include: [{ model: User, as: 'members', attributes: ['id', 'name', 'role'] }]
    });
    res.json(updated?.get('members'));
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

// Remove a member from a roadmap
export const removeMember = async (req: any, res: any): Promise<any> => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Product Manager') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const roadmap = await Roadmap.findByPk(req.params.id, {
      include: [{ model: Feature, as: 'features' }]
    });
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });
    
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Remove from Roadmap mapping
    await (roadmap as any).removeMember(user);

    // Cascading Unassignment 
    // If they are removed from the project, they should no longer be assigned to its features or tasks.
    const featureIds = (roadmap as any).features?.map((f: any) => f.id) || [];
    if (featureIds.length > 0) {
      // Remove from all feature assignees using the sequelize models directly for robustness
      if (sequelize.models.FeatureAssignments) {
        await sequelize.models.FeatureAssignments.destroy({
          where: { feature_id: featureIds, user_id: user.id }
        });
      }
      
      // Remove from all task assignments within these features
      await Task.update(
        { assigned_user_id: null },
        { where: { feature_id: featureIds, assigned_user_id: user.id } }
      );
    }

    // Also remove from any Boards associated with this roadmap
    const boards = await Board.findAll({ where: { roadmap_id: (roadmap as any).id } });
    const boardIds = boards.map((b: any) => b.id);
    if (boardIds.length > 0 && sequelize.models.BoardMembers) {
      await sequelize.models.BoardMembers.destroy({
        where: { board_id: boardIds, user_id: user.id }
      });
    }

    // Notify removed user
    if ((user as any).id !== req.user.id) {
      await createNotification(
        (user as any).id, 'message',
        'Removed from Project',
        `You have been removed from the project: "${(roadmap as any).title}"`,
        roadmap.id, null
      );
    }
    res.json({ message: 'Member removed successfully and cascading unassignments applied.' });

  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
