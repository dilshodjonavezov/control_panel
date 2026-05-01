import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CITIZEN_GENDERS, CITIZEN_LIFE_STATUSES } from '../citizens/citizen.constants';
import { MATERNITY_STATUSES } from '../maternity/maternity.constants';
import { ORGANIZATION_TYPES } from '../organizations/organization.constants';
import { ROLE_SEED } from '../roles/role.constants';
import { ZAGS_ACT_TYPES, ZAGS_STATUSES } from '../zags/zags.constants';

@ApiTags('Enums')
@Controller('enums')
export class EnumsController {
  @Get('roles')
  @ApiOperation({ summary: 'Get role enum dictionary' })
  getRoles() {
    return Object.fromEntries(ROLE_SEED.map((role) => [role.code, role.name]));
  }

  @Get('organization-types')
  @ApiOperation({ summary: 'Get organization types' })
  getOrganizationTypes() {
    return ORGANIZATION_TYPES;
  }

  @Get('genders')
  @ApiOperation({ summary: 'Get gender values' })
  getGenders() {
    return CITIZEN_GENDERS;
  }

  @Get('life-statuses')
  @ApiOperation({ summary: 'Get citizen life statuses' })
  getLifeStatuses() {
    return CITIZEN_LIFE_STATUSES;
  }

  @Get('maternity-statuses')
  @ApiOperation({ summary: 'Get maternity statuses' })
  getMaternityStatuses() {
    return MATERNITY_STATUSES;
  }

  @Get('zags-act-types')
  @ApiOperation({ summary: 'Get ZAGS act types' })
  getZagsActTypes() {
    return ZAGS_ACT_TYPES;
  }

  @Get('zags-statuses')
  @ApiOperation({ summary: 'Get ZAGS statuses' })
  getZagsStatuses() {
    return ZAGS_STATUSES;
  }
}
