import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateVvkResultDto } from './dto/create-vvk-result.dto';
import { UpdateVvkResultDto } from './dto/update-vvk-result.dto';
import { VvkResultResponseDto } from './dto/vvk-result-response.dto';
import { VvkResultsService } from './vvk-results.service';

@ApiTags('VvkResults')
@Roles('vvk', 'admin', 'superadmin')
@Controller('vvk-results')
export class VvkResultsController {
  constructor(private readonly vvkResultsService: VvkResultsService) {}

  @Post()
  @ApiOperation({ summary: 'Create VVK result' })
  @ApiOkResponse({ type: VvkResultResponseDto })
  create(@Body() dto: CreateVvkResultDto) {
    return this.vvkResultsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get VVK results list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'peopleId', required: false, type: Number })
  @ApiQuery({ name: 'queueStatus', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiOkResponse({ type: VvkResultResponseDto, isArray: true })
  findAll(
    @Query('search') search?: string,
    @Query('peopleId') peopleId?: string,
    @Query('queueStatus') queueStatus?: string,
    @Query('category') category?: string,
  ) {
    return this.vvkResultsService.findAll({ search, peopleId, queueStatus, category });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get VVK result by id' })
  @ApiOkResponse({ type: VvkResultResponseDto })
  findOne(@Param('id') id: string) {
    return this.vvkResultsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace VVK result' })
  @ApiOkResponse({ type: VvkResultResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateVvkResultDto) {
    return this.vvkResultsService.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch VVK result' })
  @ApiOkResponse({ type: VvkResultResponseDto })
  patch(@Param('id') id: string, @Body() dto: UpdateVvkResultDto) {
    return this.vvkResultsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete VVK result' })
  remove(@Param('id') id: string) {
    return this.vvkResultsService.remove(id);
  }
}
