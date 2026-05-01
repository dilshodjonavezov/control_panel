import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { UsersService } from '../users/users.service';
import { CreateVvkResultDto } from './dto/create-vvk-result.dto';
import { UpdateVvkResultDto } from './dto/update-vvk-result.dto';
import { VVK_RESULT_SEED } from './vvk-results.seed';
import { VvkResult, VvkResultDocument } from './schemas/vvk-result.schema';

@Injectable()
export class VvkResultsService implements OnModuleInit {
  constructor(
    @InjectModel(VvkResult.name)
    private readonly vvkResultModel: Model<VvkResultDocument>,
    private readonly countersService: CountersService,
    private readonly citizensService: CitizensService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaults();
  }

  async create(dto: CreateVvkResultDto): Promise<Record<string, unknown>> {
    await this.citizensService.findOne(dto.peopleId);
    const user = await this.usersService.findOne(dto.userId);

    const nextId = await this.countersService.getNextSequence('vvk_results');
    await this.vvkResultModel.create({
      id: nextId,
      peopleId: dto.peopleId,
      userId: dto.userId,
      organizationId: (user.organizationId as number | null) ?? null,
      medicalVisitId: dto.medicalVisitId ?? null,
      examDate: new Date(dto.examDate),
      category: dto.category,
      queueStatus: dto.queueStatus ?? 'DONE',
      fitnessCategory: dto.fitnessCategory ?? this.mapCategoryToFitness(dto.category),
      finalDecision: dto.finalDecision ?? this.mapCategoryToDecision(dto.category),
      reason: dto.reason ?? null,
      notes: dto.notes ?? null,
      nextReviewDate: dto.nextReviewDate ? new Date(dto.nextReviewDate) : null,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: { search?: string; peopleId?: string; queueStatus?: string; category?: string } = {}): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<VvkResultDocument> = {};
    if (filters.peopleId) query.peopleId = Number(filters.peopleId);
    if (filters.queueStatus?.trim()) query.queueStatus = filters.queueStatus.trim();
    if (filters.category?.trim()) query.category = filters.category.trim();

    const records = await this.vvkResultModel.find(query).sort({ id: -1 }).lean();
    const mapped = await Promise.all(records.map((record) => this.mapRecord(record)));

    if (!filters.search?.trim()) {
      return mapped;
    }
    const searchValue = filters.search.trim().toLowerCase();
    return mapped.filter((record) => {
      const person = String(record.peopleFullName ?? '').toLowerCase();
      const category = String(record.category ?? '').toLowerCase();
      const notes = String(record.notes ?? '').toLowerCase();
      return person.includes(searchValue) || category.includes(searchValue) || notes.includes(searchValue);
    });
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'VVK result');
    const record = await this.vvkResultModel.findOne({ id: numericId }).lean();
    if (!record) {
      throw new NotFoundException(`VVK result ${numericId} not found`);
    }
    return this.mapRecord(record);
  }

  async update(id: number | string, dto: UpdateVvkResultDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'VVK result');
    const existing = await this.vvkResultModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`VVK result ${numericId} not found`);
    }

    const payload: Record<string, unknown> = {};
    const category = dto.category ?? existing.category;
    if (dto.peopleId !== undefined) {
      await this.citizensService.findOne(dto.peopleId);
      payload.peopleId = dto.peopleId;
    }
    if (dto.userId !== undefined) {
      const user = await this.usersService.findOne(dto.userId);
      payload.userId = dto.userId;
      payload.organizationId = (user.organizationId as number | null) ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'medicalVisitId')) payload.medicalVisitId = dto.medicalVisitId ?? null;
    if (dto.examDate !== undefined) payload.examDate = new Date(dto.examDate);
    if (dto.category !== undefined) payload.category = dto.category;
    if (dto.queueStatus !== undefined) payload.queueStatus = dto.queueStatus;
    if (dto.fitnessCategory !== undefined) payload.fitnessCategory = dto.fitnessCategory ?? null;
    else if (dto.category !== undefined) payload.fitnessCategory = this.mapCategoryToFitness(category);
    if (dto.finalDecision !== undefined) payload.finalDecision = dto.finalDecision ?? null;
    else if (dto.category !== undefined) payload.finalDecision = this.mapCategoryToDecision(category);
    if (dto.reason !== undefined) payload.reason = dto.reason ?? null;
    if (dto.notes !== undefined) payload.notes = dto.notes ?? null;
    if (dto.nextReviewDate !== undefined) payload.nextReviewDate = dto.nextReviewDate ? new Date(dto.nextReviewDate) : null;

    const updated = await this.vvkResultModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException(`VVK result ${numericId} not found`);
    }
    return this.mapRecord(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'VVK result');
    const deleted = await this.vvkResultModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`VVK result ${numericId} not found`);
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
      organizationId: record.organizationId ?? null,
      medicalVisitId: record.medicalVisitId ?? null,
      examDate: new Date(record.examDate).toISOString().split('T')[0],
      category: record.category,
      queueStatus: record.queueStatus,
      fitnessCategory: record.fitnessCategory ?? null,
      finalDecision: record.finalDecision ?? null,
      reason: record.reason ?? null,
      notes: record.notes ?? null,
      nextReviewDate: record.nextReviewDate ? new Date(record.nextReviewDate).toISOString().split('T')[0] : null,
    };
  }

  private async seedDefaults(): Promise<void> {
    for (const item of VVK_RESULT_SEED) {
      const existing = await this.vvkResultModel.findOne({ peopleId: item.peopleId, examDate: new Date(item.examDate), category: item.category }).lean();
      if (existing) continue;

      const citizen = await this.safeFindCitizen(item.peopleId);
      const user = await this.safeFindUserByUsername(item.username);
      if (!citizen || !user?.id) continue;

      const nextId = await this.countersService.getNextSequence('vvk_results');
      await this.vvkResultModel.create({
        id: nextId,
        peopleId: item.peopleId,
        userId: user.id as number,
        organizationId: (user.organizationId as number | null) ?? null,
        medicalVisitId: null,
        examDate: new Date(item.examDate),
        category: item.category,
        queueStatus: item.queueStatus,
        fitnessCategory: item.fitnessCategory ?? null,
        finalDecision: item.finalDecision ?? null,
        reason: item.reason ?? null,
        notes: item.notes ?? null,
        nextReviewDate: item.nextReviewDate ? new Date(item.nextReviewDate) : null,
      });
    }
  }

  private mapCategoryToFitness(category: string): string {
    const mapping: Record<string, string> = { A: 'FIT', B: 'FIT_WITH_LIMITATIONS', C: 'TEMP_UNFIT', D_UNFIT: 'UNFIT' };
    return mapping[category] ?? 'FIT_WITH_LIMITATIONS';
  }

  private mapCategoryToDecision(category: string): string {
    const mapping: Record<string, string> = { A: 'FIT', B: 'FIT', C: 'TEMP_UNFIT', D_UNFIT: 'UNFIT' };
    return mapping[category] ?? 'FIT';
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
