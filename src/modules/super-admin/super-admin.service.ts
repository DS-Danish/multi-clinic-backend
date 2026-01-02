import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateClinicWithAdminDto } from './dto/create-clinic-with-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createClinicWithAdmin(dto: CreateClinicWithAdminDto) {
    const exists = await this.prisma.clinic.findUnique({
      where: { code: dto.clinicCode },
    });
    if (exists) throw new BadRequestException('Clinic code already exists');

    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);

    const clinic = await this.prisma.clinic.create({
      data: {
        name: dto.clinicName,
        code: dto.clinicCode,
        email: dto.clinicEmail,
        phone: dto.clinicPhone,

        admin: {
          create: {
            name: dto.adminName,
            email: dto.adminEmail,
            password: hashedPassword,
            role: 'CLINIC_ADMIN',
            emailVerified: true,
            isActive: true,
          },
        },
      },
      include: {
        admin: true,
      },
    });

    return {
      message: 'Clinic + Admin created successfully',
      clinic,
    };
  }

  // =======================================================
  // ⭐ NEW: FETCH ALL CLINICS WITH ADMIN & PATIENT COUNTS
  // =======================================================
  async getAllClinics() {
    const clinics = await this.prisma.clinic.findMany({
      include: {
        admin: true,
        appointments: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return clinics.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      email: c.email,
      phone: c.phone,

      // ⭐ Count administrators for this clinic
      admins: c.admin ? 1 : 0,

      // ⭐ Distinct patient count via appointments
      patients: new Set(c.appointments.map((a) => a.patientId)).size,
    }));
  }

  // =======================================================
  // ⭐ NEW: MANUALLY VERIFY USER EMAIL (SUPER ADMIN ONLY)
  // =======================================================
  async verifyUserEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        verificationToken: null,
        tokenExpiry: null,
      },
    });

    return {
      message: `User ${user.email} has been verified successfully`,
      success: true,
    };
  }
}
