import { ApiProperty } from '@nestjs/swagger';

export class BorderCrossingResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  citizenId!: number;

  @ApiProperty()
  peopleId!: number;

  @ApiProperty({ nullable: true })
  peopleName!: string | null;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty()
  departureDate!: string;

  @ApiProperty({ nullable: true })
  returnDate!: string | null;

  @ApiProperty()
  outsideBorder!: boolean;

  @ApiProperty({ nullable: true })
  country!: string | null;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  eventType!: string;

  @ApiProperty()
  direction!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  purpose!: string | null;

  @ApiProperty({ nullable: true })
  borderCheckpoint!: string | null;

  @ApiProperty({ nullable: true })
  transportType!: string | null;

  @ApiProperty({ nullable: true })
  documentNumber!: string | null;
}
