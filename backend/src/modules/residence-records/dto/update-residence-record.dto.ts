import { PartialType } from '@nestjs/swagger';
import { CreateResidenceRecordDto } from './create-residence-record.dto';

export class UpdateResidenceRecordDto extends PartialType(CreateResidenceRecordDto) {}
