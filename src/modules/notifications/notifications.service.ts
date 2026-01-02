import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------
  // Simple wrapper so other modules can call sendNotification()
  // ----------------------------------------------------
  async sendNotification(params: {
    userId: string;
    message: string;
    appointmentId?: string;
    type?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        message: params.message,
        appointmentId: params.appointmentId || null,
        type: params.type || 'INFO',
      },
    });
  }

  // Direct creation (used internally)
  async createNotification(userId: string, message: string, appointmentId?: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        message,
        appointmentId: appointmentId || null,
        type: "INFO",
      },
    });
  }

  // Get notifications of a user
  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
    });
  }

  // Mark notification as read
  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
