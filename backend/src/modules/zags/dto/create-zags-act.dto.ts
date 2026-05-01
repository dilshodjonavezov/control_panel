import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { MATERNITY_BIRTH_CASE_TYPES } from '../../maternity/maternity.constants';
import { ZAGS_ACT_TYPES, ZAGS_STATUSES } from '../zags.constants';

class CreateBirthDetailsDto {
  @ApiProperty({ example: 1, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  childCitizenId?: number | null;

  @ApiProperty({ enum: MATERNITY_BIRTH_CASE_TYPES, example: 'STANDARD_MARRIAGE', required: false })
  @IsOptional()
  @IsString()
  @IsIn(MATERNITY_BIRTH_CASE_TYPES)
  birthCaseType?: string;

  @ApiProperty({ example: 'Karimov Alisher' })
  @IsString()
  @MaxLength(255)
  childFullName!: string;

  @ApiProperty({ example: '2026-04-13' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ example: 'Dushanbe' })
  @IsString()
  birthPlace!: string;

  @ApiProperty({ example: 2, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  motherCitizenId?: number | null;

  @ApiProperty({ example: 'Karimova Zebo', required: false, nullable: true })
  @IsOptional()
  @IsString()
  motherFullName?: string | null;

  @ApiProperty({ example: 3, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fatherCitizenId?: number | null;

  @ApiProperty({ example: 'Karimov Rustam', required: false, nullable: true })
  @IsOptional()
  @IsString()
  fatherFullName?: string | null;
}

class CreateMarriageDetailsDto {
  @ApiProperty({ example: 'Karimov Rustam' })
  @IsString()
  spouseOneFullName!: string;

  @ApiProperty({ example: 'Karimova Zebo' })
  @IsString()
  spouseTwoFullName!: string;

  @ApiProperty({ example: '2026-04-13' })
  @IsDateString()
  marriageDate!: string;

  @ApiProperty({ example: 'Dushanbe' })
  @IsString()
  marriagePlace!: string;
}

class CreateDeathDetailsDto {
  @ApiProperty({ example: 'Karimov Rustam' })
  @IsString()
  deceasedFullName!: string;

  @ApiProperty({ example: '2026-04-13' })
  @IsDateString()
  deathDate!: string;

  @ApiProperty({ example: 'Dushanbe' })
  @IsString()
  deathPlace!: string;

  @ApiProperty({ example: 'Reason', required: false, nullable: true })
  @IsOptional()
  @IsString()
  deathReason?: string | null;
}

export class CreateZagsActDto {
  @ApiProperty({ example: 'ACT-0001' })
  @IsString()
  @MaxLength(50)
  actNumber!: string;

  @ApiProperty({ enum: ZAGS_ACT_TYPES, example: 'BIRTH' })
  @IsString()
  @IsIn(ZAGS_ACT_TYPES)
  actType!: string;

  @ApiProperty({ enum: ZAGS_STATUSES, example: 'REGISTERED', required: false })
  @IsOptional()
  @IsString()
  @IsIn(ZAGS_STATUSES)
  status?: string;

  @ApiProperty({ example: '2026-04-13' })
  @IsDateString()
  registrationDate!: string;

  @ApiProperty({ example: 'ZAGS Central' })
  @IsString()
  placeOfRegistration!: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 5, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  citizenId?: number | null;

  @ApiProperty({ example: 1, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maternityRecordId?: number | null;

  @ApiProperty({ example: 8, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  familyId?: number | null;

  @ApiProperty({ required: false, type: CreateBirthDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBirthDetailsDto)
  birthDetails?: CreateBirthDetailsDto;

  @ApiProperty({ required: false, type: CreateMarriageDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMarriageDetailsDto)
  marriageDetails?: CreateMarriageDetailsDto;

  @ApiProperty({ required: false, type: CreateDeathDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDeathDetailsDto)
  deathDetails?: CreateDeathDetailsDto;
}
