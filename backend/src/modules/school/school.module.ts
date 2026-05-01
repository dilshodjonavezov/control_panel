import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensModule } from '../citizens/citizens.module';
import { EducationInstitutionsModule } from '../education-institutions/education-institutions.module';
import { UsersModule } from '../users/users.module';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';
import { SchoolRecord, SchoolRecordSchema } from './schemas/school-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SchoolRecord.name, schema: SchoolRecordSchema }]),
    CitizensModule,
    EducationInstitutionsModule,
    UsersModule,
  ],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
