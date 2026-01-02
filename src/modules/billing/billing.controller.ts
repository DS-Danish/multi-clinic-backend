import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @Post()
  @Roles(Role.RECEPTIONIST)
  @UseGuards(RoleGuard)
  create(@Body() dto: any) {
    return this.billing.createBill(dto);
  }

  @Get(':id')
  @Roles(Role.RECEPTIONIST, Role.SYSTEM_ADMIN)
  @UseGuards(RoleGuard)
  getOne(@Param('id') id: string) {
    return this.billing.getBill(id);
  }

  @Post(':id/pay')
  @Roles(Role.RECEPTIONIST)
  @UseGuards(RoleGuard)
  pay(@Param('id') id: string, @Body() dto: any) {
    return this.billing.payBill(id, dto);
  }

  @Get('patient/:patientId')
  @Roles(Role.RECEPTIONIST, Role.SYSTEM_ADMIN)
  @UseGuards(RoleGuard)
  getPatientBills(@Param('patientId') patientId: string) {
    return this.billing.getPatientBills(patientId);
  }
}
