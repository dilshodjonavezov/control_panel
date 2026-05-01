import { PartialType } from '@nestjs/swagger';
import { CreateMedicalVisitDto } from './create-medical-visit.dto';

export class UpdateMedicalVisitDto extends PartialType(CreateMedicalVisitDto) {}
