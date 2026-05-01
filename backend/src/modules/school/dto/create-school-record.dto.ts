import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSchoolRecordDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  peopleId!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  institutionId!: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  classNumber!: number;

  @ApiProperty({ example: '2026-09-01T08:00:00.000Z', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  admissionDate?: string | null;

  @ApiProperty({ example: null, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  graduationDate?: string | null;

  @ApiProperty({ example: null, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  expulsionDate?: string | null;

  @ApiProperty({ example: 'Admitted to school', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}
