import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CreateBillDto } from './dto/create-bill.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReceptionistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationsService,
  ) {}

  // -------------------- Helper: Get Receptionist's Clinic ID --------------------------
  private async getReceptionistClinicId(receptionistId: string): Promise<string> {
    const clinicReceptionist = await this.prisma.clinicReceptionist.findFirst({
      where: { receptionistId },
      select: { clinicId: true },
    });

    if (!clinicReceptionist) {
      throw new NotFoundException('Receptionist is not assigned to any clinic');
    }

    return clinicReceptionist.clinicId;
  }

  // -------------------- Clinics --------------------------
  async getClinics(receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    return this.prisma.clinic.findMany({
      where: { id: clinicId },
      select: { id: true, name: true },
    });
  }

  async getMyClinic(receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    return this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        isActive: true,
      },
    });
  }

  // ------------------ Clinic → Doctors -------------------
  async getClinicDoctors(clinicId: string, receptionistId: string) {
    const receptionistClinicId = await this.getReceptionistClinicId(receptionistId);
    
    if (clinicId !== receptionistClinicId) {
      throw new ForbiddenException('You can only access doctors from your assigned clinic');
    }

    return this.prisma.clinicDoctor.findMany({
      where: { clinicId },
      select: {
        doctor: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // -------------------- Doctor Availability ---------------
  async getDoctorAvailability(doctorId: string, receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    // Verify doctor belongs to receptionist's clinic
    const clinicDoctor = await this.prisma.clinicDoctor.findFirst({
      where: { clinicId, doctorId },
    });

    if (!clinicDoctor) {
      throw new ForbiddenException('This doctor does not belong to your clinic');
    }

    return this.prisma.staffSchedule.findMany({
      where: { userId: doctorId },
      select: {
        dayOfWeek: true,
        startTime: true,
        endTime: true,
      },
    });
  }

  // -------------------- Patients --------------------------
  async listPatients(receptionistId: string) {
    // Patients are shared across all clinics, so return all patients
    return this.prisma.user.findMany({
      where: { role: 'PATIENT' },
      select: { id: true, name: true, email: true, phone: true },
    });
  }

  // ------------------ Create Appointment -------------------
  async createAppointment(dto: CreateAppointmentDto, receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    // Ensure receptionist can only create appointments for their clinic
    if (dto.clinicId && dto.clinicId !== clinicId) {
      throw new ForbiddenException('You can only create appointments for your assigned clinic');
    }

    // Verify doctor belongs to this clinic
    const clinicDoctor = await this.prisma.clinicDoctor.findFirst({
      where: { clinicId, doctorId: dto.doctorId },
    });

    if (!clinicDoctor) {
      throw new BadRequestException('This doctor does not belong to your clinic');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    // Exact conflict
    const existing = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        clinicId,
        startTime,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'This doctor already has an appointment at this exact time.',
      );
    }

    // Overlap conflict
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        clinicId,
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        'This appointment overlaps with another scheduled appointment.',
      );
    }

    // Create Appointment
    const appt = await this.prisma.appointment.create({
      data: {
        clinicId,
        doctorId: dto.doctorId,
        patientId: dto.patientId,
        startTime,
        endTime,
        notes: dto.notes || '',
        status: 'PENDING',
      },
    });

    // Send notification to patient
    await this.notification.sendNotification({
      userId: dto.patientId,
      appointmentId: appt.id,
      type: 'APPOINTMENT_CREATED',
      message: `Your appointment request is submitted for ${startTime.toLocaleString()}.`,
    });

    return appt;
  }

  // ------------------ Pending Appointments ----------------
  async listPendingAppointments(receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    return this.prisma.appointment.findMany({
      where: { 
        status: 'PENDING',
        clinicId,
      },
      include: { patient: true, doctor: true },
      orderBy: { startTime: 'asc' },
    });
  }

  // -------------------- Accept ----------------------------
  async acceptAppointment(id: string, receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    // Verify appointment belongs to receptionist's clinic
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.clinicId !== clinicId) {
      throw new ForbiddenException('You can only accept appointments from your clinic');
    }

    // Verify appointment is in PENDING status
    if (appointment.status !== 'PENDING') {
      throw new BadRequestException('Only pending appointments can be accepted');
    }

    const appt = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'SCHEDULED' },
      include: { patient: true, doctor: true, clinic: true },
    });

    await this.notification.sendNotification({
      userId: appt.patientId,
      appointmentId: appt.id,
      type: 'APPOINTMENT_ACCEPTED',
      message: `Your appointment on ${appt.startTime.toLocaleString()} has been accepted.`,
    });

    return appt;
  }

  // -------------------- Complete ----------------------------
  async completeAppointment(id: string, receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    // Verify appointment belongs to receptionist's clinic
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.clinicId !== clinicId) {
      throw new ForbiddenException('You can only complete appointments from your clinic');
    }

    // Verify appointment is in SCHEDULED status
    if (appointment.status !== 'SCHEDULED') {
      throw new BadRequestException('Only scheduled appointments can be completed');
    }

    const appt = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: { patient: true, doctor: true, clinic: true },
    });

    await this.notification.sendNotification({
      userId: appt.patientId,
      appointmentId: appt.id,
      type: 'APPOINTMENT_COMPLETED',
      message: `Your appointment on ${appt.startTime.toLocaleString()} has been completed.`,
    });

    return appt;
  }

  // -------------------- Cancel ----------------------------
  async cancelAppointment(id: string, receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    // Verify appointment belongs to receptionist's clinic
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.clinicId !== clinicId) {
      throw new ForbiddenException('You can only cancel appointments from your clinic');
    }

    const appt = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { patient: true },
    });

    await this.notification.sendNotification({
      userId: appt.patientId,
      appointmentId: appt.id,
      type: 'APPOINTMENT_CANCELLED',
      message: `Your appointment on ${appt.startTime.toLocaleString()} has been cancelled.`,
    });

    return appt;
  }

  // -------------------- Update ----------------------------
  async updateAppointment(id: string, dto: UpdateAppointmentDto, receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    // Verify appointment belongs to receptionist's clinic
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.clinicId !== clinicId) {
      throw new ForbiddenException('You can only update appointments from your clinic');
    }

    // If time is being updated, check for conflicts
    if (dto.startTime || dto.endTime) {
      const startTime = dto.startTime ? new Date(dto.startTime) : appointment.startTime;
      const endTime = dto.endTime ? new Date(dto.endTime) : appointment.endTime;

      // Check for exact time conflict
      const existing = await this.prisma.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          clinicId,
          startTime,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          'This doctor already has an appointment at this exact time.',
        );
      }

      // Check for overlapping conflict
      const overlapping = await this.prisma.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          clinicId,
          id: { not: id },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      });

      if (overlapping) {
        throw new BadRequestException(
          'This appointment overlaps with another scheduled appointment.',
        );
      }
    }

    const appt = await this.prisma.appointment.update({
      where: { id },
      data: {
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        notes: dto.notes ?? undefined,
      },
      include: { patient: true },
    });

    await this.notification.sendNotification({
      userId: appt.patientId,
      appointmentId: appt.id,
      type: 'APPOINTMENT_UPDATED',
      message: `Your appointment has been updated.`,
    });

    return appt;
  }

  // -------------------- Billing ---------------------------
  async createBill(dto: CreateBillDto, receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    // Verify appointment belongs to receptionist's clinic
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });

    if (!appointment || appointment.clinicId !== clinicId) {
      throw new ForbiddenException('You can only create bills for appointments in your clinic');
    }

    return this.prisma.bill.create({ data: dto });
  }

  async recordPayment(dto: RecordPaymentDto, receptionistId: string) {
    const clinicId = await this.getReceptionistClinicId(receptionistId);
    
    // Verify bill belongs to receptionist's clinic through appointment
    const bill = await this.prisma.bill.findUnique({
      where: { id: dto.billId },
      include: { appointment: true },
    });

    if (!bill || bill.appointment.clinicId !== clinicId) {
      throw new ForbiddenException('You can only record payments for bills in your clinic');
    }

    return this.prisma.payment.create({ data: dto });
  }
}
