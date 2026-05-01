import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ORGANIZATION_TYPES } from '../organization.constants';

export class CreateOrganizationDto {
  @ApiProperty({ enum: ORGANIZATION_TYPES, example: 'SCHOOL' })
  @IsString()
  @IsIn(ORGANIZATION_TYPES)
  type!: string;

  @ApiProperty({ example: 'school-21-central' })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ example: 'Школа №21' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'г. Душанбе, ул. Рудаки 10', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressText?: string | null;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
