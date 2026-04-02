import { Request, Response } from 'express';
import { User, RoleRequest } from '../models/index.ts';
import { createNotification } from './notification.controller';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign(
      { id: user.id, role: user.role, originalRole: user.role, name: user.name }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();
    res.json({ token, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, originalRole: user.role } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role: role || 'Team Member' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
export const switchRole = async (req: any, res: Response): Promise<void> => {
  const { role } = req.body;
  if (!['Admin', 'Product Manager', 'Team Member'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.role = role;
    await user.save();
    const token = jwt.sign(
      { id: user.id, role: user.role, originalRole: req.user.originalRole || user.role, name: user.name }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();
    res.json({ token, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, originalRole: req.user.originalRole || user.role } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createRoleRequest = async (req: any, res: Response): Promise<void> => {
  const { requested_role, description } = req.body;
  try {
    const request = await RoleRequest.create({
      user_id: req.user.id,
      requested_role,
      description,
      status: 'Pending'
    });
    const managers = await User.findAll({ where: { role: ['Admin', 'Product Manager'] } });
    for (const manager of managers) {
      await createNotification(manager.id, 'role_request', 'New Role Request', `${req.user.name} has requested the ${requested_role} role.`);
    }
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPendingRequests = async (req: any, res: Response): Promise<void> => {
  try {
    const requests = await RoleRequest.findAll({
      where: { status: 'Pending' },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateRequestStatus = async (req: any, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body;
  try {
    const request = await RoleRequest.findByPk(id);
    if (!request) { res.status(404).json({ error: 'Request not found' }); return; }
    request.status = status;
    request.decided_by = req.user.id;
    if (status === 'Rejected' && rejection_reason) {
      request.rejection_reason = rejection_reason;
    }
    await request.save();
    const targetUser = await User.findByPk(request.user_id);
    if (targetUser) {
      if (status === 'Approved') { 
        targetUser.role = request.requested_role as any; 
        await targetUser.save(); 
      }
      
      const statusTitle = `Role Request ${status}`;
      const statusMsg = status === 'Approved' 
        ? `Your request for the ${request.requested_role} role has been approved.` 
        : `Your request for the ${request.requested_role} role was rejected. ${rejection_reason ? `Reason: ${rejection_reason}` : ''}`;
      
      await createNotification(targetUser.id, 'role_request', statusTitle, statusMsg);
    }
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyPendingRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const request = await RoleRequest.findOne({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteMyRequest = async (req: any, res: Response): Promise<void> => {
  try {
    await RoleRequest.destroy({ where: { user_id: req.user.id } });
    res.json({ message: 'Request deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }
  try {
    const user = await User.findOne({ where: { refreshToken } });
    if (!user || !user.refreshTokenExpires || user.refreshTokenExpires < new Date()) {
      res.status(403).json({ error: 'Invalid or expired refresh token' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, originalRole: user.role, name: user.name }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();
    res.json({ token, refreshToken: newRefreshToken });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
