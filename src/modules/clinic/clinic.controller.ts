import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { AddReceptionistDto } from './dto/add-receptionist.dto';
import { AddDoctorDto } from './dto/add-doctor.dto';
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

  @Post(':clinicId/doctor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.CLINIC_ADMIN)
  addDoctor(
    @Param('clinicId') clinicId: string,
    @Body() dto: AddDoctorDto,
    @GetUser('userId') adminId: string,
  ) {
    return this.clinicService.addDoctor(clinicId, dto, adminId);
  }

  @Get(':clinicId/doctors')
  @UseGuards(JwtAuthGuard)
  getDoctors(@Param('clinicId') clinicId: string) {
    return this.clinicService.getClinicDoctors(clinicId);
  }

  @Get(':clinicId/patients')
  @UseGuards(JwtAuthGuard)
  getPatients(@Param('clinicId') clinicId: string) {
    return this.clinicService.getClinicPatients(clinicId);
  }

  @Get(':clinicId/appointments')
  @UseGuards(JwtAuthGuard)
  getAppointments(@Param('clinicId') clinicId: string) {
    return this.clinicService.getClinicAppointments(clinicId);
  }

  @Get(':clinicId/receptionists')
  @UseGuards(JwtAuthGuard)
  getReceptionists(@Param('clinicId') clinicId: string) {
    return this.clinicService.getClinicReceptionists(clinicId);
  }
}
