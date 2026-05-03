import { ApiProperty } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  city!: string | null;

  @ApiProperty({ nullable: true })
  addressText!: string | null;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ nullable: true })
  email!: string | null;

  @ApiProperty({ nullable: true })
  headFullName!: string | null;

  @ApiProperty({ nullable: true })
  headPosition!: string | null;

  @ApiProperty({ nullable: true })
  serviceArea!: string | null;

  @ApiProperty({ nullable: true })
  licenseNumber!: string | null;

  @ApiProperty({ nullable: true })
  capacity!: number | null;

  @ApiProperty({ nullable: true })
  educationInstitutionId!: number | null;

  @ApiProperty()
  isActive!: boolean;
}
