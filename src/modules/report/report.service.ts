import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getDoctorReports(doctorId: string) {
    // 1) Find clinics assigned to this doctor
    const clinicLinks = await this.prisma.clinicDoctor.findMany({
      where: { doctorId },
      include: {
        clinic: true,
      },
    });

    const clinicIds = clinicLinks.map((c) => c.clinicId);
    if (clinicIds.length === 0) return [];

    // 2) Fetch reports associated with these clinics
    const reports = await this.prisma.report.findMany({
      where: {
        clinicId: { in: clinicIds },
      },
      orderBy: {
        generatedAt: 'desc',   // ✔ correct field based on your model
      },
      include: {
        clinic: {
          select: { name: true },
        },
      },
    });

    // 3) Transform response for frontend
    return reports.map((r) => ({
      id: r.id,
      type: r.type,
      createdAt: r.generatedAt,        // ✔ correct timestamp
      clinicName: r.clinic.name,       // ✔ clinic relation confirmed
      data: r.data,
    }));
  }
}
