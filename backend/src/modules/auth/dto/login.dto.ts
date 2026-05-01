import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MaxLength(100)
  username!: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(4)
  password!: string;
}
