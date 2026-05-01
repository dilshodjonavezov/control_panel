import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { CitizensService } from './citizens.service';

@ApiTags('People')
@Roles('admin', 'superadmin', 'jek', 'passport', 'school', 'university', 'clinic', 'border', 'vvk', 'maternity', 'zags')
@Controller('people')
export class PeopleController {
  constructor(private readonly citizensService: CitizensService) {}

  @Get()
  @ApiOperation({ summary: 'Compatibility endpoint for people list' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({
    schema: {
      example: [{ id: 1, fullName: 'Каримов Али Саидович' }],
    },
  })
  findAll(@Query('search') search?: string) {
    return this.citizensService.getPeopleList(search);
  }
}
