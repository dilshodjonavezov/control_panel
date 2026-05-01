import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePassportRecordDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  peopleId!: number;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 'A1234567' })
  @IsString()
  @MaxLength(50)
  passportNumber!: string;

  @ApiProperty({ example: '2026-04-13', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfIssue?: string | null;

  @ApiProperty({ example: '2036-04-13', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  expireDate?: string | null;

  @ApiProperty({ example: 'Dushanbe' })
  @IsString()
  @MaxLength(255)
  placeOfIssue!: string;

  @ApiProperty({ example: '1990-05-10', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  dateBirth?: string | null;
}
