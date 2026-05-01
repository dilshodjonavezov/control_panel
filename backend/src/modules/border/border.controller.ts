import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { BorderCrossingResponseDto } from './dto/border-crossing-response.dto';
import { CreateBorderCrossingDto } from './dto/create-border-crossing.dto';
import { UpdateBorderCrossingDto } from './dto/update-border-crossing.dto';
import { BorderService } from './border.service';

@ApiTags('BorderCrossings')
@Roles('border', 'admin', 'superadmin')
@Controller('border-crossings')
export class BorderController {
  constructor(private readonly borderService: BorderService) {}

  @Post()
  @ApiOperation({ summary: 'Create border crossing record' })
  @ApiOkResponse({ type: BorderCrossingResponseDto })
  create(@Body() dto: CreateBorderCrossingDto) {
    return this.borderService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get border crossing records list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'peopleId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'outsideBorder', required: false, type: Boolean })
  @ApiOkResponse({ type: BorderCrossingResponseDto, isArray: true })
  findAll(
    @Query('search') search?: string,
    @Query('peopleId') peopleId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('country') country?: string,
    @Query('outsideBorder') outsideBorder?: string,
  ) {
    return this.borderService.findAll({ search, peopleId, userId, status, country, outsideBorder });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get border crossing record by id' })
  @ApiOkResponse({ type: BorderCrossingResponseDto })
  findOne(@Param('id') id: string) {
    return this.borderService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace border crossing record' })
  @ApiOkResponse({ type: BorderCrossingResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateBorderCrossingDto) {
    return this.borderService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete border crossing record' })
  remove(@Param('id') id: string) {
    return this.borderService.remove(id);
  }
}
