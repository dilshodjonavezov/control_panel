import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { MATERNITY_BIRTH_CASE_TYPES, MATERNITY_GENDERS, MATERNITY_STATUSES } from '../maternity.constants';

export class CreateMaternityRecordDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: '2026-04-13T10:30:00.000Z' })
  @IsDateString()
  birthDateTime!: string;

  @ApiProperty({ example: 'GKB Roddom' })
  @IsString()
  @MaxLength(255)
  placeOfBirth!: string;

  @ApiProperty({ enum: MATERNITY_GENDERS, example: 'MALE' })
  @IsString()
  @IsIn(MATERNITY_GENDERS)
  gender!: string;

  @ApiProperty({ example: 'Karimov Alisher', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  childFullName?: string | null;

  @ApiProperty({ example: 7, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  childCitizenId?: number | null;

  @ApiProperty({ enum: MATERNITY_BIRTH_CASE_TYPES, example: 'STANDARD_MARRIAGE', required: false })
  @IsOptional()
  @IsString()
  @IsIn(MATERNITY_BIRTH_CASE_TYPES)
  birthCaseType?: string;

  @ApiProperty({ example: 'Karimov Rustam', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fatherFullName?: string | null;

  @ApiProperty({ example: 'Karimova Zebo', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motherFullName?: string | null;

  @ApiProperty({ example: 12, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fatherPersonId?: number | null;

  @ApiProperty({ example: 22, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  motherCitizenId?: number | null;

  @ApiProperty({ example: 8, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  familyId?: number | null;

  @ApiProperty({ example: 55.4, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  birthWeight?: number | null;

  @ApiProperty({ enum: MATERNITY_STATUSES, example: 'DRAFT', required: false })
  @IsOptional()
  @IsString()
  @IsIn(MATERNITY_STATUSES)
  status?: string;

  @ApiProperty({ example: 'Comment', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;

  @ApiProperty({ example: 'MED-2026-001', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  medicalCertificateNumber?: string | null;
}
