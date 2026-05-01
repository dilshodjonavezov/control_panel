import { PartialType } from '@nestjs/swagger';
import { CreateEducationInstitutionDto } from './create-education-institution.dto';

export class UpdateEducationInstitutionDto extends PartialType(CreateEducationInstitutionDto) {}
