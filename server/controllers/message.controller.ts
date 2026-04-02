import { Request, Response } from 'express';
import { Message, Roadmap, Feature, Task, User } from '../models/index.ts';
import { createNotification } from './notification.controller';

// Helper: check if user has access to a roadmap
const canAccessRoadmap = async (roadmapId: number, userId: number, userRole: string): Promise<boolean> => {
  if (userRole === 'Admin') return true;
  const roadmap = await Roadmap.findByPk(roadmapId, {
    include: [{ model: Feature, as: 'features', include: [
      { model: User, as: 'assignees', attributes: ['id'] },
      { model: Task, as: 'tasks', include: [{ model: User, as: 'assignee', attributes: ['id'] }] }
    ]}]
  });
  if (!roadmap) return false;
  if ((roadmap as any).created_by === userId) return true;
  return (roadmap as any).features?.some((f: any) =>
    f.assignees?.some((a: any) => a.id === userId) ||
    f.tasks?.some((t: any) => t.assignee?.id === userId)
  ) || false;
};

// Get messages for a specific roadmap
export const getMessages = async (req: any, res: any): Promise<any> => {
  try {
    const roadmapId = parseInt(req.params.id);
    const hasAccess = await canAccessRoadmap(roadmapId, req.user.id, req.user.role);
    if (!hasAccess) return res.status(403).json({ error: 'Forbidden: You do not have access to this project.' });

    const messages = await Message.findAll({
      where: { roadmap_id: roadmapId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send a new message
export const sendMessage = async (req: any, res: any): Promise<any> => {
  try {
    const { content } = req.body;
    const roadmap_id = parseInt(req.params.id);
    const sender_id = req.user.id;

    const hasAccess = await canAccessRoadmap(roadmap_id, sender_id, req.user.role);
    if (!hasAccess) return res.status(403).json({ error: 'Forbidden: You do not have access to this project.' });

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const message = await Message.create({ roadmap_id, sender_id, content: content.trim() });

    const completeMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }]
    });

    // Notify all relevant parties (two-way): members + roadmap creator + all admins
    const roadmapWithMembers = await Roadmap.findByPk(roadmap_id, {
      include: [{ model: User, as: 'members', attributes: ['id'] }]
    }) as any;
    const senderUser = await User.findByPk(sender_id, { attributes: ['name'] }) as any;
    const senderName = senderUser?.name || 'Someone';
    const projectTitle = roadmapWithMembers?.title || 'a project';
    const msgSnippet = `${senderName}: ${content.trim().substring(0, 80)}${content.trim().length > 80 ? '…' : ''}`;

    // Collect unique recipient IDs
    const recipientIds = new Set<number>();

    // Project members
    for (const m of (roadmapWithMembers?.members || [])) recipientIds.add(m.id);

    // Roadmap creator (PM/Admin who owns the project)
    if (roadmapWithMembers?.created_by) recipientIds.add(roadmapWithMembers.created_by);

    // All Admins
    const admins = await User.findAll({ where: { role: 'Admin' }, attributes: ['id'] }) as any[];
    for (const a of admins) recipientIds.add(a.id);

    // Send notification to everyone except the sender
    for (const uid of recipientIds) {
      if (uid !== sender_id) {
        await createNotification(uid, 'message', `New message in ${projectTitle}`, msgSnippet, roadmap_id, null);
      }
    }

    res.status(201).json(completeMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
