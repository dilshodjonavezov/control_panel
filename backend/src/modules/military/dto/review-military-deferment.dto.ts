import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

const MILITARY_DEFERMENT_REVIEW_STATUSES = ['APPROVED', 'REJECTED', 'NEEDS_WORK'] as const;

export class ReviewMilitaryDefermentDto {
  @ApiProperty({ enum: MILITARY_DEFERMENT_REVIEW_STATUSES, example: 'APPROVED' })
  @IsString()
  @IsIn(MILITARY_DEFERMENT_REVIEW_STATUSES)
  decision!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 'Основание подтверждено военкоматом.', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}
