import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { CITIZEN_GENDERS, CITIZEN_LIFE_STATUSES } from '../citizen.constants';

export class CreateCitizenDto {
  @ApiProperty({ example: '123456789012', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  iin?: string | null;

  @ApiProperty({ example: 'РђР»Рё' })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'РљР°СЂРёРјРѕРІ' })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: 'РЎР°РёРґРѕРІРёС‡', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string | null;

  @ApiProperty({ example: '2026-04-13' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ enum: CITIZEN_GENDERS, example: 'MALE' })
  @IsString()
  @IsIn(CITIZEN_GENDERS)
  gender!: string;

  @ApiProperty({ example: 'РўР°РґР¶РёРєРёСЃС‚Р°РЅ' })
  @IsString()
  @MaxLength(100)
  citizenship!: string;

  @ApiProperty({ enum: CITIZEN_LIFE_STATUSES, example: 'NEWBORN', required: false })
  @IsOptional()
  @IsString()
  @IsIn(CITIZEN_LIFE_STATUSES)
  lifeStatus?: string;

  @ApiProperty({ example: 'Иванова Мария', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motherFullName?: string | null;

  @ApiProperty({ example: 2, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  motherCitizenId?: number | null;

  @ApiProperty({ example: 'Иванов Иван', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fatherFullName?: string | null;

  @ApiProperty({ example: 1, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fatherCitizenId?: number | null;

  @ApiProperty({ example: 10, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  familyId?: number | null;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  militaryRegisteredAtBirth?: boolean;
}

