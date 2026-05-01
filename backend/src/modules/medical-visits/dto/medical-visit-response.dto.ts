import { ApiProperty } from '@nestjs/swagger';

export class MedicalVisitResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  citizenId!: number;

  @ApiProperty()
  peopleId!: number;

  @ApiProperty({ nullable: true })
  peopleFullName!: string | null;

  @ApiProperty({ nullable: true })
  medicalRecordId!: number | null;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty()
  doctor!: string;

  @ApiProperty({ nullable: true })
  visitDate!: string | null;

  @ApiProperty()
  diagnosis!: string;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  status!: string;
}
