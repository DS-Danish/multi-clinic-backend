import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { AddReceptionistDto } from './dto/add-receptionist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@Controller('clinics')
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.SYSTEM_ADMIN)
  create(@Body() dto: CreateClinicDto) {
    return this.clinicService.create(dto);
  }

  @Get()
  findAll() {
    return this.clinicService.findAll();
  }

  @Get('my-clinic')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.CLINIC_ADMIN)
  getMyClinic(@GetUser('userId') adminId: string) {
    return this.clinicService.getMyClinic(adminId);
  }

  @Post(':clinicId/receptionist')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.CLINIC_ADMIN)
  addReceptionist(
    @Param('clinicId') clinicId: string,
    @Body() dto: AddReceptionistDto,
    @GetUser('userId') adminId: string,
  ) {
    return this.clinicService.addReceptionist(clinicId, dto, adminId);
  }
}
