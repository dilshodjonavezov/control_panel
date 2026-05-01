import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateEducationRecordDto } from './dto/create-education-record.dto';
import { EducationRecordResponseDto } from './dto/education-record-response.dto';
import { ProcessEducationExpulsionDto } from './dto/process-education-expulsion.dto';
import { ReviewEducationDefermentDto } from './dto/review-education-deferment.dto';
import { UpdateEducationRecordDto } from './dto/update-education-record.dto';
import { EducationRecordsService } from './education-records.service';

@ApiTags('EducationRecords')
@Roles('university', 'admin', 'superadmin')
@Controller('education-records')
export class EducationRecordsController {
  constructor(private readonly educationRecordsService: EducationRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create education record' })
  @ApiOkResponse({ type: EducationRecordResponseDto })
  create(@Body() dto: CreateEducationRecordDto) {
    return this.educationRecordsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get education records list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'peopleId', required: false, type: Number })
  @ApiQuery({ name: 'institutionId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiOkResponse({ type: EducationRecordResponseDto, isArray: true })
  findAll(
    @Query('search') search?: string,
    @Query('peopleId') peopleId?: string,
    @Query('institutionId') institutionId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.educationRecordsService.findAll({ search, peopleId, institutionId, userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get education record by id' })
  @ApiOkResponse({ type: EducationRecordResponseDto })
  findOne(@Param('id') id: string) {
    return this.educationRecordsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace education record' })
  @ApiOkResponse({ type: EducationRecordResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateEducationRecordDto) {
    return this.educationRecordsService.update(id, dto);
  }

  @Post(':id/review-deferment')
  @ApiOperation({ summary: 'Review education deferment in voenkomat' })
  @ApiOkResponse({ type: EducationRecordResponseDto })
  reviewDeferment(@Param('id') id: string, @Body() dto: ReviewEducationDefermentDto) {
    return this.educationRecordsService.reviewDeferment(id, dto);
  }

  @Post(':id/process-expulsion')
  @ApiOperation({ summary: 'Process expulsion notice in voenkomat' })
  @ApiOkResponse({ type: EducationRecordResponseDto })
  processExpulsion(@Param('id') id: string, @Body() dto: ProcessEducationExpulsionDto) {
    return this.educationRecordsService.processExpulsion(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete education record' })
  remove(@Param('id') id: string) {
    return this.educationRecordsService.remove(id);
  }
}
