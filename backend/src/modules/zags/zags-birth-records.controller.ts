import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZagsService } from './zags.service';

@ApiTags('ZagsBirthRecords')
@Controller('zags-birth-records')
export class ZagsBirthRecordsController {
  constructor(private readonly zagsService: ZagsService) {}

  @Get()
  @ApiOperation({ summary: 'Compatibility list endpoint for birth records' })
  @ApiOkResponse({ schema: { example: [{ id: 1, actNumber: 'ACT-1', childFullName: 'Каримов Али' }] } })
  findAll() {
    return this.zagsService.findBirthRecords();
  }

  @Post()
  @ApiOperation({ summary: 'Compatibility create endpoint for birth record' })
  create(@Body() dto: any) {
    return this.zagsService.createBirthRecord(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Compatibility update endpoint for birth record' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.zagsService.updateBirthRecord(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Compatibility delete endpoint for birth record' })
  remove(@Param('id') id: string) {
    return this.zagsService.remove(id);
  }
}
