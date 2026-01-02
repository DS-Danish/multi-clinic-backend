import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { TimezoneUtil } from 'src/common/utils/timezone.util';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

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

    // Convert client timezone to UTC for database storage
    const timezone = dto.timezone || TimezoneUtil.DEFAULT_TIMEZONE;
    const startTime = TimezoneUtil.toUTC(dto.startTime, timezone);
    const endTime = TimezoneUtil.toUTC(dto.endTime, timezone);

    // 1️⃣ Exact-time conflict
    const existing = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        clinicId: dto.clinicId,
        startTime,
        status: { not: 'CANCELLED' },
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
        status: { not: 'CANCELLED' },
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
    const appointment = await this.prisma.appointment.create({
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

    // Return with timezone-aware dates
    return {
      ...appointment,
      startTime: TimezoneUtil.fromUTC(appointment.startTime, timezone),
      endTime: TimezoneUtil.fromUTC(appointment.endTime, timezone),
    };
  }

  // -----------------------------------
  // Doctor appointments
  // -----------------------------------
  async getDoctorAppointments(doctorId: string, timezone?: string) {
    const clientTimezone = timezone || TimezoneUtil.DEFAULT_TIMEZONE;
    
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
        appointmentReport: true,
      },
    });

    return appointments.map((a) => ({
      id: a.id,
      patientName: a.patient.name,
      clinicName: a.clinic.name,
      startTime: TimezoneUtil.fromUTC(a.startTime, clientTimezone),
      endTime: TimezoneUtil.fromUTC(a.endTime, clientTimezone),
      status: a.status,
      notes: a.notes,
      priority: a.priority,
      report: a.appointmentReport,
    }));
  }

  // -----------------------------------
  // Patient appointments
  // -----------------------------------
  async getPatientAppointments(patientId: string, timezone?: string) {
    const clientTimezone = timezone || TimezoneUtil.DEFAULT_TIMEZONE;
    
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { startTime: 'asc' },
      include: {
        doctor: true,
        clinic: true,
        appointmentReport: true,
      },
    });

    return appointments.map((a) => ({
      id: a.id,
      doctorName: a.doctor.name,
      clinicName: a.clinic.name,
      startTime: TimezoneUtil.fromUTC(a.startTime, clientTimezone),
      endTime: TimezoneUtil.fromUTC(a.endTime, clientTimezone),
      status: a.status,
      notes: a.notes,
      priority: a.priority,
      report: a.appointmentReport,
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
  async cancelPatientAppointment(appointmentId: string, patientId: string, timezone?: string) {
    const clientTimezone = timezone || TimezoneUtil.DEFAULT_TIMEZONE;
    
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
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
      include: {
        doctor: true,
        clinic: true,
      },
    });

    return {
      ...updated,
      startTime: TimezoneUtil.fromUTC(updated.startTime, clientTimezone),
      endTime: TimezoneUtil.fromUTC(updated.endTime, clientTimezone),
    };
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

    // Convert client timezone to UTC for database storage
    const timezone = dto.timezone || TimezoneUtil.DEFAULT_TIMEZONE;
    const startTime = dto.startTime 
      ? TimezoneUtil.toUTC(dto.startTime, timezone) 
      : appointment.startTime;
    const endTime = dto.endTime 
      ? TimezoneUtil.toUTC(dto.endTime, timezone) 
      : appointment.endTime;

    // If time is being updated, check for conflicts
    if (dto.startTime || dto.endTime) {
      // Check for exact time conflict
      const existing = await this.prisma.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          clinicId: appointment.clinicId,
          startTime,
          status: { not: 'CANCELLED' },
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
          status: { not: 'CANCELLED' },
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
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        startTime: dto.startTime ? startTime : undefined,
        endTime: dto.endTime ? endTime : undefined,
        notes: dto.notes ?? undefined,
      },
      include: {
        doctor: true,
        clinic: true,
      },
    });

    return {
      ...updated,
      startTime: TimezoneUtil.fromUTC(updated.startTime, timezone),
      endTime: TimezoneUtil.fromUTC(updated.endTime, timezone),
    };
  }

  // -----------------------------------
  // APPOINTMENT REPORTS
  // -----------------------------------

  // Create or update report for an appointment (doctor only)
  async createAppointmentReport(
    appointmentId: string,
    doctorId: string,
    dto: CreateReportDto,
  ) {
    // Verify appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        appointmentReport: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify doctor is the one assigned to this appointment
    if (appointment.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only create reports for your own appointments',
      );
    }

    // Check if report already exists
    if (appointment.appointmentReport) {
      throw new BadRequestException(
        'Report already exists for this appointment. Use update endpoint instead.',
      );
    }

    // Create the report
    const report = await this.prisma.appointmentReport.create({
      data: {
        appointmentId,
        doctorId,
        title: dto.title,
        content: dto.content,
        diagnosis: dto.diagnosis,
        prescription: dto.prescription,
        recommendations: dto.recommendations,
        fileUrl: dto.fileUrl,
      },
    });

    return report;
  }

  // Update existing report
  async updateAppointmentReport(
    appointmentId: string,
    doctorId: string,
    dto: UpdateReportDto,
  ) {
    // Verify appointment and report exist
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        appointmentReport: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (!appointment.appointmentReport) {
      throw new NotFoundException('No report found for this appointment');
    }

    // Verify doctor is the one assigned to this appointment
    if (appointment.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only update reports for your own appointments',
      );
    }

    // Update the report
    const report = await this.prisma.appointmentReport.update({
      where: { appointmentId },
      data: {
        title: dto.title,
        content: dto.content,
        diagnosis: dto.diagnosis,
        prescription: dto.prescription,
        recommendations: dto.recommendations,
        fileUrl: dto.fileUrl,
      },
    });

    return report;
  }

  // Get report for an appointment (accessible by doctor and patient)
  async getAppointmentReport(appointmentId: string, userId: string) {
    // Verify appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        appointmentReport: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify user is either the doctor or patient of this appointment
    if (
      appointment.doctorId !== userId &&
      appointment.patientId !== userId
    ) {
      throw new ForbiddenException(
        'You can only view reports for your own appointments',
      );
    }

    if (!appointment.appointmentReport) {
      throw new NotFoundException('No report found for this appointment');
    }

    return {
      ...appointment.appointmentReport,
      appointment: {
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        doctor: appointment.doctor,
        patient: appointment.patient,
      },
    };
  }

  // Get all reports for a patient
  async getPatientReports(patientId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        appointmentReport: {
          isNot: null,
        },
      },
      include: {
        appointmentReport: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return appointments.map((appt) => ({
      appointmentId: appt.id,
      appointmentDate: appt.startTime,
      doctor: appt.doctor,
      clinic: appt.clinic,
      report: appt.appointmentReport,
    }));
  }

  // Get all reports created by a doctor
  async getDoctorReports(doctorId: string) {
    const reports = await this.prisma.appointmentReport.findMany({
      where: { doctorId },
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reports.map((report) => ({
      reportId: report.id,
      appointmentId: report.appointmentId,
      appointmentDate: report.appointment.startTime,
      patient: report.appointment.patient,
      clinic: report.appointment.clinic,
      title: report.title,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }));
  }

  // Delete appointment report (doctor only)
  async deleteAppointmentReport(appointmentId: string, doctorId: string) {
    // Verify appointment and report exist
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        appointmentReport: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (!appointment.appointmentReport) {
      throw new NotFoundException('No report found for this appointment');
    }

    // Verify doctor is the one who created the report
    if (appointment.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only delete reports for your own appointments',
      );
    }

    // Delete the report
    await this.prisma.appointmentReport.delete({
      where: { appointmentId },
    });

    return {
      message: 'Report deleted successfully',
      appointmentId,
    };
  }
}
