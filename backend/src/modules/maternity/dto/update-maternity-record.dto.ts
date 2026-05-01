import { PartialType } from '@nestjs/swagger';
import { CreateMaternityRecordDto } from './create-maternity-record.dto';

export class UpdateMaternityRecordDto extends PartialType(CreateMaternityRecordDto) {}
