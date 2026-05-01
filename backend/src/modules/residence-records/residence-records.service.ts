import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { UsersService } from '../users/users.service';
import { CreateResidenceRecordDto } from './dto/create-residence-record.dto';
import { UpdateResidenceRecordDto } from './dto/update-residence-record.dto';
import { ResidenceRecord, ResidenceRecordDocument } from './schemas/residence-record.schema';

@Injectable()
export class ResidenceRecordsService {
  constructor(
    @InjectModel(ResidenceRecord.name)
    private readonly residenceRecordModel: Model<ResidenceRecordDocument>,
    private readonly countersService: CountersService,
    private readonly citizensService: CitizensService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateResidenceRecordDto): Promise<Record<string, unknown>> {
    await this.citizensService.findOne(dto.peopleId);
    await this.usersService.findOne(dto.userId);

    const nextId = await this.countersService.getNextSequence('residence_records');
    await this.residenceRecordModel.create({
      id: nextId,
      peopleId: dto.peopleId,
      address: dto.address,
      registeredAt: new Date(dto.registeredAt),
      unregisteredAt: dto.unregisteredAt ? new Date(dto.unregisteredAt) : null,
      isActive: this.resolveIsActive(dto.unregisteredAt ?? null),
      userId: dto.userId,
      comment: dto.comment ?? null,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: {
    search?: string;
    peopleId?: string;
    userId?: string;
    active?: string;
    address?: string;
  } = {}): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<ResidenceRecordDocument> = {};
    if (filters.peopleId) query.peopleId = Number(filters.peopleId);
    if (filters.userId) query.userId = Number(filters.userId);
    if (filters.active === 'true') query.isActive = true;
    if (filters.active === 'false') query.isActive = false;

    const regexParts = [filters.search?.trim(), filters.address?.trim()].filter((item) => !!item);
    if (regexParts.length > 0) {
      query.address = { $regex: regexParts.join(' '), $options: 'i' };
    }

    const records = await this.residenceRecordModel.find(query).sort({ id: -1 }).lean();
    const mapped = await Promise.all(records.map((record) => this.mapRecord(record)));

    if (!filters.search?.trim()) {
      return mapped;
    }

    const searchValue = filters.search.trim().toLowerCase();
    return mapped.filter((record) => {
      const peopleFullName = String(record.peopleFullName ?? '').toLowerCase();
      const address = String(record.address ?? '').toLowerCase();
      const userName = String(record.userName ?? '').toLowerCase();
      return peopleFullName.includes(searchValue) || address.includes(searchValue) || userName.includes(searchValue);
    });
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Residence record');
    const record = await this.residenceRecordModel.findOne({ id: numericId }).lean();
    if (!record) {
      throw new NotFoundException(`Residence record ${numericId} not found`);
    }
    return this.mapRecord(record);
  }

  async update(id: number | string, dto: UpdateResidenceRecordDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Residence record');
    const existing = await this.residenceRecordModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Residence record ${numericId} not found`);
    }

    const payload: Record<string, unknown> = {};
    if (dto.peopleId !== undefined) {
      await this.citizensService.findOne(dto.peopleId);
      payload.peopleId = dto.peopleId;
    }
    if (dto.userId !== undefined) {
      await this.usersService.findOne(dto.userId);
      payload.userId = dto.userId;
    }
    if (dto.address !== undefined) payload.address = dto.address;
    if (dto.registeredAt !== undefined) payload.registeredAt = new Date(dto.registeredAt);
    if (dto.unregisteredAt !== undefined) payload.unregisteredAt = dto.unregisteredAt ? new Date(dto.unregisteredAt) : null;
    if (dto.comment !== undefined) payload.comment = dto.comment ?? null;

    const unregisteredAt =
      dto.unregisteredAt !== undefined
        ? dto.unregisteredAt ?? null
        : existing.unregisteredAt
          ? new Date(existing.unregisteredAt).toISOString()
          : null;
    payload.isActive = this.resolveIsActive(unregisteredAt);

    const updated = await this.residenceRecordModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException(`Residence record ${numericId} not found`);
    }
    return this.mapRecord(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Residence record');
    const deleted = await this.residenceRecordModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`Residence record ${numericId} not found`);
    }
  }

  private async mapRecord(record: Record<string, any>): Promise<Record<string, unknown>> {
    const [citizen, user] = await Promise.all([
      this.safeFindCitizen(record.peopleId),
      this.safeFindUser(record.userId),
    ]);

    return {
      id: record.id,
      peopleId: record.peopleId,
      peopleFullName: citizen?.fullName ?? null,
      address: record.address ?? null,
      registeredAt: record.registeredAt ? new Date(record.registeredAt).toISOString() : null,
      unregisteredAt: record.unregisteredAt ? new Date(record.unregisteredAt).toISOString() : null,
      isActive: Boolean(record.isActive),
      userId: record.userId,
      userName: user?.fullName ?? null,
      comment: record.comment ?? null,
    };
  }

  private resolveIsActive(unregisteredAt: string | null): boolean {
    if (!unregisteredAt) {
      return true;
    }
    return new Date(unregisteredAt).getTime() > Date.now();
  }

  private async safeFindCitizen(citizenId: number): Promise<Record<string, unknown> | null> {
    try {
      return await this.citizensService.findOne(citizenId);
    } catch {
      return null;
    }
  }

  private async safeFindUser(userId: number): Promise<Record<string, unknown> | null> {
    try {
      return await this.usersService.findOne(userId);
    } catch {
      return null;
    }
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }
}
