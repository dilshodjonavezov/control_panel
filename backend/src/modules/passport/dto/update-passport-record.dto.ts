import { PartialType } from '@nestjs/swagger';
import { CreatePassportRecordDto } from './create-passport-record.dto';

export class UpdatePassportRecordDto extends PartialType(CreatePassportRecordDto) {}
