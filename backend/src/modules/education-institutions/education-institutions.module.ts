import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EducationInstitutionsController } from './education-institutions.controller';
import { EducationInstitutionsService } from './education-institutions.service';
import {
  EducationInstitution,
  EducationInstitutionSchema,
} from './schemas/education-institution.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: EducationInstitution.name, schema: EducationInstitutionSchema }])],
  controllers: [EducationInstitutionsController],
  providers: [EducationInstitutionsService],
  exports: [EducationInstitutionsService],
})
export class EducationInstitutionsModule {}
