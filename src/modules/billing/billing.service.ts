import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createBill(data: {
    appointmentId: string;
    patientId: string;
    totalAmount: number;
    discount?: number;
  }) {
    const bill = await this.prisma.bill.create({
      data: {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        totalAmount: data.totalAmount,
        discount: data.discount ?? 0,
        status: 'UNPAID',
      },
      include: {
        appointment: true,
        payments: true,
      },
    });

    if (data.patientId) {
      await this.notificationsService.sendNotification({
        userId: data.patientId,
        appointmentId: data.appointmentId,
        message: 'A new bill has been created for your appointment.',
        type: 'BILL_CREATED',
      });
    }

    return {
      message: 'Billing completed successfully.',
      bill,
    };
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

    const updatedBill = await this.updateStatus(billId);

    if (updatedBill.patientId) {
      await this.notificationsService.sendNotification({
        userId: updatedBill.patientId,
        appointmentId: updatedBill.appointmentId,
        message: `Payment received. Bill status is now ${updatedBill.status}.`,
        type: 'BILL_PAYMENT',
      });
    }

    return {
      message: 'Payment processed successfully.',
      bill: updatedBill,
    };
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
