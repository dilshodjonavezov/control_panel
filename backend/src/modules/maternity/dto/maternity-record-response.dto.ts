import { ApiProperty } from '@nestjs/swagger';

export class MaternityRecordResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty()
  birthDateTime!: string;

  @ApiProperty({ nullable: true })
  placeOfBirth!: string | null;

  @ApiProperty({ nullable: true })
  gender!: string | null;

  @ApiProperty({ nullable: true })
  childFullName!: string | null;

  @ApiProperty({ nullable: true })
  fatherFullName!: string | null;

  @ApiProperty({ nullable: true })
  motherFullName!: string | null;

  @ApiProperty({ nullable: true })
  fatherPersonId!: number | null;

  @ApiProperty({ nullable: true })
  childCitizenId!: number | null;

  @ApiProperty({ nullable: true })
  motherCitizenId!: number | null;

  @ApiProperty({ nullable: true })
  familyId!: number | null;

  @ApiProperty({ nullable: true })
  birthCaseType!: string | null;

  @ApiProperty({ nullable: true })
  birthWeight!: number | null;

  @ApiProperty({ nullable: true })
  status!: string | null;

  @ApiProperty({ nullable: true })
  comment!: string | null;

  @ApiProperty({ nullable: true })
  createdAt!: string | null;
}
