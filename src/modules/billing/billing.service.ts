import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async createBill(data: {
    appointmentId: string;
    patientId: string;
    totalAmount: number;
    discount?: number;
  }) {
    return this.prisma.bill.create({
      data: {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        totalAmount: data.totalAmount,
        discount: data.discount ?? 0,
        status: 'UNPAID',
      },
    });
  }

  async getBill(id: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        payments: true,
        patient: true,
        appointment: true,
      },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    return bill;
  }

  async payBill(billId: string, data: { amount: number; method: string }) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: { payments: true },
    });

    if (!bill) throw new NotFoundException('Bill not found');

    await this.prisma.payment.create({
      data: {
        billId,
        amount: data.amount,
        method: data.method,
      },
    });

    return this.updateStatus(billId);
  }

  async updateStatus(billId: string) {
    const bill = await this.prisma.bill.findUnique({
        where: { id: billId },
        include: { payments: true },
    });

    if (!bill) throw new NotFoundException('Bill not found');

    const totalPaid = bill.payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
    const netAmount = (bill.totalAmount ?? 0) - (bill.discount ?? 0);

    const status =
        totalPaid >= netAmount
        ? 'PAID'
        : totalPaid > 0
        ? 'PARTIAL'
        : 'UNPAID';

    return this.prisma.bill.update({
        where: { id: billId },
        data: { status },
        include: { payments: true },
    });
  }

  async getClinicBills(clinicId: string) {
    return this.prisma.bill.findMany({
      where: {
        appointment: { clinicId },
      },
      include: {
        patient: true,
        appointment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPatientBills(patientId: string) {
    return this.prisma.bill.findMany({
      where: { patientId },
      include: {
        appointment: true,
        payments: true,
      },
    });
  }
}
