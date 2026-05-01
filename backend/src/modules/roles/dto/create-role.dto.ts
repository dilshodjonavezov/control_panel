import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'passport' })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'Паспортный стол Центральный' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
