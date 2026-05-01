import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

const MEDICAL_VISIT_STATUSES = ['DRAFT', 'FINAL'] as const;

export class CreateMedicalVisitDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  peopleId!: number;

  @ApiProperty({ example: 1, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  medicalRecordId?: number | null;

  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 'Doctor A.V.' })
  @IsString()
  @MaxLength(255)
  doctor!: string;

  @ApiProperty({ example: '2026-01-24', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  visitDate?: string | null;

  @ApiProperty({ example: 'ARVI' })
  @IsString()
  @MaxLength(255)
  diagnosis!: string;

  @ApiProperty({ example: 'Outpatient treatment', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiProperty({ enum: MEDICAL_VISIT_STATUSES, example: 'FINAL', required: false })
  @IsOptional()
  @IsString()
  @IsIn(MEDICAL_VISIT_STATUSES)
  status?: string;
}
