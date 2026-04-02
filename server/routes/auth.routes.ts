import { Router } from 'express';
import { login, register, switchRole, createRoleRequest, getPendingRequests, updateRequestStatus, getMyPendingRequest, deleteMyRequest, refresh } from '../controllers/auth.controller.ts';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/switch-role', authenticate, switchRole);
router.post('/refresh', refresh);

// Role Request Routes
router.post('/role-request', authenticate, createRoleRequest);
router.get('/role-requests/pending', authenticate, getPendingRequests);
router.get('/role-requests/my', authenticate, getMyPendingRequest);
router.delete('/role-requests/my', authenticate, deleteMyRequest);
router.put('/role-requests/:id', authenticate, updateRequestStatus);

export default router;
