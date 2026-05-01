import { ApiProperty } from '@nestjs/swagger';

export class ResidenceRecordResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  peopleId!: number;

  @ApiProperty({ nullable: true })
  peopleFullName!: string | null;

  @ApiProperty({ nullable: true })
  address!: string | null;

  @ApiProperty({ nullable: true })
  registeredAt!: string | null;

  @ApiProperty({ nullable: true })
  unregisteredAt!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty({ nullable: true })
  comment!: string | null;
}
