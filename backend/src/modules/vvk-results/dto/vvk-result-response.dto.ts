import { ApiProperty } from '@nestjs/swagger';

export class VvkResultResponseDto {
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
  organizationId!: number | null;

  @ApiProperty({ nullable: true })
  medicalVisitId!: number | null;

  @ApiProperty()
  examDate!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  queueStatus!: string;

  @ApiProperty({ nullable: true })
  fitnessCategory!: string | null;

  @ApiProperty({ nullable: true })
  finalDecision!: string | null;

  @ApiProperty({ nullable: true })
  reason!: string | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty({ nullable: true })
  nextReviewDate!: string | null;
}
