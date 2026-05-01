import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ nullable: true })
  email!: string | null;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  lastLoginAt!: Date | null;

  @ApiProperty()
  roleId!: number;

  @ApiProperty({ nullable: true })
  organizationId!: number | null;

  @ApiProperty({ nullable: true })
  roleCode!: string | null;

  @ApiProperty({ nullable: true })
  roleName!: string | null;

  @ApiProperty({ nullable: true })
  organizationName!: string | null;
}
