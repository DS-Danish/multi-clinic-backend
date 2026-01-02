import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------
  // CREATE APPOINTMENT (with conflicts)
  // -----------------------------------
  async createAppointment(dto: any, patientId: string) {
    // Verify patient exists
    const patient = await this.prisma.user.findUnique({
      where: { id: patientId },
    });

    if (!patient || patient.role !== 'PATIENT') {
      throw new BadRequestException('Patient not found or invalid user type');
    }

    // Verify clinic exists
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: dto.clinicId },
    });

    if (!clinic) {
      throw new BadRequestException('Clinic not found');
    }

    // Verify doctor belongs to this clinic
    const clinicDoctor = await this.prisma.clinicDoctor.findFirst({
      where: {
        clinicId: dto.clinicId,
        doctorId: dto.doctorId,
      },
    });

    if (!clinicDoctor) {
      throw new BadRequestException('This doctor does not work at this clinic');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    // 1️⃣ Exact-time conflict
    const existing = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        clinicId: dto.clinicId,
        startTime,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'This doctor already has an appointment at this exact time.'
      );
    }

    // 2️⃣ Overlapping conflict
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        clinicId: dto.clinicId,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        'This appointment overlaps with an existing appointment.'
      );
    }

    // 3️⃣ Create appointment
    return this.prisma.appointment.create({
      data: {
        clinicId: dto.clinicId,
        doctorId: dto.doctorId,
        patientId: patientId,
        startTime,
        endTime,
        notes: dto.notes || '',
        status: 'PENDING', // Patient-created appointments start as PENDING
      },
    });
  }

  // -----------------------------------
  // Doctor appointments
  // -----------------------------------
  async getDoctorAppointments(doctorId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { 
        doctorId,
        status: {
          in: ['SCHEDULED', 'COMPLETED'], // Exclude PENDING and CANCELLED
        },
      },
      orderBy: { startTime: 'asc' },
      include: {
        patient: true,
        clinic: true,
      },
    });

    return appointments.map((a) => ({
      id: a.id,
      patientName: a.patient.name,
      clinicName: a.clinic.name,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      notes: a.notes,
      priority: a.priority,
    }));
  }

  // -----------------------------------
  // Patient appointments
  // -----------------------------------
  async getPatientAppointments(patientId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { startTime: 'asc' },
      include: {
        doctor: true,
        clinic: true,
      },
    });

    return appointments.map((a) => ({
      id: a.id,
      doctorName: a.doctor.name,
      clinicName: a.clinic.name,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      notes: a.notes,
      priority: a.priority,
    }));
  }

  // -----------------------------------
  // All appointments
  // -----------------------------------
  async getAllAppointments(query?: { status?: string }) {
    const whereClause: any = {};

    // Apply status filter if provided
    if (query?.status) {
      whereClause.status = query.status;
    }

    return this.prisma.appointment.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
      include: {
        doctor: true,
        patient: true,
        clinic: true,
      },
    });
  }

  // -----------------------------------
  // Cancel Patient Appointment
  // -----------------------------------
  async cancelPatientAppointment(appointmentId: string, patientId: string) {
    // Find the appointment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        clinic: true,
      },
    });

    // Verify appointment exists
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify patient owns this appointment
    if (appointment.patientId !== patientId) {
      throw new ForbiddenException('You can only cancel your own appointments');
    }

    // Verify appointment is not already cancelled or completed
    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('This appointment is already cancelled');
    }

    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    // Update appointment status to cancelled
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
      include: {
        doctor: true,
        clinic: true,
      },
    });
  }

  // -----------------------------------
  // Update Patient Appointment
  // -----------------------------------
  async updatePatientAppointment(
    appointmentId: string,
    dto: any,
    patientId: string,
  ) {
    // Find the appointment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        clinic: true,
      },
    });

    // Verify appointment exists
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify patient owns this appointment
    if (appointment.patientId !== patientId) {
      throw new ForbiddenException('You can only update your own appointments');
    }

    // Verify appointment is not cancelled or completed
    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('Cannot update a cancelled appointment');
    }

    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot update a completed appointment');
    }

    const startTime = dto.startTime ? new Date(dto.startTime) : appointment.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : appointment.endTime;

    // If time is being updated, check for conflicts
    if (dto.startTime || dto.endTime) {
      // Check for exact time conflict
      const existing = await this.prisma.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          clinicId: appointment.clinicId,
          startTime,
          id: { not: appointmentId },
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
          clinicId: appointment.clinicId,
          id: { not: appointmentId },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      });

      if (overlapping) {
        throw new BadRequestException(
          'This appointment overlaps with an existing appointment.',
        );
      }
    }

    // Update appointment
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        notes: dto.notes ?? undefined,
      },
      include: {
        doctor: true,
        clinic: true,
      },
    });
  }
}
