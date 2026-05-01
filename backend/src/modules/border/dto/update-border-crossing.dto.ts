import { PartialType } from '@nestjs/swagger';
import { CreateBorderCrossingDto } from './create-border-crossing.dto';

export class UpdateBorderCrossingDto extends PartialType(CreateBorderCrossingDto) {}
