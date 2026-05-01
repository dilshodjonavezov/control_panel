import { PartialType } from '@nestjs/swagger';
import { CreateEducationRecordDto } from './create-education-record.dto';

export class UpdateEducationRecordDto extends PartialType(CreateEducationRecordDto) {}
