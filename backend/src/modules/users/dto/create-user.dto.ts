import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MaxLength(100)
  username!: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(4)
  password!: string;

  @ApiProperty({ example: 'Главный администратор' })
  @IsString()
  @MaxLength(255)
  fullName!: string;

  @ApiProperty({ example: 'admin@example.com', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string | null;

  @ApiProperty({ example: '+992900000000', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  roleId!: number;

  @ApiProperty({ example: 1, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  organizationId?: number | null;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
