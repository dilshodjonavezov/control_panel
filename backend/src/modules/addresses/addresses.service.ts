import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { Address, AddressDocument } from './schemas/address.schema';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ADDRESS_SEED } from './addresses.seed';

@Injectable()
export class AddressesService implements OnModuleInit {
  constructor(
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
    private readonly countersService: CountersService,
    private readonly citizensService: CitizensService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.ENABLE_DOMAIN_SEEDS === 'true') {
      await this.seedDefaults();
    }
  }

  async create(dto: CreateAddressDto): Promise<Record<string, unknown>> {
    await this.citizensService.findOne(dto.citizenId);

    const nextId = await this.countersService.getNextSequence('addresses');
    await this.addressModel.create({
      id: nextId,
      citizenId: dto.citizenId,
      familyId: dto.familyId ?? null,
      type: dto.type ?? 'REGISTRATION',
      region: dto.region,
      district: dto.district ?? null,
      city: dto.city ?? null,
      street: dto.street,
      house: dto.house,
      apartment: dto.apartment ?? null,
      postalCode: dto.postalCode ?? null,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      isActive: dto.isActive ?? !dto.endDate,
      fullAddress: this.buildFullAddress(dto),
      notes: dto.notes ?? null,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: {
    citizenId?: string;
    familyId?: string;
    type?: string;
    isActive?: string;
    search?: string;
  }): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<AddressDocument> = {};
    if (filters.citizenId) query.citizenId = Number(filters.citizenId);
    if (filters.familyId) query.familyId = Number(filters.familyId);
    if (filters.type?.trim()) query.type = filters.type.trim();
    if (filters.isActive === 'true') query.isActive = true;
    if (filters.isActive === 'false') query.isActive = false;
    if (filters.search?.trim()) {
      query.fullAddress = { $regex: filters.search.trim(), $options: 'i' };
    }

    const addresses = await this.addressModel.find(query).sort({ id: -1 }).lean();
    return Promise.all(addresses.map((address) => this.mapAddress(address)));
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Address');
    const address = await this.addressModel.findOne({ id: numericId }).lean();
    if (!address) {
      throw new NotFoundException(`Address ${numericId} not found`);
    }
    return this.mapAddress(address);
  }

  async update(id: number | string, dto: UpdateAddressDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Address');
    const existing = await this.addressModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Address ${numericId} not found`);
    }

    const payload: Record<string, unknown> = {};
    if (dto.citizenId !== undefined) {
      await this.citizensService.findOne(dto.citizenId);
      payload.citizenId = dto.citizenId;
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'familyId')) payload.familyId = dto.familyId ?? null;
    if (dto.type !== undefined) payload.type = dto.type;
    if (dto.region !== undefined) payload.region = dto.region;
    if (dto.district !== undefined) payload.district = dto.district ?? null;
    if (dto.city !== undefined) payload.city = dto.city ?? null;
    if (dto.street !== undefined) payload.street = dto.street;
    if (dto.house !== undefined) payload.house = dto.house;
    if (dto.apartment !== undefined) payload.apartment = dto.apartment ?? null;
    if (dto.postalCode !== undefined) payload.postalCode = dto.postalCode ?? null;
    if (dto.startDate !== undefined) payload.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) payload.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;
    if (dto.notes !== undefined) payload.notes = dto.notes ?? null;

    payload.fullAddress = this.buildFullAddress({
      region: dto.region ?? existing.region,
      district: dto.district !== undefined ? dto.district ?? null : existing.district,
      city: dto.city !== undefined ? dto.city ?? null : existing.city,
      street: dto.street ?? existing.street,
      house: dto.house ?? existing.house,
      apartment: dto.apartment !== undefined ? dto.apartment ?? null : existing.apartment,
    });

    const updated = await this.addressModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException(`Address ${numericId} not found`);
    }
    return this.mapAddress(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Address');
    const deleted = await this.addressModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`Address ${numericId} not found`);
    }
  }

  private async mapAddress(address: Record<string, any>): Promise<Record<string, unknown>> {
    const citizen = await this.safeFindCitizen(address.citizenId);
    return {
      id: address.id,
      citizenId: address.citizenId,
      citizenFullName: citizen?.fullName ?? null,
      familyId: address.familyId ?? null,
      type: address.type,
      region: address.region,
      district: address.district ?? null,
      city: address.city ?? null,
      street: address.street,
      house: address.house,
      apartment: address.apartment ?? null,
      postalCode: address.postalCode ?? null,
      fullAddress: address.fullAddress,
      startDate: this.toIsoDate(address.startDate),
      endDate: address.endDate ? this.toIsoDate(address.endDate) : null,
      isActive: address.isActive,
      notes: address.notes ?? null,
    };
  }

  private buildFullAddress(parts: {
    region: string;
    district?: string | null;
    city?: string | null;
    street: string;
    house: string;
    apartment?: string | null;
  }): string {
    return [
      parts.region,
      parts.district ?? null,
      parts.city ?? null,
      parts.street,
      `house ${parts.house}`,
      parts.apartment ? `apt ${parts.apartment}` : null,
    ]
      .filter((part) => !!part && String(part).trim().length > 0)
      .join(', ');
  }

  private async safeFindCitizen(citizenId: number): Promise<Record<string, unknown> | null> {
    try {
      return await this.citizensService.findOne(citizenId);
    } catch {
      return null;
    }
  }

  private toIsoDate(value: Date | string): string {
    return new Date(value).toISOString().split('T')[0];
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }

  private async seedDefaults(): Promise<void> {
    for (const item of ADDRESS_SEED) {
      const existing = await this.addressModel
        .findOne({ citizenId: item.citizenId, street: item.street, house: item.house })
        .lean();

      if (existing) {
        continue;
      }

      await this.create(item as CreateAddressDto);
    }
  }
}

