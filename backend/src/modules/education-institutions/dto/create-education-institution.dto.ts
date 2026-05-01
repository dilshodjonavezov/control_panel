import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateEducationInstitutionDto {
  @ApiProperty({ example: 'School No. 21' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'SCHOOL' })
  @IsString()
  @MaxLength(50)
  type!: string;

  @ApiProperty({ example: 'Dushanbe', nullable: true })
  @IsString()
  @MaxLength(255)
  address!: string;

  @ApiProperty({ example: 'Municipal school', nullable: true })
  @IsString()
  @MaxLength(1000)
  description!: string;
}
