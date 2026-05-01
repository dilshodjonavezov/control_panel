import { PartialType } from '@nestjs/swagger';
import { CreateSchoolRecordDto } from './create-school-record.dto';

export class UpdateSchoolRecordDto extends PartialType(CreateSchoolRecordDto) {}
