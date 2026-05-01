import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

const EDUCATION_EXPULSION_PROCESS_STATUSES = ['DEFERMENT_REMOVED', 'DATA_ERROR'] as const;

export class ProcessEducationExpulsionDto {
  @ApiProperty({ enum: EDUCATION_EXPULSION_PROCESS_STATUSES, example: 'DEFERMENT_REMOVED' })
  @IsString()
  @IsIn(EDUCATION_EXPULSION_PROCESS_STATUSES)
  decision!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 'Военная отсрочка снята, гражданин подлежит вызову.', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}
