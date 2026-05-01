import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateZagsActDto } from './dto/create-zags-act.dto';
import { UpdateZagsActDto } from './dto/update-zags-act.dto';
import { ZagsActResponseDto } from './dto/zags-act-response.dto';
import { ZagsService } from './zags.service';

@ApiTags('ZagsActs')
@ApiBearerAuth('access-token')
@Roles('zags', 'admin', 'superadmin')
@Controller('zags-acts')
export class ZagsController {
  constructor(private readonly zagsService: ZagsService) {}

  @Post()
  @Roles('zags', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Create ZAGS act' })
  @ApiOkResponse({ type: ZagsActResponseDto })
  create(@Body() dto: CreateZagsActDto) {
    return this.zagsService.create(dto);
  }

  @Get()
  @Roles('maternity', 'zags', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Get ZAGS acts list' })
  @ApiQuery({ name: 'id', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'actType', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'citizenId', required: false, type: Number })
  @ApiQuery({ name: 'maternityRecordId', required: false, type: Number })
  @ApiOkResponse({ type: ZagsActResponseDto, isArray: true })
  findAll(
    @Query('id') id?: string,
    @Query('search') search?: string,
    @Query('actType') actType?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('citizenId') citizenId?: string,
    @Query('maternityRecordId') maternityRecordId?: string,
  ) {
    return this.zagsService.findAll({ id, search, actType, status, userId, citizenId, maternityRecordId });
  }

  @Get(':id')
  @Roles('maternity', 'zags', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Get ZAGS act by id' })
  @ApiOkResponse({ type: ZagsActResponseDto })
  findOne(@Param('id') id: string) {
    return this.zagsService.findOne(id);
  }

  @Patch(':id')
  @Roles('maternity', 'zags', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Update ZAGS act' })
  @ApiOkResponse({ type: ZagsActResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateZagsActDto) {
    return this.zagsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('zags', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Delete ZAGS act' })
  remove(@Param('id') id: string) {
    return this.zagsService.remove(id);
  }
}
