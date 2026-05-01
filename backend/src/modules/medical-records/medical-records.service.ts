import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AddressesService } from '../addresses/addresses.service';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { UsersService } from '../users/users.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MEDICAL_RECORD_SEED } from './medical-records.seed';
import { MedicalRecord, MedicalRecordDocument } from './schemas/medical-record.schema';

@Injectable()
export class MedicalRecordsService implements OnModuleInit {
  constructor(
    @InjectModel(MedicalRecord.name)
    private readonly medicalRecordModel: Model<MedicalRecordDocument>,
    private readonly countersService: CountersService,
    private readonly addressesService: AddressesService,
    private readonly citizensService: CitizensService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.ENABLE_DOMAIN_SEEDS === 'true') {
      await this.seedDefaults();
    }
  }

  async create(dto: CreateMedicalRecordDto): Promise<Record<string, unknown>> {
    const citizen = await this.citizensService.findOne(dto.peopleId);
    const user = await this.usersService.findOne(dto.userId);
    const organizationId = (user.organizationId as number | null) ?? null;

    const nextId = await this.countersService.getNextSequence('medical_records');
    await this.medicalRecordModel.create({
      id: nextId,
      peopleId: dto.peopleId,
      userId: dto.userId,
      organizationId,
      clinic: dto.clinic,
      decision: dto.decision,
      reason: dto.reason ?? null,
      defermentReason: dto.defermentReason ?? null,
      createdAtRecord: dto.createdAtRecord ? new Date(dto.createdAtRecord) : new Date(),
      notes: dto.notes ?? null,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: { search?: string; peopleId?: string; userId?: string } = {}): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<MedicalRecordDocument> = {};
    if (filters.peopleId) query.peopleId = Number(filters.peopleId);
    if (filters.userId) query.userId = Number(filters.userId);
    if (filters.search?.trim()) query.clinic = { $regex: filters.search.trim(), $options: 'i' };

    const records = await this.medicalRecordModel.find(query).sort({ id: -1 }).lean();
    const mapped = await Promise.all(records.map((record) => this.mapRecord(record)));

    if (!filters.search?.trim()) {
      return mapped;
    }
    const searchValue = filters.search.trim().toLowerCase();
    return mapped.filter((record) => {
      const peopleFullName = String(record.peopleFullName ?? '').toLowerCase();
      const clinic = String(record.clinic ?? '').toLowerCase();
      const notes = String(record.notes ?? '').toLowerCase();
      return peopleFullName.includes(searchValue) || clinic.includes(searchValue) || notes.includes(searchValue);
    });
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Medical record');
    const record = await this.medicalRecordModel.findOne({ id: numericId }).lean();
    if (!record) {
      throw new NotFoundException(`Medical record ${numericId} not found`);
    }
    return this.mapRecord(record);
  }

  async update(id: number | string, dto: UpdateMedicalRecordDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Medical record');
    const existing = await this.medicalRecordModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Medical record ${numericId} not found`);
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
    if (dto.clinic !== undefined) payload.clinic = dto.clinic;
    if (dto.decision !== undefined) payload.decision = dto.decision;
    if (dto.reason !== undefined) payload.reason = dto.reason ?? null;
    if (dto.defermentReason !== undefined) payload.defermentReason = dto.defermentReason ?? null;
    if (dto.createdAtRecord !== undefined) payload.createdAtRecord = dto.createdAtRecord ? new Date(dto.createdAtRecord) : null;
    if (dto.notes !== undefined) payload.notes = dto.notes ?? null;

    const updated = await this.medicalRecordModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException(`Medical record ${numericId} not found`);
    }
    return this.mapRecord(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Medical record');
    const deleted = await this.medicalRecordModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`Medical record ${numericId} not found`);
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
      fatherFullName: citizen?.fatherFullName ?? null,
      motherFullName: citizen?.motherFullName ?? null,
      addressLabel: await this.resolveAddressLabel(record.peopleId),
      userId: record.userId,
      userName: user?.fullName ?? null,
      organizationId: record.organizationId ?? null,
      clinic: record.clinic,
      decision: record.decision ?? null,
      reason: record.reason ?? null,
      defermentReason: record.defermentReason ?? null,
      createdAtRecord: record.createdAtRecord ? new Date(record.createdAtRecord).toISOString().split('T')[0] : null,
      notes: record.notes ?? null,
    };
  }

  private async seedDefaults(): Promise<void> {
    for (const item of MEDICAL_RECORD_SEED) {
      const existing = await this.medicalRecordModel.findOne({ peopleId: item.peopleId, clinic: item.clinic }).lean();
      if (existing) continue;

      const citizen = await this.safeFindCitizen(item.peopleId);
      const user = await this.safeFindUserByUsername(item.username);
      if (!citizen || !user?.id) continue;

      const nextId = await this.countersService.getNextSequence('medical_records');
      await this.medicalRecordModel.create({
        id: nextId,
        peopleId: item.peopleId,
        userId: user.id as number,
        organizationId: (user.organizationId as number | null) ?? null,
        clinic: item.clinic,
        decision: (item as Record<string, any>).decision ?? 'FIT',
        reason: (item as Record<string, any>).reason ?? null,
        defermentReason: (item as Record<string, any>).defermentReason ?? null,
        createdAtRecord: item.createdAtRecord ? new Date(item.createdAtRecord) : new Date(),
        notes: item.notes ?? null,
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

  private async resolveAddressLabel(citizenId: number): Promise<string | null> {
    try {
      const addresses = await this.addressesService.findAll({
        citizenId: citizenId.toString(),
        isActive: 'true',
      });
      const activeAddress = addresses[0] as Record<string, any> | undefined;
      return activeAddress?.fullAddress ?? null;
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

