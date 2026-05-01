import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { UsersService } from '../users/users.service';
import { CreateMedicalVisitDto } from './dto/create-medical-visit.dto';
import { UpdateMedicalVisitDto } from './dto/update-medical-visit.dto';
import { MEDICAL_VISIT_SEED } from './medical-visits.seed';
import { MedicalVisit, MedicalVisitDocument } from './schemas/medical-visit.schema';

@Injectable()
export class MedicalVisitsService implements OnModuleInit {
  constructor(
    @InjectModel(MedicalVisit.name)
    private readonly medicalVisitModel: Model<MedicalVisitDocument>,
    private readonly countersService: CountersService,
    private readonly citizensService: CitizensService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.ENABLE_DOMAIN_SEEDS === 'true') {
      await this.seedDefaults();
    }
  }

  async create(dto: CreateMedicalVisitDto): Promise<Record<string, unknown>> {
    await this.citizensService.findOne(dto.peopleId);
    await this.usersService.findOne(dto.userId);

    const nextId = await this.countersService.getNextSequence('medical_visits');
    await this.medicalVisitModel.create({
      id: nextId,
      peopleId: dto.peopleId,
      medicalRecordId: dto.medicalRecordId ?? null,
      userId: dto.userId,
      doctor: dto.doctor,
      visitDate: dto.visitDate ? new Date(dto.visitDate) : null,
      diagnosis: dto.diagnosis,
      notes: dto.notes ?? null,
      status: dto.status ?? 'DRAFT',
    });

    return this.findOne(nextId);
  }

  async findAll(filters: { search?: string; peopleId?: string; userId?: string; status?: string } = {}): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<MedicalVisitDocument> = {};
    if (filters.peopleId) query.peopleId = Number(filters.peopleId);
    if (filters.userId) query.userId = Number(filters.userId);
    if (filters.status?.trim()) query.status = filters.status.trim();

    const records = await this.medicalVisitModel.find(query).sort({ id: -1 }).lean();
    const mapped = await Promise.all(records.map((record) => this.mapRecord(record)));

    if (!filters.search?.trim()) {
      return mapped;
    }
    const searchValue = filters.search.trim().toLowerCase();
    return mapped.filter((record) => {
      const peopleFullName = String(record.peopleFullName ?? '').toLowerCase();
      const doctor = String(record.doctor ?? '').toLowerCase();
      const diagnosis = String(record.diagnosis ?? '').toLowerCase();
      return peopleFullName.includes(searchValue) || doctor.includes(searchValue) || diagnosis.includes(searchValue);
    });
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Medical visit');
    const record = await this.medicalVisitModel.findOne({ id: numericId }).lean();
    if (!record) {
      throw new NotFoundException(`Medical visit ${numericId} not found`);
    }
    return this.mapRecord(record);
  }

  async update(id: number | string, dto: UpdateMedicalVisitDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Medical visit');
    const existing = await this.medicalVisitModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Medical visit ${numericId} not found`);
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
    if (Object.prototype.hasOwnProperty.call(dto, 'medicalRecordId')) payload.medicalRecordId = dto.medicalRecordId ?? null;
    if (dto.doctor !== undefined) payload.doctor = dto.doctor;
    if (dto.visitDate !== undefined) payload.visitDate = dto.visitDate ? new Date(dto.visitDate) : null;
    if (dto.diagnosis !== undefined) payload.diagnosis = dto.diagnosis;
    if (dto.notes !== undefined) payload.notes = dto.notes ?? null;
    if (dto.status !== undefined) payload.status = dto.status;

    const updated = await this.medicalVisitModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException(`Medical visit ${numericId} not found`);
    }
    return this.mapRecord(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Medical visit');
    const deleted = await this.medicalVisitModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`Medical visit ${numericId} not found`);
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
      medicalRecordId: record.medicalRecordId ?? null,
      userId: record.userId,
      userName: user?.fullName ?? null,
      doctor: record.doctor,
      visitDate: record.visitDate ? new Date(record.visitDate).toISOString().split('T')[0] : null,
      diagnosis: record.diagnosis,
      notes: record.notes ?? null,
      status: record.status,
    };
  }

  private async seedDefaults(): Promise<void> {
    for (const item of MEDICAL_VISIT_SEED) {
      const existing = await this.medicalVisitModel
        .findOne({ peopleId: item.peopleId, doctor: item.doctor, visitDate: new Date(item.visitDate) })
        .lean();
      if (existing) continue;

      const citizen = await this.safeFindCitizen(item.peopleId);
      const user = await this.safeFindUserByUsername(item.username);
      if (!citizen || !user?.id) continue;

      const nextId = await this.countersService.getNextSequence('medical_visits');
      await this.medicalVisitModel.create({
        id: nextId,
        peopleId: item.peopleId,
        medicalRecordId: null,
        userId: user.id as number,
        doctor: item.doctor,
        visitDate: item.visitDate ? new Date(item.visitDate) : null,
        diagnosis: item.diagnosis,
        notes: item.notes ?? null,
        status: item.status,
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

