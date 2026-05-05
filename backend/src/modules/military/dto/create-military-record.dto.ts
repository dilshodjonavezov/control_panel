import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

const MILITARY_RECORD_STATUSES = ['ENLISTED', 'REMOVED', 'RESERVE', 'DEFERRED', 'SERVICE_COMPLETED', 'DISCHARGED'] as const;
const MILITARY_PERSON_STATUSES = ['PRE_CONSCRIPT', 'CONSCRIPT', 'RESERVE', 'SERVICE', 'IN_SERVICE', 'SERVICE_COMPLETED', 'COMPLETED_SERVICE', 'COMPLETED', 'DISCHARGED', 'FAMILY_CIRCUMSTANCES'] as const;

export class CreateMilitaryRecordDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  peopleId!: number;

  @ApiProperty({ example: 9 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 'Military office No. 2' })
  @IsString()
  @MaxLength(255)
  office!: string;

  @ApiProperty({ example: 'Sino', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string | null;

  @ApiProperty({ example: '2022-08-15' })
  @IsDateString()
  enlistDate!: string;

  @ApiProperty({ example: '2022-08-15', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  assignmentDate?: string | null;

  @ApiProperty({ example: 'Military unit 3036', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceUnit?: string | null;

  @ApiProperty({ example: 'Dushanbe', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  serviceCity?: string | null;

  @ApiProperty({ example: 'Abdulloev Rahim', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  commanderName?: string | null;

  @ApiProperty({ example: 'Order No. 45', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  orderNumber?: string | null;

  @ApiProperty({ example: 'A', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  category?: string | null;

  @ApiProperty({ enum: MILITARY_RECORD_STATUSES, required: false, example: 'ENLISTED' })
  @IsOptional()
  @IsString()
  @IsIn(MILITARY_RECORD_STATUSES)
  status?: string;

  @ApiProperty({ enum: MILITARY_PERSON_STATUSES, required: false, example: 'CONSCRIPT' })
  @IsOptional()
  @IsString()
  @IsIn(MILITARY_PERSON_STATUSES)
  militaryStatus?: string;

  @ApiProperty({ example: 'Family circumstances', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defermentReason?: string | null;

  @ApiProperty({ example: '2027-09-01', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  defermentUntil?: string | null;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  militaryOfficeNotified?: boolean;

  @ApiProperty({ example: 'Assigned by residence', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
