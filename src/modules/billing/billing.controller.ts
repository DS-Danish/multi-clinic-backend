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
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard, RoleGuard)
export class BillingController {
  constructor(private billing: BillingService) {}

  @Post()
  @Roles(Role.RECEPTIONIST)
  create(@Body() dto: any) {
    return this.billing.createBill(dto);
  }

  @Get('me')
  @Roles(Role.PATIENT)
  getMyBills(@GetUser('userId') userId: string) {
    return this.billing.getPatientBills(userId);
  }

  @Get(':id')
  @Roles(Role.RECEPTIONIST, Role.SYSTEM_ADMIN)
  getOne(@Param('id') id: string) {
    return this.billing.getBill(id);
  }

  @Post(':id/pay')
  @Roles(Role.RECEPTIONIST)
  pay(@Param('id') id: string, @Body() dto: any) {
    return this.billing.payBill(id, dto);
  }

  @Get('patient/:patientId')
  @Roles(Role.RECEPTIONIST, Role.SYSTEM_ADMIN)
  getPatientBills(@Param('patientId') patientId: string) {
    return this.billing.getPatientBills(patientId);
  }
}
