import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export const ADDRESS_TYPES = ['REGISTRATION', 'RESIDENCE', 'TEMPORARY'] as const;

export class CreateAddressDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  citizenId!: number;

  @ApiProperty({ example: 1, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  familyId?: number | null;

  @ApiProperty({ enum: ADDRESS_TYPES, example: 'REGISTRATION', required: false })
  @IsOptional()
  @IsString()
  @IsIn(ADDRESS_TYPES)
  type?: string;

  @ApiProperty({ example: 'Dushanbe' })
  @IsString()
  @MaxLength(100)
  region!: string;

  @ApiProperty({ example: 'Sino', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string | null;

  @ApiProperty({ example: 'Dushanbe', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiProperty({ example: 'Rudaki avenue' })
  @IsString()
  @MaxLength(255)
  street!: string;

  @ApiProperty({ example: '15A' })
  @IsString()
  @MaxLength(50)
  house!: string;

  @ApiProperty({ example: '12', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  apartment?: string | null;

  @ApiProperty({ example: '734000', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @ApiProperty({ example: '2026-04-13' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-12-31', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'Primary registration address', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
