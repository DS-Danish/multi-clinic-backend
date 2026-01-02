import { Module } from '@nestjs/common';
import { ReceptionistService } from './receptionist.service';
import { ReceptionistController } from './receptionist.controller';
import { PrismaService } from 'src/database/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule, // 👈 REQUIRED FIX
  ],
  controllers: [ReceptionistController],
  providers: [ReceptionistService, PrismaService],
})
export class ReceptionistModule {}
