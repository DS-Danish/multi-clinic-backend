import { Controller, Get, Param, Post, Body, Query, UseGuards, Patch } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // ===========================
  // CREATE APPOINTMENT (PATIENT)
  // ===========================
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.PATIENT)
  async create(
    @Body() dto: CreateAppointmentDto,
    @GetUser('userId') userId: string,
  ) {
    return this.appointmentService.createAppointment(dto, userId);
  }

  // ===========================
  // UPDATE APPOINTMENT (PATIENT)
  // ===========================
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.PATIENT)
  async updateAppointment(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @GetUser('userId') userId: string,
  ) {
    return this.appointmentService.updatePatientAppointment(id, dto, userId);
  }

  // ===========================
  // CANCEL APPOINTMENT (PATIENT)
  // ===========================
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.PATIENT)
  async cancelAppointment(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.appointmentService.cancelPatientAppointment(id, userId, timezone);
  }

  // Doctor's appointments
  @Get('doctor/:doctorId')
  async getDoctorAppointments(
    @Param('doctorId') doctorId: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.appointmentService.getDoctorAppointments(doctorId, timezone);
  }

  // Patient's appointments
  @Get('patient/:patientId')
  async getPatientAppointments(
    @Param('patientId') patientId: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.appointmentService.getPatientAppointments(patientId, timezone);
  }

  // All appointments (admin/receptionist)
  @Get()
  async getAll(@Query() query: GetAppointmentsDto) {
    return this.appointmentService.getAllAppointments(query);
  }
}
