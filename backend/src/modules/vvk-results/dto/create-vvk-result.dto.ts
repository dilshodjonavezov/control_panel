import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

const VVK_CATEGORIES = ['A', 'B', 'C', 'D_UNFIT'] as const;
const VVK_QUEUE_STATUSES = ['WAITING', 'IN_REVIEW', 'DONE'] as const;

export class CreateVvkResultDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  peopleId!: number;

  @ApiProperty({ example: 9 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 2, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  medicalVisitId?: number | null;

  @ApiProperty({ example: '2026-01-30' })
  @IsDateString()
  examDate!: string;

  @ApiProperty({ enum: VVK_CATEGORIES, example: 'B' })
  @IsString()
  @IsIn(VVK_CATEGORIES)
  category!: string;

  @ApiProperty({ enum: VVK_QUEUE_STATUSES, required: false, example: 'DONE' })
  @IsOptional()
  @IsString()
  @IsIn(VVK_QUEUE_STATUSES)
  queueStatus?: string;

  @ApiProperty({ example: 'FIT_WITH_LIMITATIONS', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  fitnessCategory?: string | null;

  @ApiProperty({ example: 'FIT', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  finalDecision?: string | null;

  @ApiProperty({ example: 'Minor limitations', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string | null;

  @ApiProperty({ example: 'Fit with minor limitations', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiProperty({ example: '2027-01-30', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  nextReviewDate?: string | null;
}
