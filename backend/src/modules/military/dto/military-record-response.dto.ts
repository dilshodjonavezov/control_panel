import { ApiProperty } from '@nestjs/swagger';

export class MilitaryRecordResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  peopleId!: number;

  @ApiProperty({ nullable: true })
  peopleFullName!: string | null;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty({ nullable: true })
  organizationId!: number | null;

  @ApiProperty()
  office!: string;

  @ApiProperty({ nullable: true })
  district!: string | null;

  @ApiProperty()
  enlistDate!: string;

  @ApiProperty({ nullable: true })
  assignmentDate!: string | null;

  @ApiProperty({ nullable: true })
  serviceUnit!: string | null;

  @ApiProperty({ nullable: true })
  serviceCity!: string | null;

  @ApiProperty({ nullable: true })
  commanderName!: string | null;

  @ApiProperty({ nullable: true })
  orderNumber!: string | null;

  @ApiProperty({ nullable: true })
  category!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  militaryStatus!: string;

  @ApiProperty({ nullable: true })
  defermentReason!: string | null;

  @ApiProperty({ nullable: true })
  defermentUntil!: string | null;

  @ApiProperty()
  militaryOfficeNotified!: boolean;

  @ApiProperty({ nullable: true })
  notes!: string | null;

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

  @ApiProperty()
  childrenCount!: number;

  @ApiProperty()
  eligibleForFamilyExemption!: boolean;

  @ApiProperty({ nullable: true })
  familyExemptionReason!: string | null;
}
