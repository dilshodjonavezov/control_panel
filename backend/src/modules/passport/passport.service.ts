import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { UsersService } from '../users/users.service';
import { CreatePassportRecordDto } from './dto/create-passport-record.dto';
import { UpdatePassportRecordDto } from './dto/update-passport-record.dto';
import { PASSPORT_RECORD_SEED } from './passport.seed';
import { PassportRecord, PassportRecordDocument } from './schemas/passport-record.schema';

@Injectable()
export class PassportService implements OnModuleInit {
  constructor(
    @InjectModel(PassportRecord.name)
    private readonly passportRecordModel: Model<PassportRecordDocument>,
    private readonly countersService: CountersService,
    private readonly citizensService: CitizensService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.ENABLE_DOMAIN_SEEDS === 'true') {
      await this.seedDefaults();
    }
    await this.backfillExpireDates();
  }

  async create(dto: CreatePassportRecordDto): Promise<Record<string, unknown>> {
    await this.citizensService.findOne(dto.peopleId);
    await this.usersService.findOne(dto.userId);

    const nextId = await this.countersService.getNextSequence('passport_records');
    const dateOfIssue = dto.dateOfIssue ? new Date(dto.dateOfIssue) : new Date();
    await this.passportRecordModel.create({
      id: nextId,
      peopleId: dto.peopleId,
      userId: dto.userId,
      passportNumber: dto.passportNumber,
      dateOfIssue,
      expireDate: dto.expireDate ? new Date(dto.expireDate) : this.addYears(dateOfIssue, 10),
      placeOfIssue: dto.placeOfIssue,
      dateBirth: dto.dateBirth ? new Date(dto.dateBirth) : null,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: { search?: string; peopleId?: string; userId?: string } = {}): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<PassportRecordDocument> = {};
    if (filters.peopleId) query.peopleId = Number(filters.peopleId);
    if (filters.userId) query.userId = Number(filters.userId);
    if (filters.search?.trim()) {
      query.passportNumber = { $regex: filters.search.trim(), $options: 'i' };
    }

    const records = await this.passportRecordModel.find(query).sort({ id: -1 }).lean();
    const mapped = await Promise.all(records.map((record) => this.mapRecord(record)));

    if (!filters.search?.trim()) {
      return mapped;
    }

    const searchValue = filters.search.trim().toLowerCase();
    return mapped.filter((record) => {
      const peopleFullName = String(record.peopleFullName ?? '').toLowerCase();
      const passportNumber = String(record.passportNumber ?? '').toLowerCase();
      const placeOfIssue = String(record.placeOfIssue ?? '').toLowerCase();
      return (
        peopleFullName.includes(searchValue) ||
        passportNumber.includes(searchValue) ||
        placeOfIssue.includes(searchValue)
      );
    });
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Passport record');
    const record = await this.passportRecordModel.findOne({ id: numericId }).lean();
    if (!record) {
      throw new NotFoundException(`Passport record ${numericId} not found`);
    }
    return this.mapRecord(record);
  }

  async update(id: number | string, dto: UpdatePassportRecordDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Passport record');
    const existing = await this.passportRecordModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Passport record ${numericId} not found`);
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
    if (dto.passportNumber !== undefined) payload.passportNumber = dto.passportNumber;
    if (dto.dateOfIssue !== undefined) payload.dateOfIssue = dto.dateOfIssue ? new Date(dto.dateOfIssue) : null;
    if (dto.expireDate !== undefined) {
      payload.expireDate = dto.expireDate ? new Date(dto.expireDate) : null;
    } else if (dto.dateOfIssue !== undefined) {
      const issueDate = dto.dateOfIssue ? new Date(dto.dateOfIssue) : null;
      payload.expireDate = issueDate ? this.addYears(issueDate, 10) : null;
    }
    if (dto.placeOfIssue !== undefined) payload.placeOfIssue = dto.placeOfIssue;
    if (dto.dateBirth !== undefined) payload.dateBirth = dto.dateBirth ? new Date(dto.dateBirth) : null;

    const updated = await this.passportRecordModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException(`Passport record ${numericId} not found`);
    }
    return this.mapRecord(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Passport record');
    const deleted = await this.passportRecordModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`Passport record ${numericId} not found`);
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
      peopleFullName: citizen?.fullName ?? null,
      userId: record.userId,
      userName: user?.fullName ?? null,
      passportNumber: record.passportNumber ?? null,
      dateOfIssue: record.dateOfIssue ? this.toIsoDate(record.dateOfIssue) : null,
      expireDate: record.expireDate ? this.toIsoDate(record.expireDate) : null,
      placeOfIssue: record.placeOfIssue ?? null,
      dateBirth: record.dateBirth ? this.toIsoDate(record.dateBirth) : null,
    };
  }

  private async seedDefaults(): Promise<void> {
    for (const item of PASSPORT_RECORD_SEED) {
      const seedItem = item as Record<string, any>;
      const existing = await this.passportRecordModel
        .findOne({ peopleId: seedItem.peopleId, passportNumber: seedItem.passportNumber })
        .lean();
      if (existing) {
        continue;
      }

      const [citizen, user] = await Promise.all([
        this.safeFindCitizen(seedItem.peopleId),
        this.safeFindUser(seedItem.userId),
      ]);
      if (!citizen || !user) {
        continue;
      }

      const nextId = await this.countersService.getNextSequence('passport_records');
      await this.passportRecordModel.create({
        id: nextId,
        peopleId: seedItem.peopleId,
        userId: seedItem.userId,
        passportNumber: seedItem.passportNumber,
        dateOfIssue: seedItem.dateOfIssue ? new Date(seedItem.dateOfIssue) : null,
        expireDate: seedItem.expireDate ? new Date(seedItem.expireDate) : seedItem.dateOfIssue ? this.addYears(new Date(seedItem.dateOfIssue), 10) : this.addYears(new Date(), 10),
        placeOfIssue: seedItem.placeOfIssue,
        dateBirth: seedItem.dateBirth ? new Date(seedItem.dateBirth) : null,
      });
    }
  }

  private async backfillExpireDates(): Promise<void> {
    const records = await this.passportRecordModel.find({ $or: [{ expireDate: { $exists: false } }, { expireDate: null }] }).lean();
    for (const record of records) {
      const issueDate = record.dateOfIssue ? new Date(record.dateOfIssue) : new Date();
      await this.passportRecordModel.updateOne(
        { id: record.id },
        {
          $set: {
            expireDate: this.addYears(issueDate, 10),
          },
        },
      );
    }
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

  private toIsoDate(value: Date | string): string {
    return new Date(value).toISOString().split('T')[0];
  }

  private addYears(date: Date, years: number): Date {
    const next = new Date(date);
    next.setFullYear(next.getFullYear() + years);
    return next;
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }
}

