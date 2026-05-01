import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateSchoolRecordDto } from './dto/create-school-record.dto';
import { SchoolRecordResponseDto } from './dto/school-record-response.dto';
import { UpdateSchoolRecordDto } from './dto/update-school-record.dto';
import { SchoolService } from './school.service';

@ApiTags('SchoolRecords')
@Roles('school', 'admin', 'superadmin')
@Controller('school-records')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  @ApiOperation({ summary: 'Create school record' })
  @ApiOkResponse({ type: SchoolRecordResponseDto })
  create(@Body() dto: CreateSchoolRecordDto) {
    return this.schoolService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get school records list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'peopleId', required: false, type: Number })
  @ApiQuery({ name: 'institutionId', required: false, type: Number })
  @ApiOkResponse({ type: SchoolRecordResponseDto, isArray: true })
  findAll(
    @Query('search') search?: string,
    @Query('peopleId') peopleId?: string,
    @Query('institutionId') institutionId?: string,
  ) {
    return this.schoolService.findAll({ search, peopleId, institutionId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get school record by id' })
  @ApiOkResponse({ type: SchoolRecordResponseDto })
  findOne(@Param('id') id: string) {
    return this.schoolService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace school record' })
  @ApiOkResponse({ type: SchoolRecordResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateSchoolRecordDto) {
    return this.schoolService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete school record' })
  remove(@Param('id') id: string) {
    return this.schoolService.remove(id);
  }
}
