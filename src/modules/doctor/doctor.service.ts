import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Role } from "@prisma/client";

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  // -------------------------
  // GET ALL DOCTORS
  // -------------------------
  async getAllDoctors() {
    return this.prisma.user.findMany({
      where: { role: Role.DOCTOR },
      select: { id: true, name: true, email: true },
    });
  }

  // -------------------------
  // GET DOCTORS FOR A CLINIC
  // -------------------------
  async getDoctorsByClinic(clinicId: string) {
    const clinicDoctors = await this.prisma.clinicDoctor.findMany({
      where: { clinicId },
      select: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return clinicDoctors.map(cd => cd.doctor);
  }
}
