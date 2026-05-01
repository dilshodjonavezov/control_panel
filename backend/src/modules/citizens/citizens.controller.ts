import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CitizenResponseDto } from './dto/citizen-response.dto';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { CitizensService } from './citizens.service';

@ApiTags('Citizens')
@Roles('admin', 'superadmin', 'jek', 'passport', 'school', 'university', 'clinic', 'border', 'vvk', 'maternity', 'zags')
@Controller('citizens')
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Post()
  @ApiOperation({ summary: 'Create citizen' })
  @ApiOkResponse({ type: CitizenResponseDto })
  create(@Body() createCitizenDto: CreateCitizenDto) {
    return this.citizensService.create(createCitizenDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get citizens list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ type: CitizenResponseDto, isArray: true })
  findAll(@Query('search') search?: string) {
    return this.citizensService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get citizen by id' })
  @ApiOkResponse({ type: CitizenResponseDto })
  findOne(@Param('id') id: string) {
    return this.citizensService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update citizen' })
  @ApiOkResponse({ type: CitizenResponseDto })
  update(@Param('id') id: string, @Body() updateCitizenDto: UpdateCitizenDto) {
    return this.citizensService.update(id, updateCitizenDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete citizen' })
  remove(@Param('id') id: string) {
    return this.citizensService.remove(id);
  }
}
