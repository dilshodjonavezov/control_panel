import { ApiProperty } from '@nestjs/swagger';

export class SchoolRecordResponseDto {
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

  @ApiProperty()
  institutionId!: number;

  @ApiProperty({ nullable: true })
  institutionName!: string | null;

  @ApiProperty({ nullable: true })
  classNumber!: number | null;

  @ApiProperty({ nullable: true })
  admissionDate!: string | null;

  @ApiProperty({ nullable: true })
  graduationDate!: string | null;

  @ApiProperty({ nullable: true })
  expulsionDate!: string | null;

  @ApiProperty()
  isStudying!: boolean;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty({ nullable: true })
  comment!: string | null;
}
