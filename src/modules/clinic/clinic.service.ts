import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { AddReceptionistDto } from './dto/add-receptionist.dto';
import { EmailService } from '../email/email.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ClinicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateClinicDto) {
    // Check if clinic code already exists
    const existingClinicCode = await this.prisma.clinic.findUnique({
      where: { code: dto.code },
    });
    if (existingClinicCode) {
      throw new ConflictException('Clinic code already exists');
    }

    // Check if clinic email already exists
    const existingClinicEmail = await this.prisma.clinic.findUnique({
      where: { email: dto.email },
    });
    if (existingClinicEmail) {
      throw new ConflictException('Clinic email already exists');
    }

    // Check if admin email already exists
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existingAdmin) {
      throw new ConflictException('Admin email already exists');
    }

    // Generate temporary password for clinic admin
    const temporaryPassword = crypto.randomBytes(8).toString('hex'); // 16 character password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create clinic admin user (auto-verified)
    const admin = await this.prisma.user.create({
      data: {
        name: dto.adminName,
        email: dto.adminEmail,
        phone: dto.adminPhone ?? null,
        password: hashedPassword,
        role: Role.CLINIC_ADMIN,
        isActive: true,
        emailVerified: true, // Auto-verified
      },
    });

    // Create clinic linked to admin
    const clinic = await this.prisma.clinic.create({
      data: {
        name: dto.name,
        code: dto.code,
        email: dto.email,
        phone: dto.phone ?? '',
        isActive: dto.isActive ?? true,
        adminId: admin.id,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            emailVerified: true,
          },
        },
      },
    });

    // Send invitation email to clinic admin
    try {
      await this.emailService.sendClinicAdminInvitation(
        admin.email,
        admin.name,
        clinic.name,
        temporaryPassword,
      );
    } catch (error) {
      console.error('Failed to send clinic admin invitation email:', error);
      // Don't fail clinic creation if email fails
    }

    return {
      message: 'Clinic created successfully. Invitation email sent to clinic admin.',
      clinic,
      temporaryPassword, // Return this so super admin can communicate it if email fails
    };
  }

  // ✔ Return real clinics
  findAll() {
    return this.prisma.clinic.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        code: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // ✔ Get clinic for logged-in admin
  async getMyClinic(adminId: string) {
    const clinic = await this.prisma.clinic.findFirst({
      where: { adminId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        doctors: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        receptionists: {
          include: {
            receptionist: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!clinic) {
      throw new NotFoundException('No clinic found for this admin');
    }

    return clinic;
  }

  // ✔ Add receptionist to clinic
  async addReceptionist(clinicId: string, dto: AddReceptionistDto, adminId: string) {
    // Verify clinic exists and user is admin of this clinic
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    if (clinic.adminId !== adminId) {
      throw new BadRequestException('Only the clinic admin can add receptionists');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create receptionist user
    const receptionist = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        password: hashedPassword,
        role: Role.RECEPTIONIST,
        emailVerified: true,
        isActive: true,
      },
    });

    // Link receptionist to clinic
    await this.prisma.clinicReceptionist.create({
      data: {
        clinicId: clinicId,
        receptionistId: receptionist.id,
      },
    });

    return {
      message: 'Receptionist added successfully',
      receptionist: {
        id: receptionist.id,
        name: receptionist.name,
        email: receptionist.email,
        phone: receptionist.phone,
        role: receptionist.role,
      },
    };
  }
}
