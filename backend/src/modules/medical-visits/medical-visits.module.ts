import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensModule } from '../citizens/citizens.module';
import { UsersModule } from '../users/users.module';
import { MedicalVisit, MedicalVisitSchema } from './schemas/medical-visit.schema';
import { MedicalVisitsController } from './medical-visits.controller';
import { MedicalVisitsService } from './medical-visits.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MedicalVisit.name, schema: MedicalVisitSchema }]),
    CitizensModule,
    UsersModule,
  ],
  controllers: [MedicalVisitsController],
  providers: [MedicalVisitsService],
  exports: [MedicalVisitsService],
})
export class MedicalVisitsModule {}
