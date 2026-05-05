import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CreateFamilyDto } from './dto/create-family.dto';
import { FamilyResponseDto } from './dto/family-response.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamiliesService } from './families.service';

@ApiTags('Families')
@Roles('jek', 'admin', 'superadmin', 'school', 'university', 'clinic', 'vvk', 'border', 'passport', 'maternity', 'zags')
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @ApiOperation({ summary: 'Create family' })
  @ApiOkResponse({ type: FamilyResponseDto })
  create(@Body() dto: CreateFamilyDto) {
    return this.familiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get families list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'citizenId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiOkResponse({ type: FamilyResponseDto, isArray: true })
  findAll(
    @Query('search') search?: string,
    @Query('citizenId') citizenId?: string,
    @Query('status') status?: string,
  ) {
    return this.familiesService.findAll({ search, citizenId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get family by id' })
  @ApiOkResponse({ type: FamilyResponseDto })
  findOne(@Param('id') id: string) {
    return this.familiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update family' })
  @ApiOkResponse({ type: FamilyResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateFamilyDto) {
    return this.familiesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete family' })
  remove(@Param('id') id: string) {
    return this.familiesService.remove(id);
  }
}
