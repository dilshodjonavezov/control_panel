import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { UsersService } from '../users/users.service';
import { BORDER_CROSSING_SEED } from './border.seed';
import { CreateBorderCrossingDto } from './dto/create-border-crossing.dto';
import { UpdateBorderCrossingDto } from './dto/update-border-crossing.dto';
import { BorderCrossing, BorderCrossingDocument } from './schemas/border-crossing.schema';

@Injectable()
export class BorderService implements OnModuleInit {
  constructor(
    @InjectModel(BorderCrossing.name)
    private readonly borderCrossingModel: Model<BorderCrossingDocument>,
    private readonly countersService: CountersService,
    private readonly citizensService: CitizensService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaults();
  }

  async create(dto: CreateBorderCrossingDto): Promise<Record<string, unknown>> {
    await this.citizensService.findOne(dto.peopleId);
    const user = await this.usersService.findOne(dto.userId);

    const nextId = await this.countersService.getNextSequence('border_crossings');
    await this.borderCrossingModel.create({
      id: nextId,
      peopleId: dto.peopleId,
      userId: dto.userId,
      organizationId: (user.organizationId as number | null) ?? null,
      departureDate: new Date(dto.departureDate),
      returnDate: dto.returnDate ? new Date(dto.returnDate) : null,
      outsideBorder: dto.outsideBorder,
      country: dto.country,
      description: dto.description ?? null,
      eventType: dto.eventType ?? 'EXIT',
      direction: dto.direction ?? 'OUTBOUND',
      status: dto.status ?? (dto.returnDate ? 'CLOSED' : 'OPEN'),
      purpose: dto.purpose ?? null,
      borderCheckpoint: dto.borderCheckpoint ?? null,
      transportType: dto.transportType ?? null,
      documentNumber: dto.documentNumber ?? null,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: {
    search?: string;
    peopleId?: string;
    userId?: string;
    status?: string;
    country?: string;
    outsideBorder?: string;
  } = {}): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<BorderCrossingDocument> = {};
    if (filters.peopleId) query.peopleId = Number(filters.peopleId);
    if (filters.userId) query.userId = Number(filters.userId);
    if (filters.status?.trim()) query.status = filters.status.trim();
    if (filters.country?.trim()) query.country = { $regex: filters.country.trim(), $options: 'i' };
    if (filters.outsideBorder === 'true') query.outsideBorder = true;
    if (filters.outsideBorder === 'false') query.outsideBorder = false;

    const records = await this.borderCrossingModel.find(query).sort({ id: -1 }).lean();
    const mapped = await Promise.all(records.map((record) => this.mapRecord(record)));

    if (!filters.search?.trim()) {
      return mapped;
    }
    const searchValue = filters.search.trim().toLowerCase();
    return mapped.filter((record) => {
      const person = String(record.peopleName ?? '').toLowerCase();
      const user = String(record.userName ?? '').toLowerCase();
      const country = String(record.country ?? '').toLowerCase();
      const description = String(record.description ?? '').toLowerCase();
      return person.includes(searchValue) || user.includes(searchValue) || country.includes(searchValue) || description.includes(searchValue);
    });
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Border crossing');
    const record = await this.borderCrossingModel.findOne({ id: numericId }).lean();
    if (!record) {
      throw new NotFoundException(`Border crossing ${numericId} not found`);
    }
    return this.mapRecord(record);
  }

  async update(id: number | string, dto: UpdateBorderCrossingDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Border crossing');
    const existing = await this.borderCrossingModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Border crossing ${numericId} not found`);
    }

    const payload: Record<string, unknown> = {};
    if (dto.peopleId !== undefined) {
      await this.citizensService.findOne(dto.peopleId);
      payload.peopleId = dto.peopleId;
    }
    if (dto.userId !== undefined) {
      const user = await this.usersService.findOne(dto.userId);
      payload.userId = dto.userId;
      payload.organizationId = (user.organizationId as number | null) ?? null;
    }
    if (dto.departureDate !== undefined) payload.departureDate = new Date(dto.departureDate);
    if (dto.returnDate !== undefined) payload.returnDate = dto.returnDate ? new Date(dto.returnDate) : null;
    if (dto.outsideBorder !== undefined) payload.outsideBorder = dto.outsideBorder;
    if (dto.country !== undefined) payload.country = dto.country;
    if (dto.description !== undefined) payload.description = dto.description ?? null;
    if (dto.eventType !== undefined) payload.eventType = dto.eventType;
    if (dto.direction !== undefined) payload.direction = dto.direction;
    if (dto.purpose !== undefined) payload.purpose = dto.purpose ?? null;
    if (dto.borderCheckpoint !== undefined) payload.borderCheckpoint = dto.borderCheckpoint ?? null;
    if (dto.transportType !== undefined) payload.transportType = dto.transportType ?? null;
    if (dto.documentNumber !== undefined) payload.documentNumber = dto.documentNumber ?? null;
    if (dto.status !== undefined) {
      payload.status = dto.status;
    } else if (dto.returnDate !== undefined) {
      payload.status = dto.returnDate ? 'CLOSED' : existing.status === 'CANCELLED' ? 'CANCELLED' : 'OPEN';
    }

    const updated = await this.borderCrossingModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException(`Border crossing ${numericId} not found`);
    }
    return this.mapRecord(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Border crossing');
    const deleted = await this.borderCrossingModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`Border crossing ${numericId} not found`);
    }
  }

  private async mapRecord(record: Record<string, any>): Promise<Record<string, unknown>> {
    const [citizen, user] = await Promise.all([
      this.safeFindCitizen(record.peopleId),
      this.safeFindUser(record.userId),
    ]);
    return {
      id: record.id,
      citizenId: record.peopleId,
      peopleId: record.peopleId,
      peopleName: citizen?.fullName ?? null,
      userId: record.userId,
      userName: user?.fullName ?? null,
      departureDate: new Date(record.departureDate).toISOString(),
      returnDate: record.returnDate ? new Date(record.returnDate).toISOString() : null,
      outsideBorder: Boolean(record.outsideBorder),
      country: record.country ?? null,
      description: record.description ?? null,
      eventType: record.eventType,
      direction: record.direction,
      status: record.status,
      purpose: record.purpose ?? null,
      borderCheckpoint: record.borderCheckpoint ?? null,
      transportType: record.transportType ?? null,
      documentNumber: record.documentNumber ?? null,
    };
  }

  private async seedDefaults(): Promise<void> {
    for (const item of BORDER_CROSSING_SEED) {
      const existing = await this.borderCrossingModel
        .findOne({ peopleId: item.peopleId, departureDate: new Date(item.departureDate), country: item.country })
        .lean();
      if (existing) continue;

      const citizen = await this.safeFindCitizen(item.peopleId);
      const user = await this.safeFindUserByUsername(item.username);
      if (!citizen || !user?.id) continue;

      const nextId = await this.countersService.getNextSequence('border_crossings');
      await this.borderCrossingModel.create({
        id: nextId,
        peopleId: item.peopleId,
        userId: user.id as number,
        organizationId: (user.organizationId as number | null) ?? null,
        departureDate: new Date(item.departureDate),
        returnDate: item.returnDate ? new Date(item.returnDate) : null,
        outsideBorder: item.outsideBorder,
        country: item.country,
        description: item.description ?? null,
        eventType: item.eventType,
        direction: item.direction,
        status: item.status,
        purpose: item.purpose ?? null,
        borderCheckpoint: item.borderCheckpoint ?? null,
        transportType: item.transportType ?? null,
        documentNumber: item.documentNumber ?? null,
      });
    }
  }

  private async safeFindCitizen(citizenId: number): Promise<Record<string, unknown> | null> {
    try { return await this.citizensService.findOne(citizenId); } catch { return null; }
  }

  private async safeFindUser(userId: number): Promise<Record<string, unknown> | null> {
    try { return await this.usersService.findOne(userId); } catch { return null; }
  }

  private async safeFindUserByUsername(username: string): Promise<Record<string, unknown> | null> {
    const users = await this.usersService.findAll();
    return users.find((user) => user.username === username) ?? null;
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }
}
