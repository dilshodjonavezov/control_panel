import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateMedicalVisitDto } from './dto/create-medical-visit.dto';
import { MedicalVisitResponseDto } from './dto/medical-visit-response.dto';
import { UpdateMedicalVisitDto } from './dto/update-medical-visit.dto';
import { MedicalVisitsService } from './medical-visits.service';

@ApiTags('MedicalVisits')
@Roles('clinic', 'vvk', 'admin', 'superadmin')
@Controller('medical-visits')
export class MedicalVisitsController {
  constructor(private readonly medicalVisitsService: MedicalVisitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create medical visit' })
  @ApiOkResponse({ type: MedicalVisitResponseDto })
  create(@Body() dto: CreateMedicalVisitDto) {
    return this.medicalVisitsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get medical visits list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'peopleId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiOkResponse({ type: MedicalVisitResponseDto, isArray: true })
  findAll(
    @Query('search') search?: string,
    @Query('peopleId') peopleId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.medicalVisitsService.findAll({ search, peopleId, userId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medical visit by id' })
  @ApiOkResponse({ type: MedicalVisitResponseDto })
  findOne(@Param('id') id: string) {
    return this.medicalVisitsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace medical visit' })
  @ApiOkResponse({ type: MedicalVisitResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateMedicalVisitDto) {
    return this.medicalVisitsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete medical visit' })
  remove(@Param('id') id: string) {
    return this.medicalVisitsService.remove(id);
  }
}
