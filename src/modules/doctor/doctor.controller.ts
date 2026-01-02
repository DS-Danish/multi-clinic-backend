import { Controller, Get, Param } from "@nestjs/common";
import { DoctorService } from "./doctor.service";

@Controller("doctors")
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  getAllDoctors() {
    return this.doctorService.getAllDoctors();
  }

  @Get("clinic/:clinicId")
  getDoctorsByClinic(@Param("clinicId") clinicId: string) {
    return this.doctorService.getDoctorsByClinic(clinicId);
  }
}
