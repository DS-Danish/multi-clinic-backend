import { Controller, Get, Param, Post, Body, Query, UseGuards, Patch, Put, Delete } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
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

  // ===========================
  // APPOINTMENT REPORTS
  // ===========================

  // Create report for appointment (doctor only)
  @Post(':appointmentId/report')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.DOCTOR)
  async createReport(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CreateReportDto,
    @GetUser('userId') doctorId: string,
  ) {
    return this.appointmentService.createAppointmentReport(
      appointmentId,
      doctorId,
      dto,
    );
  }

  // Update report for appointment (doctor only)
  @Put(':appointmentId/report')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.DOCTOR)
  async updateReport(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateReportDto,
    @GetUser('userId') doctorId: string,
  ) {
    return this.appointmentService.updateAppointmentReport(
      appointmentId,
      doctorId,
      dto,
    );
  }

  // Get report for a specific appointment (doctor or patient)
  @Get(':appointmentId/report')
  @UseGuards(JwtAuthGuard)
  async getReport(
    @Param('appointmentId') appointmentId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.appointmentService.getAppointmentReport(appointmentId, userId);
  }

  // Get all reports for a patient
  @Get('patient/:patientId/reports')
  @UseGuards(JwtAuthGuard)
  async getPatientReports(@Param('patientId') patientId: string) {
    return this.appointmentService.getPatientReports(patientId);
  }

  // Get all reports created by a doctor
  @Get('doctor/:doctorId/reports')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.DOCTOR)
  async getDoctorReports(@Param('doctorId') doctorId: string) {
    return this.appointmentService.getDoctorReports(doctorId);
  }

  // Delete report for appointment (doctor only)
  @Delete(':appointmentId/report')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.DOCTOR)
  async deleteReport(
    @Param('appointmentId') appointmentId: string,
    @GetUser('userId') doctorId: string,
  ) {
    return this.appointmentService.deleteAppointmentReport(
      appointmentId,
      doctorId,
    );
  }
}
