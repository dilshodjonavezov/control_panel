import { PartialType } from '@nestjs/swagger';
import { CreateMilitaryRecordDto } from './create-military-record.dto';

export class UpdateMilitaryRecordDto extends PartialType(CreateMilitaryRecordDto) {}
