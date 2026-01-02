import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClinicModule } from './modules/clinic/clinic.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './modules/user/user.module';
import { SpecialityModule } from './modules/speciality/speciality.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { ReceptionistModule } from './modules/receptionist/receptionist.module'; // ⭐ ADD THIS
import { DoctorModule } from "./modules/doctor/doctor.module";
import { AppointmentModule } from './modules/appointment/appointment.module';
import { ReportModule } from './modules/report/report.module';
import { BillingModule } from './modules/billing/billing.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClinicModule,
    DatabaseModule,
    UserModule,
    SpecialityModule,
    AuthModule,
    EmailModule,
    ReceptionistModule, // ⭐ ADD THIS
    DoctorModule,
    AppointmentModule,
    ReportModule,
    BillingModule,
    SuperAdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
