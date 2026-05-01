import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { EducationInstitutionsService } from '../education-institutions/education-institutions.service';
import { UsersService } from '../users/users.service';
import { CreateSchoolRecordDto } from './dto/create-school-record.dto';
import { UpdateSchoolRecordDto } from './dto/update-school-record.dto';
import { SCHOOL_RECORD_SEED } from './school.seed';
import { SchoolRecord, SchoolRecordDocument } from './schemas/school-record.schema';

@Injectable()
export class SchoolService implements OnModuleInit {
  constructor(
    @InjectModel(SchoolRecord.name)
    private readonly schoolRecordModel: Model<SchoolRecordDocument>,
    private readonly countersService: CountersService,
    private readonly citizensService: CitizensService,
    private readonly educationInstitutionsService: EducationInstitutionsService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaults();
  }

  async create(dto: CreateSchoolRecordDto): Promise<Record<string, unknown>> {
    await this.citizensService.findOne(dto.peopleId);
    await this.educationInstitutionsService.findOne(dto.institutionId);
    const schoolUserId = await this.resolveSchoolUserId();

    const nextId = await this.countersService.getNextSequence('school_records');
    await this.schoolRecordModel.create({
      id: nextId,
      peopleId: dto.peopleId,
      institutionId: dto.institutionId,
      classNumber: dto.classNumber,
      admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : null,
      graduationDate: dto.graduationDate ? new Date(dto.graduationDate) : null,
      expulsionDate: dto.expulsionDate ? new Date(dto.expulsionDate) : null,
      isStudying: this.resolveIsStudying(dto.graduationDate ?? null, dto.expulsionDate ?? null),
      userId: schoolUserId,
      comment: dto.comment ?? null,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: { search?: string; peopleId?: string; institutionId?: string } = {}): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<SchoolRecordDocument> = {};
    if (filters.peopleId) query.peopleId = Number(filters.peopleId);
    if (filters.institutionId) query.institutionId = Number(filters.institutionId);

    const records = await this.schoolRecordModel.find(query).sort({ id: -1 }).lean();
    const mapped = await Promise.all(records.map((record) => this.mapRecord(record)));

    if (!filters.search?.trim()) {
      return mapped;
    }

    const searchValue = filters.search.trim().toLowerCase();
    return mapped.filter((record) => {
      const peopleFullName = String(record.peopleFullName ?? '').toLowerCase();
      const institutionName = String(record.institutionName ?? '').toLowerCase();
      const classNumber = String(record.classNumber ?? '').toLowerCase();
      return peopleFullName.includes(searchValue) || institutionName.includes(searchValue) || classNumber.includes(searchValue);
    });
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'School record');
    const record = await this.schoolRecordModel.findOne({ id: numericId }).lean();
    if (!record) {
      throw new NotFoundException(`School record ${numericId} not found`);
    }
    return this.mapRecord(record);
  }

  async update(id: number | string, dto: UpdateSchoolRecordDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'School record');
    const existing = await this.schoolRecordModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`School record ${numericId} not found`);
    }

    const payload: Record<string, unknown> = {};
    if (dto.peopleId !== undefined) {
      await this.citizensService.findOne(dto.peopleId);
      payload.peopleId = dto.peopleId;
    }
    if (dto.institutionId !== undefined) {
      await this.educationInstitutionsService.findOne(dto.institutionId);
      payload.institutionId = dto.institutionId;
    }
    if (dto.classNumber !== undefined) payload.classNumber = dto.classNumber;
    if (dto.admissionDate !== undefined) payload.admissionDate = dto.admissionDate ? new Date(dto.admissionDate) : null;
    if (dto.graduationDate !== undefined) payload.graduationDate = dto.graduationDate ? new Date(dto.graduationDate) : null;
    if (dto.expulsionDate !== undefined) payload.expulsionDate = dto.expulsionDate ? new Date(dto.expulsionDate) : null;
    if (dto.comment !== undefined) payload.comment = dto.comment ?? null;

    const graduationDate =
      dto.graduationDate !== undefined
        ? dto.graduationDate ?? null
        : existing.graduationDate
          ? new Date(existing.graduationDate).toISOString()
          : null;
    const expulsionDate =
      dto.expulsionDate !== undefined
        ? dto.expulsionDate ?? null
        : existing.expulsionDate
          ? new Date(existing.expulsionDate).toISOString()
          : null;
    payload.isStudying = this.resolveIsStudying(graduationDate, expulsionDate);

    const updated = await this.schoolRecordModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException(`School record ${numericId} not found`);
    }
    return this.mapRecord(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'School record');
    const deleted = await this.schoolRecordModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`School record ${numericId} not found`);
    }
  }

  private async mapRecord(record: Record<string, any>): Promise<Record<string, unknown>> {
    const [citizen, institution, user] = await Promise.all([
      this.safeFindCitizen(record.peopleId),
      this.safeFindInstitution(record.institutionId),
      this.safeFindUser(record.userId),
    ]);

    return {
      id: record.id,
      citizenId: record.peopleId,
      peopleId: record.peopleId,
      peopleFullName: citizen?.fullName ?? null,
      fatherFullName: citizen?.fatherFullName ?? null,
      motherFullName: citizen?.motherFullName ?? null,
      institutionId: record.institutionId,
      institutionName: institution?.name ?? null,
      classNumber: record.classNumber ?? null,
      admissionDate: record.admissionDate ? new Date(record.admissionDate).toISOString() : null,
      graduationDate: record.graduationDate ? new Date(record.graduationDate).toISOString() : null,
      expulsionDate: record.expulsionDate ? new Date(record.expulsionDate).toISOString() : null,
      isStudying: Boolean(record.isStudying),
      userId: record.userId,
      userName: user?.username ?? user?.fullName ?? null,
      comment: record.comment ?? null,
    };
  }

  private async seedDefaults(): Promise<void> {
    const schoolUserId = await this.resolveSchoolUserId().catch(() => null);
    if (!schoolUserId) {
      return;
    }

    for (const item of SCHOOL_RECORD_SEED) {
      const existing = await this.schoolRecordModel
        .findOne({ peopleId: item.peopleId, institutionId: item.institutionId, classNumber: item.classNumber })
        .lean();
      if (existing) {
        continue;
      }

      const [citizen, institution] = await Promise.all([
        this.safeFindCitizen(item.peopleId),
        this.safeFindInstitution(item.institutionId),
      ]);
      if (!citizen || !institution) {
        continue;
      }

      const nextId = await this.countersService.getNextSequence('school_records');
      await this.schoolRecordModel.create({
        id: nextId,
        peopleId: item.peopleId,
        institutionId: item.institutionId,
        classNumber: item.classNumber,
        admissionDate: item.admissionDate ? new Date(item.admissionDate) : null,
        graduationDate: item.graduationDate ? new Date(item.graduationDate) : null,
        expulsionDate: item.expulsionDate ? new Date(item.expulsionDate) : null,
        isStudying: this.resolveIsStudying(item.graduationDate ?? null, item.expulsionDate ?? null),
        userId: schoolUserId,
        comment: item.comment ?? null,
      });
    }
  }

  private resolveIsStudying(graduationDate: string | null, expulsionDate: string | null): boolean {
    return !graduationDate && !expulsionDate;
  }

  private async resolveSchoolUserId(): Promise<number> {
    const users = await this.usersService.findAll();
    const schoolUser =
      users.find((user) => user.username === 'school') ??
      users.find((user) => user.roleCode === 'school') ??
      users[0];
    if (!schoolUser?.id) {
      throw new NotFoundException('School user not found');
    }
    return schoolUser.id as number;
  }

  private async safeFindCitizen(citizenId: number): Promise<Record<string, unknown> | null> {
    try {
      return await this.citizensService.findOne(citizenId);
    } catch {
      return null;
    }
  }

  private async safeFindInstitution(institutionId: number): Promise<Record<string, unknown> | null> {
    try {
      return await this.educationInstitutionsService.findOne(institutionId);
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
