import { Module } from '@nestjs/common';
import { SpecialityService } from './speciality.service';
import { SpecialityController } from './speciality.controller';

@Module({
  providers: [SpecialityService],
  controllers: [SpecialityController]
})
export class SpecialityModule {}
