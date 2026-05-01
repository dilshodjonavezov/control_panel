import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreatePassportRecordDto } from './dto/create-passport-record.dto';
import { PassportRecordResponseDto } from './dto/passport-record-response.dto';
import { UpdatePassportRecordDto } from './dto/update-passport-record.dto';
import { PassportService } from './passport.service';

@ApiTags('PassportRecords')
@Roles('passport', 'admin', 'superadmin')
@Controller('passport-records')
export class PassportController {
  constructor(private readonly passportService: PassportService) {}

  @Post()
  @ApiOperation({ summary: 'Create passport record' })
  @ApiOkResponse({ type: PassportRecordResponseDto })
  create(@Body() dto: CreatePassportRecordDto) {
    return this.passportService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get passport records list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'peopleId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiOkResponse({ type: PassportRecordResponseDto, isArray: true })
  findAll(
    @Query('search') search?: string,
    @Query('peopleId') peopleId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.passportService.findAll({ search, peopleId, userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get passport record by id' })
  @ApiOkResponse({ type: PassportRecordResponseDto })
  findOne(@Param('id') id: string) {
    return this.passportService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace passport record' })
  @ApiOkResponse({ type: PassportRecordResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdatePassportRecordDto) {
    return this.passportService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete passport record' })
  remove(@Param('id') id: string) {
    return this.passportService.remove(id);
  }
}
