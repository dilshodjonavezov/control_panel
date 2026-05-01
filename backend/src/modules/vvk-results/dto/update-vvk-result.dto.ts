import { PartialType } from '@nestjs/swagger';
import { CreateVvkResultDto } from './create-vvk-result.dto';

export class UpdateVvkResultDto extends PartialType(CreateVvkResultDto) {}
