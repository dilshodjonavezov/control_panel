import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateMilitaryRecordDto } from './dto/create-military-record.dto';
import { MilitaryRecordResponseDto } from './dto/military-record-response.dto';
import { ReviewMilitaryDefermentDto } from './dto/review-military-deferment.dto';
import { UpdateMilitaryRecordDto } from './dto/update-military-record.dto';
import { MilitaryService } from './military.service';

@ApiTags('MilitaryRecords')
@Roles('vvk', 'admin', 'superadmin')
@Controller('military-records')
export class MilitaryController {
  constructor(private readonly militaryService: MilitaryService) {}

  @Post()
  @ApiOperation({ summary: 'Create military record' })
  @ApiOkResponse({ type: MilitaryRecordResponseDto })
  create(@Body() dto: CreateMilitaryRecordDto) {
    return this.militaryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get military records list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'peopleId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'militaryStatus', required: false, type: String })
  @ApiQuery({ name: 'office', required: false, type: String })
  @ApiOkResponse({ type: MilitaryRecordResponseDto, isArray: true })
  findAll(
    @Query('search') search?: string,
    @Query('peopleId') peopleId?: string,
    @Query('status') status?: string,
    @Query('militaryStatus') militaryStatus?: string,
    @Query('office') office?: string,
  ) {
    return this.militaryService.findAll({ search, peopleId, status, militaryStatus, office });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get military record by id' })
  @ApiOkResponse({ type: MilitaryRecordResponseDto })
  findOne(@Param('id') id: string) {
    return this.militaryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace military record' })
  @ApiOkResponse({ type: MilitaryRecordResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateMilitaryRecordDto) {
    return this.militaryService.update(id, dto);
  }

  @Post(':id/review-deferment')
  @ApiOperation({ summary: 'Review military deferment basis in voenkomat' })
  @ApiOkResponse({ type: MilitaryRecordResponseDto })
  reviewDeferment(@Param('id') id: string, @Body() dto: ReviewMilitaryDefermentDto) {
    return this.militaryService.reviewDeferment(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete military record' })
  remove(@Param('id') id: string) {
    return this.militaryService.remove(id);
  }
}
