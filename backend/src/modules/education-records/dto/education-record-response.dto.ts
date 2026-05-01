import { ApiProperty } from '@nestjs/swagger';

export class EducationRecordResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  citizenId!: number;

  @ApiProperty()
  peopleId!: number;

  @ApiProperty({ nullable: true })
  peopleFullName!: string | null;

  @ApiProperty({ nullable: true })
  schoolRecordId!: number | null;

  @ApiProperty({ nullable: true })
  schoolGraduationDate!: string | null;

  @ApiProperty({ nullable: true })
  medicalRecordId!: number | null;

  @ApiProperty({ nullable: true })
  medicalDecision!: string | null;

  @ApiProperty()
  institutionId!: number;

  @ApiProperty({ nullable: true })
  institutionName!: string | null;

  @ApiProperty({ nullable: true })
  studyForm!: string | null;

  @ApiProperty({ nullable: true })
  faculty!: string | null;

  @ApiProperty({ nullable: true })
  specialty!: string | null;

  @ApiProperty({ nullable: true })
  admissionDate!: string | null;

  @ApiProperty({ nullable: true })
  expulsionDate!: string | null;

  @ApiProperty({ nullable: true })
  graduationDate!: string | null;

  @ApiProperty()
  isDeferralActive!: boolean;

  @ApiProperty({ nullable: true })
  defermentReviewStatus!: string | null;

  @ApiProperty({ nullable: true })
  defermentReviewComment!: string | null;

  @ApiProperty({ nullable: true })
  defermentReviewedAt!: string | null;

  @ApiProperty({ nullable: true })
  defermentReviewedByUserId!: number | null;

  @ApiProperty({ nullable: true })
  defermentReviewedByUserName!: string | null;

  @ApiProperty({ nullable: true })
  expulsionProcessStatus!: string | null;

  @ApiProperty({ nullable: true })
  expulsionProcessComment!: string | null;

  @ApiProperty({ nullable: true })
  expulsionProcessedAt!: string | null;

  @ApiProperty({ nullable: true })
  expulsionProcessedByUserId!: number | null;

  @ApiProperty({ nullable: true })
  expulsionProcessedByUserName!: string | null;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ nullable: true })
  userName!: string | null;
}
