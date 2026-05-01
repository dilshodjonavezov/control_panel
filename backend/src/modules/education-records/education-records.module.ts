import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensModule } from '../citizens/citizens.module';
import { EducationInstitutionsModule } from '../education-institutions/education-institutions.module';
import { MedicalRecordsModule } from '../medical-records/medical-records.module';
import { MilitaryRecord, MilitaryRecordSchema } from '../military/schemas/military-record.schema';
import { SchoolModule } from '../school/school.module';
import { UsersModule } from '../users/users.module';
import { EducationRecordsController } from './education-records.controller';
import { EducationRecordsService } from './education-records.service';
import { EducationRecord, EducationRecordSchema } from './schemas/education-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EducationRecord.name, schema: EducationRecordSchema },
      { name: MilitaryRecord.name, schema: MilitaryRecordSchema },
    ]),
    CitizensModule,
    EducationInstitutionsModule,
    SchoolModule,
    MedicalRecordsModule,
    UsersModule,
  ],
  controllers: [EducationRecordsController],
  providers: [EducationRecordsService],
  exports: [EducationRecordsService],
})
export class EducationRecordsModule {}
