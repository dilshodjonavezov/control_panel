import { ApiProperty } from '@nestjs/swagger';

export class PassportRecordResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  citizenId!: number;

  @ApiProperty()
  peopleId!: number;

  @ApiProperty({ nullable: true })
  peopleFullName!: string | null;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty({ nullable: true })
  passportNumber!: string | null;

  @ApiProperty({ nullable: true })
  dateOfIssue!: string | null;

  @ApiProperty({ nullable: true })
  expireDate!: string | null;

  @ApiProperty({ nullable: true })
  placeOfIssue!: string | null;

  @ApiProperty({ nullable: true })
  dateBirth!: string | null;
}
