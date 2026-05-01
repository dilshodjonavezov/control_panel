import { ApiProperty } from '@nestjs/swagger';

export class FamilyResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  familyName!: string;

  @ApiProperty()
  primaryCitizenId!: number;

  @ApiProperty({ nullable: true })
  primaryCitizenFullName!: string | null;

  @ApiProperty({ nullable: true })
  fatherCitizenId!: number | null;

  @ApiProperty({ nullable: true })
  fatherFullName!: string | null;

  @ApiProperty({ nullable: true })
  motherCitizenId!: number | null;

  @ApiProperty({ nullable: true })
  motherFullName!: string | null;

  @ApiProperty({ type: [Number] })
  memberCitizenIds!: number[];

  @ApiProperty()
  memberCount!: number;

  @ApiProperty({ type: [Number] })
  childCitizenIds!: number[];

  @ApiProperty()
  childrenCount!: number;

  @ApiProperty()
  sonsCount!: number;

  @ApiProperty()
  daughtersCount!: number;

  @ApiProperty({ type: [Number] })
  militaryRegisteredChildCitizenIds!: number[];

  @ApiProperty()
  militaryRegisteredChildrenCount!: number;

  @ApiProperty({ type: [Object] })
  children!: Array<Record<string, unknown>>;

  @ApiProperty()
  eligibleFatherForMilitaryExemption!: boolean;

  @ApiProperty({ nullable: true })
  addressId!: number | null;

  @ApiProperty({ nullable: true })
  addressLabel!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty({ nullable: true })
  createdAt!: string | null;
}
