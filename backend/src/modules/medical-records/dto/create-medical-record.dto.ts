import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

const MEDICAL_DECISIONS = ['FIT', 'UNFIT'] as const;

export class CreateMedicalRecordDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  peopleId!: number;

  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 'Clinic No. 1' })
  @IsString()
  @MaxLength(255)
  clinic!: string;

  @ApiProperty({ enum: MEDICAL_DECISIONS, example: 'FIT' })
  @IsString()
  decision!: string;

  @ApiProperty({ example: 'Healthy and fit', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string | null;

  @ApiProperty({ example: 'Family circumstances', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defermentReason?: string | null;

  @ApiProperty({ example: '2026-04-14', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  createdAtRecord?: string | null;

  @ApiProperty({ example: 'Outpatient card created', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
