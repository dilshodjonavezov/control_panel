import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

const BORDER_EVENT_TYPES = ['EXIT', 'ENTRY'] as const;
const BORDER_DIRECTIONS = ['OUTBOUND', 'INBOUND'] as const;
const BORDER_STATUSES = ['OPEN', 'CLOSED', 'CANCELLED'] as const;

export class CreateBorderCrossingDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  peopleId!: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: '2026-04-14T10:00:00.000Z' })
  @IsDateString()
  departureDate!: string;

  @ApiProperty({ example: '2026-04-20T14:00:00.000Z', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  returnDate?: string | null;

  @ApiProperty({ example: true })
  @Type(() => Boolean)
  @IsBoolean()
  outsideBorder!: boolean;

  @ApiProperty({ example: 'Uzbekistan' })
  @IsString()
  @MaxLength(120)
  country!: string;

  @ApiProperty({ example: 'Private trip', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({ enum: BORDER_EVENT_TYPES, required: false, example: 'EXIT' })
  @IsOptional()
  @IsString()
  @IsIn(BORDER_EVENT_TYPES)
  eventType?: string;

  @ApiProperty({ enum: BORDER_DIRECTIONS, required: false, example: 'OUTBOUND' })
  @IsOptional()
  @IsString()
  @IsIn(BORDER_DIRECTIONS)
  direction?: string;

  @ApiProperty({ enum: BORDER_STATUSES, required: false, example: 'OPEN' })
  @IsOptional()
  @IsString()
  @IsIn(BORDER_STATUSES)
  status?: string;

  @ApiProperty({ example: 'Tourism', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  purpose?: string | null;

  @ApiProperty({ example: 'Tursunzoda', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  borderCheckpoint?: string | null;

  @ApiProperty({ example: 'AUTO', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  transportType?: string | null;

  @ApiProperty({ example: 'A1234567', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  documentNumber?: string | null;
}
