import { ApiProperty } from '@nestjs/swagger';

export class ZagsActResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  actNumber!: string;

  @ApiProperty()
  actType!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  registrationDate!: string;

  @ApiProperty()
  placeOfRegistration!: string;

  @ApiProperty({ nullable: true })
  citizenId!: number | null;

  @ApiProperty({ nullable: true })
  maternityRecordId!: number | null;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty({ nullable: true })
  familyId!: number | null;

  @ApiProperty({ nullable: true })
  birthCaseType!: string | null;
}
