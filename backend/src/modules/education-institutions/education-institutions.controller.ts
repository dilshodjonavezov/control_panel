import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateEducationInstitutionDto } from './dto/create-education-institution.dto';
import { EducationInstitutionResponseDto } from './dto/education-institution-response.dto';
import { UpdateEducationInstitutionDto } from './dto/update-education-institution.dto';
import { EducationInstitutionsService } from './education-institutions.service';

@ApiTags('EducationInstitutions')
@Roles('school', 'university', 'admin', 'superadmin')
@Controller('education-institutions')
export class EducationInstitutionsController {
  constructor(private readonly educationInstitutionsService: EducationInstitutionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create education institution' })
  @ApiOkResponse({ type: EducationInstitutionResponseDto })
  create(@Body() dto: CreateEducationInstitutionDto) {
    return this.educationInstitutionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get education institutions list' })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ type: EducationInstitutionResponseDto, isArray: true })
  findAll(@Query('type') type?: string, @Query('search') search?: string) {
    return this.educationInstitutionsService.findAll({ type, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get education institution by id' })
  @ApiOkResponse({ type: EducationInstitutionResponseDto })
  findOne(@Param('id') id: string) {
    return this.educationInstitutionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace education institution' })
  @ApiOkResponse({ type: EducationInstitutionResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateEducationInstitutionDto) {
    return this.educationInstitutionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete education institution' })
  remove(@Param('id') id: string) {
    return this.educationInstitutionsService.remove(id);
  }
}
