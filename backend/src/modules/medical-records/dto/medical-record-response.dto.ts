import { ApiProperty } from '@nestjs/swagger';

export class MedicalRecordResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  citizenId!: number;

  @ApiProperty()
  peopleId!: number;

  @ApiProperty({ nullable: true })
  peopleFullName!: string | null;

  @ApiProperty({ nullable: true })
  fatherFullName!: string | null;

  @ApiProperty({ nullable: true })
  motherFullName!: string | null;

  @ApiProperty({ nullable: true })
  addressLabel!: string | null;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty({ nullable: true })
  organizationId!: number | null;

  @ApiProperty()
  clinic!: string;

  @ApiProperty({ nullable: true })
  decision!: string | null;

  @ApiProperty({ nullable: true })
  reason!: string | null;

  @ApiProperty({ nullable: true })
  defermentReason!: string | null;

  @ApiProperty({ nullable: true })
  createdAtRecord!: string | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;
}
