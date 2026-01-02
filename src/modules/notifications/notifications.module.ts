import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationController } from './notifications.controller';
import { PrismaService } from 'src/database/prisma.service';


@Module({
  controllers: [NotificationController],
  providers: [NotificationsService, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
