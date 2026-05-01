import { PartialType } from '@nestjs/swagger';
import { CreateZagsActDto } from './create-zags-act.dto';

export class UpdateZagsActDto extends PartialType(CreateZagsActDto) {}
