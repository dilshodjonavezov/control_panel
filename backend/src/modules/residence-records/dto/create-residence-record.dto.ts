import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateResidenceRecordDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  peopleId!: number;

  @ApiProperty({ example: 'Dushanbe, Rudaki avenue 10' })
  @IsString()
  @MaxLength(255)
  address!: string;

  @ApiProperty({ example: '2026-04-13T08:00:00.000Z' })
  @IsDateString()
  registeredAt!: string;

  @ApiProperty({ example: '2026-05-01T08:00:00.000Z', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  unregisteredAt?: string | null;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 'Imported from JEK request', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}
