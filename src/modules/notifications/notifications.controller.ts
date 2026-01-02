import { Controller, Get, Param } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";

@Controller("notifications")
export class NotificationController {
  constructor(private prisma: PrismaService) {}

  @Get(":userId")
  async getUserNotifications(@Param("userId") userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: "desc" },
    });
  }
}
