import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateResidenceRecordDto } from './dto/create-residence-record.dto';
import { ResidenceRecordResponseDto } from './dto/residence-record-response.dto';
import { UpdateResidenceRecordDto } from './dto/update-residence-record.dto';
import { ResidenceRecordsService } from './residence-records.service';

@ApiTags('ResidenceRecords')
@Roles('jek', 'admin', 'superadmin')
@Controller('residence-records')
export class ResidenceRecordsController {
  constructor(private readonly residenceRecordsService: ResidenceRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create residence record' })
  @ApiOkResponse({ type: ResidenceRecordResponseDto })
  create(@Body() dto: CreateResidenceRecordDto) {
    return this.residenceRecordsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get residence records list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'peopleId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'address', required: false, type: String })
  @ApiOkResponse({ type: ResidenceRecordResponseDto, isArray: true })
  findAll(
    @Query('search') search?: string,
    @Query('peopleId') peopleId?: string,
    @Query('userId') userId?: string,
    @Query('active') active?: string,
    @Query('address') address?: string,
  ) {
    return this.residenceRecordsService.findAll({ search, peopleId, userId, active, address });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get residence record by id' })
  @ApiOkResponse({ type: ResidenceRecordResponseDto })
  findOne(@Param('id') id: string) {
    return this.residenceRecordsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace residence record' })
  @ApiOkResponse({ type: ResidenceRecordResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateResidenceRecordDto) {
    return this.residenceRecordsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete residence record' })
  remove(@Param('id') id: string) {
    return this.residenceRecordsService.remove(id);
  }
}
