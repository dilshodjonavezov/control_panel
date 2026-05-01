import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateMaternityRecordDto } from './dto/create-maternity-record.dto';
import { MaternityRecordResponseDto } from './dto/maternity-record-response.dto';
import { UpdateMaternityRecordDto } from './dto/update-maternity-record.dto';
import { MaternityService } from './maternity.service';

@ApiTags('MaternityRecords')
@ApiBearerAuth('access-token')
@Roles('maternity', 'admin', 'superadmin')
@Controller('maternity-records')
export class MaternityController {
  constructor(private readonly maternityService: MaternityService) {}

  @Post()
  @ApiOperation({ summary: 'Create maternity record' })
  @ApiOkResponse({ type: MaternityRecordResponseDto })
  create(@Body() dto: CreateMaternityRecordDto) {
    return this.maternityService.create(dto);
  }

  @Get()
  @Roles('maternity', 'zags', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Get maternity records list' })
  @ApiQuery({ name: 'id', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'organizationId', required: false, type: Number })
  @ApiOkResponse({ type: MaternityRecordResponseDto, isArray: true })
  findAll(
    @Query('id') id?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.maternityService.findAll({ id, search, status, userId, organizationId });
  }

  @Get(':id')
  @Roles('maternity', 'zags', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Get maternity record by id' })
  @ApiOkResponse({ type: MaternityRecordResponseDto })
  findOne(@Param('id') id: string) {
    return this.maternityService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update maternity record' })
  @ApiOkResponse({ type: MaternityRecordResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateMaternityRecordDto) {
    return this.maternityService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete maternity record' })
  remove(@Param('id') id: string) {
    return this.maternityService.remove(id);
  }
}
