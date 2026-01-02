import { Controller, Get, Param } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('doctor/:doctorId')
  async getDoctorReports(@Param('doctorId') doctorId: string) {
    return this.reportService.getDoctorReports(doctorId);
  }
}
