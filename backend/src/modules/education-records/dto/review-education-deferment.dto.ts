import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

const EDUCATION_DEFERMENT_REVIEW_STATUSES = ['APPROVED', 'REJECTED', 'NEEDS_WORK'] as const;

export class ReviewEducationDefermentDto {
  @ApiProperty({ enum: EDUCATION_DEFERMENT_REVIEW_STATUSES, example: 'APPROVED' })
  @IsString()
  @IsIn(EDUCATION_DEFERMENT_REVIEW_STATUSES)
  decision!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 'Подтверждено учебным отделом.', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}
