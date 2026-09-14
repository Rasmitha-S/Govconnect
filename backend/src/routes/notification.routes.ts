import { Router, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(authenticate);

// List notifications for logged-in citizen/officer
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: notifications,
  });
});

// Mark single notification as read
router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const notif = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notif) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    return;
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });

  res.status(200).json({
    success: true,
    data: updated,
  });
});

// Mark all as read
router.post('/read-all', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  res.status(200).json({
    success: true,
    data: { message: 'All notifications marked as read.' },
  });
});

export default router;
