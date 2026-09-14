import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

export class NotificationService {
  /**
   * Creates an in-app notification and simulates multi-channel SMS/Email delivery
   */
  public static async notifyUser(
    userId: string,
    title: string,
    message: string,
    type: string,
    relatedApplicationId?: string
  ) {
    try {
      const notif = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          relatedApplicationId: relatedApplicationId || null,
        },
      });

      logger.info({ userId, type, title }, 'Dispatched citizen notification');
      return notif;
    } catch (err) {
      logger.error({ err, userId }, 'Failed to create notification');
    }
  }
}
