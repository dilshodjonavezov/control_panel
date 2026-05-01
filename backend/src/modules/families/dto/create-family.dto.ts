import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export const FAMILY_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;

export class CreateFamilyDto {
  @ApiProperty({ example: 'Karimov family' })
  @IsString()
  @MaxLength(255)
  familyName!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  primaryCitizenId!: number;

  @ApiProperty({ example: [1, 2, 3], required: false, type: [Number] })
  @IsOptional()
  @Type(() => Number)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  memberCitizenIds?: number[];

  @ApiProperty({ example: 11, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fatherCitizenId?: number | null;

  @ApiProperty({ example: 12, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  motherCitizenId?: number | null;

  @ApiProperty({ example: [21, 22], required: false, type: [Number] })
  @IsOptional()
  @Type(() => Number)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  childCitizenIds?: number[];

  @ApiProperty({ example: [21], required: false, type: [Number] })
  @IsOptional()
  @Type(() => Number)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  militaryRegisteredChildCitizenIds?: number[];

  @ApiProperty({ example: 10, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  addressId?: number | null;

  @ApiProperty({ enum: FAMILY_STATUSES, required: false, example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @IsIn(FAMILY_STATUSES)
  status?: string;

  @ApiProperty({ example: 'Created from registry import', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
