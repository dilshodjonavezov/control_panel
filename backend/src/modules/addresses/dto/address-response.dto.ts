import { ApiProperty } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  citizenId!: number;

  @ApiProperty({ nullable: true })
  citizenFullName!: string | null;

  @ApiProperty({ nullable: true })
  familyId!: number | null;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  region!: string;

  @ApiProperty({ nullable: true })
  district!: string | null;

  @ApiProperty({ nullable: true })
  city!: string | null;

  @ApiProperty()
  street!: string;

  @ApiProperty()
  house!: string;

  @ApiProperty({ nullable: true })
  apartment!: string | null;

  @ApiProperty({ nullable: true })
  postalCode!: string | null;

  @ApiProperty()
  fullAddress!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty({ nullable: true })
  endDate!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  notes!: string | null;
}
