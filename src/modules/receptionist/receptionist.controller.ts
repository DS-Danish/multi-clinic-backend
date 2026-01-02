import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReceptionistService } from './receptionist.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CreateBillDto } from './dto/create-bill.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@Controller('receptionist')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(Role.RECEPTIONIST)
export class ReceptionistController {
  constructor(private readonly service: ReceptionistService) {}

  // -------------------- Clinics --------------------------
  @Get('clinics')
  getClinics(@GetUser('userId') userId: string) {
    return this.service.getClinics(userId);
  }

  @Get('my-clinic')
  getMyClinic(@GetUser('userId') userId: string) {
    return this.service.getMyClinic(userId);
  }

  // ----------------- Doctors in Clinic (ORIGINAL ROUTE) -------------------
  @Get('clinics/:clinicId/doctors')
  getClinicDoctors(
    @Param('clinicId') clinicId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.service.getClinicDoctors(clinicId, userId);
  }

  // ----------------- Doctors in Clinic (FRONTEND EXPECTED ROUTE) ---------
  @Get('clinic-doctors/:clinicId')
  getDoctorsAlternate(
    @Param('clinicId') clinicId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.service.getClinicDoctors(clinicId, userId);
  }

  // ---------------- Doctor Availability -------------------
  @Get('doctors/:doctorId/availability')
  getDoctorAvailability(
    @Param('doctorId') doctorId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.service.getDoctorAvailability(doctorId, userId);
  }

  // -------------------- Patients -------------------------
  @Get('patients')
  listPatients(@GetUser('userId') userId: string) {
    return this.service.listPatients(userId);
  }

  // ------------------ Appointments ------------------------
  @Post('appointments')
  createAppointment(
    @Body() dto: CreateAppointmentDto,
    @GetUser('userId') userId: string,
  ) {
    return this.service.createAppointment(dto, userId);
  }

  @Get('appointments/pending')
  listPending(@GetUser('userId') userId: string) {
    return this.service.listPendingAppointments(userId);
  }

  @Patch('appointments/:id/accept')
  acceptAppointment(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.service.acceptAppointment(id, userId);
  }

  @Patch('appointments/:id/complete')
  completeAppointment(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.service.completeAppointment(id, userId);
  }

  @Patch('appointments/:id/cancel')
  cancelAppointment(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.service.cancelAppointment(id, userId);
  }

  @Patch('appointments/:id')
  updateAppointment(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @GetUser('userId') userId: string,
  ) {
    return this.service.updateAppointment(id, dto, userId);
  }

  // ---------------------- Billing -------------------------
  @Post('bills')
  createBill(
    @Body() dto: CreateBillDto,
    @GetUser('userId') userId: string,
  ) {
    return this.service.createBill(dto, userId);
  }

  @Post('payments')
  recordPayment(
    @Body() dto: RecordPaymentDto,
    @GetUser('userId') userId: string,
  ) {
    return this.service.recordPayment(dto, userId);
  }
}
