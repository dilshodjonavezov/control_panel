import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/roles/roles.decorator';
import { AddressResponseDto } from './dto/address-response.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressesService } from './addresses.service';

@ApiTags('Addresses')
@Roles('jek', 'admin', 'superadmin')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create address' })
  @ApiOkResponse({ type: AddressResponseDto })
  create(@Body() dto: CreateAddressDto) {
    return this.addressesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get addresses list' })
  @ApiQuery({ name: 'citizenId', required: false, type: Number })
  @ApiQuery({ name: 'familyId', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ type: AddressResponseDto, isArray: true })
  findAll(
    @Query('citizenId') citizenId?: string,
    @Query('familyId') familyId?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.addressesService.findAll({ citizenId, familyId, type, isActive, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address by id' })
  @ApiOkResponse({ type: AddressResponseDto })
  findOne(@Param('id') id: string) {
    return this.addressesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update address' })
  @ApiOkResponse({ type: AddressResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address' })
  remove(@Param('id') id: string) {
    return this.addressesService.remove(id);
  }
}
