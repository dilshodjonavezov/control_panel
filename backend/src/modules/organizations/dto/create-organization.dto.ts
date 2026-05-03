import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ORGANIZATION_TYPES } from '../organization.constants';

export class CreateOrganizationDto {
  @ApiProperty({ enum: ORGANIZATION_TYPES, example: 'SCHOOL' })
  @IsString()
  @IsIn(ORGANIZATION_TYPES)
  type!: string;

  @ApiProperty({ example: 'school-5' })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ example: 'Школа №5' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'Душанбе', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @ApiProperty({ example: 'г. Душанбе, ул. Рудаки 10', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressText?: string | null;

  @ApiProperty({ example: '+992900000000', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @ApiProperty({ example: 'school5@example.tj', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string | null;

  @ApiProperty({ example: 'Саидов Саид', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  headFullName?: string | null;

  @ApiProperty({ example: 'Директор школы', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  headPosition?: string | null;

  @ApiProperty({ example: 'Район обслуживания №3', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceArea?: string | null;

  @ApiProperty({ example: 'LIC-2026-001', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  licenseNumber?: string | null;

  @ApiProperty({ example: 1200, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  capacity?: number | null;

  @ApiProperty({ example: 15, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  educationInstitutionId?: number | null;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
