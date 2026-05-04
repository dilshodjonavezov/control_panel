import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CountersService } from '../counters/counters.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { CITIZEN_SEED } from './citizen.seed';
import { Citizen, CitizenDocument } from './schemas/citizen.schema';

@Injectable()
export class CitizensService implements OnModuleInit {
  constructor(
    @InjectModel(Citizen.name) private readonly citizenModel: Model<CitizenDocument>,
    private readonly countersService: CountersService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.backfillMissingIds();
    if (process.env.ENABLE_DOMAIN_SEEDS === 'true') {
      await this.seedDefaults();
    }
  }

  async create(createCitizenDto: CreateCitizenDto): Promise<Record<string, unknown>> {
    const nextId = await this.countersService.getNextSequence('citizens');
    const fullName = this.buildFullName(
      createCitizenDto.lastName,
      createCitizenDto.firstName,
      createCitizenDto.middleName ?? null,
    );

    await this.citizenModel.create({
      id: nextId,
      ...(createCitizenDto.iin ? { iin: createCitizenDto.iin } : {}),
      firstName: createCitizenDto.firstName,
      lastName: createCitizenDto.lastName,
      middleName: createCitizenDto.middleName ?? null,
      fullName,
      birthDate: new Date(createCitizenDto.birthDate),
      gender: createCitizenDto.gender,
      citizenship: createCitizenDto.citizenship,
      lifeStatus: createCitizenDto.lifeStatus ?? 'ACTIVE',
      motherFullName: createCitizenDto.motherFullName ?? null,
      motherCitizenId: createCitizenDto.motherCitizenId ?? null,
      fatherFullName: createCitizenDto.fatherFullName ?? null,
      fatherCitizenId: createCitizenDto.fatherCitizenId ?? null,
      familyId: createCitizenDto.familyId ?? null,
      militaryRegisteredAtBirth: createCitizenDto.militaryRegisteredAtBirth ?? false,
    });

    return this.findOne(nextId);
  }

  async findAll(search?: string): Promise<Record<string, unknown>[]> {
    const filter: FilterQuery<CitizenDocument> = {};
    if (search?.trim()) {
      const value = search.trim();
      filter.$or = [
        { fullName: { $regex: value, $options: 'i' } },
        { firstName: { $regex: value, $options: 'i' } },
        { lastName: { $regex: value, $options: 'i' } },
        { iin: { $regex: value, $options: 'i' } },
      ];
    }

    const citizens = await this.citizenModel.find(filter).sort({ id: -1 }).lean();
    return citizens.map((citizen) => this.mapCitizen(citizen));
  }

  async searchPaged(search?: string, page = 1, limit = 20): Promise<Record<string, unknown>> {
    const filter: FilterQuery<CitizenDocument> = {};
    if (search?.trim()) {
      const value = search.trim();
      filter.$or = [
        { fullName: { $regex: `^${this.escapeRegex(value)}`, $options: 'i' } },
        { firstName: { $regex: `^${this.escapeRegex(value)}`, $options: 'i' } },
        { lastName: { $regex: `^${this.escapeRegex(value)}`, $options: 'i' } },
        { iin: { $regex: `^${this.escapeRegex(value)}`, $options: 'i' } },
      ];
    }

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 20;
    const skip = (safePage - 1) * safeLimit;

    const [citizens, totalCitizens] = await Promise.all([
      this.citizenModel.find(filter).sort({ id: -1 }).skip(skip).limit(safeLimit + 1).lean(),
      this.citizenModel.estimatedDocumentCount(),
    ]);

    const hasMore = citizens.length > safeLimit;
    const items = hasMore ? citizens.slice(0, safeLimit) : citizens;

    return {
      items: items.map((citizen) => this.mapCitizen(citizen)),
      total: totalCitizens,
      page: safePage,
      limit: safeLimit,
      hasMore,
      search: search?.trim() || '',
      shown: items.length,
    };
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Citizen');
    const citizen = await this.citizenModel.findOne({ id: numericId }).lean();
    if (!citizen) {
      throw new NotFoundException(`Citizen ${numericId} not found`);
    }
    return this.mapCitizen(citizen);
  }

  async update(id: number | string, updateCitizenDto: UpdateCitizenDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Citizen');
    const existing = await this.citizenModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Citizen ${numericId} not found`);
    }

    const payload: Record<string, unknown> = {};
    const unsetPayload: Record<string, unknown> = {};
    if (updateCitizenDto.iin !== undefined) {
      if (updateCitizenDto.iin) {
        payload.iin = updateCitizenDto.iin;
      } else {
        unsetPayload.iin = 1;
      }
    }
    if (updateCitizenDto.firstName !== undefined) payload.firstName = updateCitizenDto.firstName;
    if (updateCitizenDto.lastName !== undefined) payload.lastName = updateCitizenDto.lastName;
    if (updateCitizenDto.middleName !== undefined) payload.middleName = updateCitizenDto.middleName ?? null;
    if (updateCitizenDto.birthDate !== undefined) payload.birthDate = new Date(updateCitizenDto.birthDate);
    if (updateCitizenDto.gender !== undefined) payload.gender = updateCitizenDto.gender;
    if (updateCitizenDto.citizenship !== undefined) payload.citizenship = updateCitizenDto.citizenship;
    if (updateCitizenDto.lifeStatus !== undefined) payload.lifeStatus = updateCitizenDto.lifeStatus;
    if (updateCitizenDto.motherFullName !== undefined) payload.motherFullName = updateCitizenDto.motherFullName ?? null;
    if (updateCitizenDto.motherCitizenId !== undefined) payload.motherCitizenId = updateCitizenDto.motherCitizenId ?? null;
    if (updateCitizenDto.fatherFullName !== undefined) payload.fatherFullName = updateCitizenDto.fatherFullName ?? null;
    if (updateCitizenDto.fatherCitizenId !== undefined) payload.fatherCitizenId = updateCitizenDto.fatherCitizenId ?? null;
    if (updateCitizenDto.familyId !== undefined) payload.familyId = updateCitizenDto.familyId ?? null;
    if (updateCitizenDto.militaryRegisteredAtBirth !== undefined) {
      payload.militaryRegisteredAtBirth = updateCitizenDto.militaryRegisteredAtBirth;
    }

    const fullName = this.buildFullName(
      updateCitizenDto.lastName ?? existing.lastName,
      updateCitizenDto.firstName ?? existing.firstName,
      updateCitizenDto.middleName !== undefined ? updateCitizenDto.middleName ?? null : existing.middleName ?? null,
    );
    payload.fullName = fullName;

    const updateQuery: Record<string, unknown> = {};
    if (Object.keys(payload).length > 0) {
      updateQuery.$set = payload;
    }
    if (Object.keys(unsetPayload).length > 0) {
      updateQuery.$unset = unsetPayload;
    }

    const citizen = await this.citizenModel
      .findOneAndUpdate({ id: numericId }, updateQuery, { new: true, runValidators: true })
      .lean();

    if (!citizen) {
      throw new NotFoundException(`Citizen ${numericId} not found`);
    }
    return this.mapCitizen(citizen);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Citizen');
    const result = await this.citizenModel.findOneAndDelete({ id: numericId }).lean();
    if (!result) {
      throw new NotFoundException(`Citizen ${numericId} not found`);
    }
  }

  async getPeopleList(search?: string): Promise<Array<{ id: number; fullName: string }>> {
    const citizens = await this.findAll(search);
    return citizens.map((citizen) => ({
      id: citizen.peopleId as number,
      fullName: citizen.peopleFullName as string,
    }));
  }

  private mapCitizen(citizen: Record<string, any>): Record<string, unknown> {
    return {
      id: citizen.id,
      iin: citizen.iin ?? null,
      firstName: citizen.firstName,
      lastName: citizen.lastName,
      middleName: citizen.middleName ?? null,
      fullName: citizen.fullName,
      birthDate: this.toIsoDate(citizen.birthDate),
      gender: citizen.gender,
      citizenship: citizen.citizenship,
      lifeStatus: citizen.lifeStatus,
      motherFullName: citizen.motherFullName ?? null,
      motherCitizenId: citizen.motherCitizenId ?? null,
      fatherFullName: citizen.fatherFullName ?? null,
      fatherCitizenId: citizen.fatherCitizenId ?? null,
      familyId: citizen.familyId ?? null,
      militaryRegisteredAtBirth: Boolean(citizen.militaryRegisteredAtBirth),
      peopleId: citizen.id,
      peopleFullName: citizen.fullName,
    };
  }

  private buildFullName(lastName: string, firstName: string, middleName: string | null): string {
    return [lastName, firstName, middleName].filter((part) => !!part && part.trim().length > 0).join(' ');
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

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async backfillMissingIds(): Promise<void> {
    const citizensWithoutIds = await this.citizenModel.find({ id: { $exists: false } }).lean();
    for (const citizen of citizensWithoutIds) {
      const nextId = await this.countersService.getNextSequence('citizens');
      await this.citizenModel.updateOne({ _id: citizen._id }, { $set: { id: nextId } });
    }
  }

  private async seedDefaults(): Promise<void> {
    for (const seed of CITIZEN_SEED) {
      const existing = await this.citizenModel.findOne({ fullName: this.buildFullName(seed.lastName, seed.firstName, seed.middleName ?? null) }).lean();
      if (existing) {
        continue;
      }

      await this.create({
        ...seed,
        middleName: seed.middleName ?? null,
        motherFullName: seed.motherFullName ?? null,
        fatherFullName: seed.fatherFullName ?? null,
        motherCitizenId: null,
        fatherCitizenId: null,
        familyId: null,
        militaryRegisteredAtBirth: false,
      } as CreateCitizenDto);
    }
  }
}

