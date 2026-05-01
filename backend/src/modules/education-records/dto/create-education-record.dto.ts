import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEducationRecordDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  peopleId!: number;

  @ApiProperty({ example: 12, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  schoolRecordId?: number | null;

  @ApiProperty({ example: 18, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  medicalRecordId?: number | null;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  institutionId!: number;

  @ApiProperty({ example: 'Full-time' })
  @IsString()
  @MaxLength(100)
  studyForm!: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @MaxLength(255)
  faculty!: string;

  @ApiProperty({ example: 'Software engineering' })
  @IsString()
  @MaxLength(255)
  specialty!: string;

  @ApiProperty({ example: '2026-09-01', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  admissionDate?: string | null;

  @ApiProperty({ example: null, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  expulsionDate?: string | null;

  @ApiProperty({ example: null, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  graduationDate?: string | null;

  @ApiProperty({ example: true })
  @Type(() => Boolean)
  @IsBoolean()
  isDeferralActive!: boolean;

  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsInt()
  userId!: number;
}
