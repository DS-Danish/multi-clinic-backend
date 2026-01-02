import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { CreateClinicWithAdminDto } from './dto/create-clinic-with-admin.dto';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RoleGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post('create-clinic-with-admin')
  @Roles(Role.SYSTEM_ADMIN)
  createClinicWithAdmin(@Body() dto: CreateClinicWithAdminDto) {
    return this.superAdminService.createClinicWithAdmin(dto);
  }

  // ⭐ NEW ENDPOINT — RETURN ALL CLINICS WITH COUNTS
  @Get('clinics')
  @Roles(Role.SYSTEM_ADMIN)
  getAllClinics() {
    return this.superAdminService.getAllClinics();
  }

  // ⭐ NEW ENDPOINT — MANUALLY VERIFY USER EMAIL
  @Patch('verify-user/:userId')
  @Roles(Role.SYSTEM_ADMIN)
  verifyUserEmail(@Param('userId') userId: string) {
    return this.superAdminService.verifyUserEmail(userId);
  }
}
