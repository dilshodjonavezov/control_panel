import { ApiProperty } from '@nestjs/swagger';

export class CitizenResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ nullable: true })
  iin!: string | null;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ nullable: true })
  middleName!: string | null;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  birthDate!: string;

  @ApiProperty()
  gender!: string;

  @ApiProperty()
  citizenship!: string;

  @ApiProperty()
  lifeStatus!: string;

  @ApiProperty({ nullable: true })
  motherFullName!: string | null;

  @ApiProperty({ nullable: true })
  motherCitizenId!: number | null;

  @ApiProperty({ nullable: true })
  fatherFullName!: string | null;

  @ApiProperty({ nullable: true })
  fatherCitizenId!: number | null;

  @ApiProperty({ nullable: true })
  familyId!: number | null;

  @ApiProperty()
  militaryRegisteredAtBirth!: boolean;

  @ApiProperty()
  peopleId!: number;

  @ApiProperty()
  peopleFullName!: string;
}
