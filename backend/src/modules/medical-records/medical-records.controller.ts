import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { MedicalRecordResponseDto } from './dto/medical-record-response.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordsService } from './medical-records.service';

@ApiTags('MedicalRecords')
@Roles('clinic', 'vvk', 'admin', 'superadmin', 'university', 'school')
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create medical record' })
  @ApiOkResponse({ type: MedicalRecordResponseDto })
  create(@Body() dto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get medical records list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'peopleId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiOkResponse({ type: MedicalRecordResponseDto, isArray: true })
  findAll(@Query('search') search?: string, @Query('peopleId') peopleId?: string, @Query('userId') userId?: string) {
    return this.medicalRecordsService.findAll({ search, peopleId, userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medical record by id' })
  @ApiOkResponse({ type: MedicalRecordResponseDto })
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace medical record' })
  @ApiOkResponse({ type: MedicalRecordResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateMedicalRecordDto) {
    return this.medicalRecordsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete medical record' })
  remove(@Param('id') id: string) {
    return this.medicalRecordsService.remove(id);
  }
}
