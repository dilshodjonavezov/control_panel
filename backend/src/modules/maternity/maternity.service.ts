import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import { MATERNITY_BIRTH_CASE_TYPES } from './maternity.constants';
import { MATERNITY_RECORD_SEED } from './maternity.seed';
import { CreateMaternityRecordDto } from './dto/create-maternity-record.dto';
import { UpdateMaternityRecordDto } from './dto/update-maternity-record.dto';
import { MaternityRecord, MaternityRecordDocument } from './schemas/maternity-record.schema';

@Injectable()
export class MaternityService implements OnModuleInit {
  constructor(
    @InjectModel(MaternityRecord.name)
    private readonly maternityModel: Model<MaternityRecordDocument>,
    private readonly countersService: CountersService,
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly citizensService: CitizensService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaults();
  }

  async create(dto: CreateMaternityRecordDto): Promise<Record<string, unknown>> {
    const user = await this.usersService.findOne(dto.userId);
    const nextId = await this.countersService.getNextSequence('maternity_records');
    const organizationId = (user.organizationId as number | null) ?? 0;
    if (organizationId) {
      await this.organizationsService.findOne(organizationId);
    }

    const fatherCitizenId =
      dto.fatherPersonId ?? (await this.resolveCitizenIdByFullName(dto.fatherFullName ?? null));
    const motherCitizenId =
      dto.motherCitizenId ?? (await this.resolveCitizenIdByFullName(dto.motherFullName ?? null));

    await this.maternityModel.create({
      id: nextId,
      childCitizenId: dto.childCitizenId ?? null,
      motherCitizenId,
      fatherCitizenId,
      familyId: dto.familyId ?? null,
      birthCaseType: this.normalizeBirthCaseType(dto.birthCaseType, dto.fatherFullName, dto.motherFullName),
      birthDateTime: new Date(dto.birthDateTime),
      placeOfBirth: dto.placeOfBirth,
      childFullName: dto.childFullName?.trim() ? dto.childFullName.trim() : null,
      motherFullName: dto.motherFullName ?? null,
      fatherFullName: dto.fatherFullName ?? null,
      gender: dto.gender,
      birthWeight: dto.birthWeight ?? null,
      medicalCertificateNumber: dto.medicalCertificateNumber ?? null,
      status: dto.status ?? 'DRAFT',
      comment: dto.comment ?? null,
      createdByUserId: dto.userId,
      organizationId,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: {
    id?: string;
    search?: string;
    status?: string;
    userId?: string;
    organizationId?: string;
  }): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<MaternityRecordDocument> = {};
    if (filters.id) query.id = Number(filters.id);
    if (filters.status) query.status = filters.status;
    if (filters.userId) query.createdByUserId = Number(filters.userId);
    if (filters.organizationId) query.organizationId = Number(filters.organizationId);
    if (filters.search?.trim()) {
      const value = filters.search.trim();
      query.$or = [
        { childFullName: { $regex: value, $options: 'i' } },
        { fatherFullName: { $regex: value, $options: 'i' } },
        { motherFullName: { $regex: value, $options: 'i' } },
        { placeOfBirth: { $regex: value, $options: 'i' } },
      ];
    }

    const records = await this.maternityModel.find(query).sort({ id: -1 }).lean();
    return Promise.all(records.map((record) => this.mapRecord(record)));
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Maternity record');
    const record = await this.maternityModel.findOne({ id: numericId }).lean();
    if (!record) {
      throw new NotFoundException(`Maternity record ${numericId} not found`);
    }
    return this.mapRecord(record);
  }

  async update(id: number | string, dto: UpdateMaternityRecordDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Maternity record');
    const existing = await this.maternityModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Maternity record ${numericId} not found`);
    }

    const payload: Record<string, unknown> = {};
    if (dto.userId !== undefined) {
      const user = await this.usersService.findOne(dto.userId);
      payload.createdByUserId = dto.userId;
      payload.organizationId = (user.organizationId as number | null) ?? 0;
    }
    if (dto.birthDateTime !== undefined) payload.birthDateTime = new Date(dto.birthDateTime);
    if (dto.placeOfBirth !== undefined) payload.placeOfBirth = dto.placeOfBirth;
    if (dto.gender !== undefined) payload.gender = dto.gender;
    if (dto.childFullName !== undefined) payload.childFullName = dto.childFullName?.trim() ? dto.childFullName.trim() : null;
    if (Object.prototype.hasOwnProperty.call(dto, 'childCitizenId')) payload.childCitizenId = dto.childCitizenId ?? null;
    if (dto.fatherFullName !== undefined) payload.fatherFullName = dto.fatherFullName ?? null;
    if (dto.motherFullName !== undefined) payload.motherFullName = dto.motherFullName ?? null;
    if (Object.prototype.hasOwnProperty.call(dto, 'fatherPersonId')) {
      payload.fatherCitizenId = dto.fatherPersonId ?? null;
    } else if (dto.fatherFullName !== undefined) {
      payload.fatherCitizenId = await this.resolveCitizenIdByFullName(dto.fatherFullName);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'motherCitizenId')) {
      payload.motherCitizenId = dto.motherCitizenId ?? null;
    } else if (dto.motherFullName !== undefined) {
      payload.motherCitizenId = await this.resolveCitizenIdByFullName(dto.motherFullName);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'familyId')) payload.familyId = dto.familyId ?? null;
    if (dto.birthCaseType !== undefined) {
      payload.birthCaseType = this.normalizeBirthCaseType(
        dto.birthCaseType,
        dto.fatherFullName ?? existing.fatherFullName ?? null,
        dto.motherFullName ?? existing.motherFullName ?? null,
      );
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'birthWeight')) payload.birthWeight = dto.birthWeight ?? null;
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.comment !== undefined) payload.comment = dto.comment ?? null;
    if (dto.medicalCertificateNumber !== undefined) {
      payload.medicalCertificateNumber = dto.medicalCertificateNumber ?? null;
    }

    const updated = await this.maternityModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();

    if (!updated) {
      throw new NotFoundException(`Maternity record ${numericId} not found`);
    }
    return this.mapRecord(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Maternity record');
    const result = await this.maternityModel.findOneAndDelete({ id: numericId }).lean();
    if (!result) {
      throw new NotFoundException(`Maternity record ${numericId} not found`);
    }
  }

  private async mapRecord(record: Record<string, any>): Promise<Record<string, unknown>> {
    const user = await this.usersService.findOne(record.createdByUserId);
    return {
      id: record.id,
      userId: record.createdByUserId,
      userName: (user.username as string) ?? null,
      birthDateTime: new Date(record.birthDateTime).toISOString(),
      placeOfBirth: record.placeOfBirth ?? null,
      gender: record.gender ?? null,
      childFullName: record.childFullName ?? null,
      fatherFullName: record.fatherFullName ?? null,
      motherFullName: record.motherFullName ?? null,
      fatherPersonId: record.fatherCitizenId ?? null,
      childCitizenId: record.childCitizenId ?? null,
      motherCitizenId: record.motherCitizenId ?? null,
      familyId: record.familyId ?? null,
      birthCaseType: record.birthCaseType ?? null,
      birthWeight: record.birthWeight ?? null,
      status: record.status ?? null,
      comment: record.comment ?? null,
      createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : null,
      organizationId: record.organizationId ?? null,
    };
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }

  private async seedDefaults(): Promise<void> {
    for (const item of MATERNITY_RECORD_SEED) {
      const existing = await this.maternityModel
        .findOne({ childFullName: item.childFullName, birthDateTime: new Date(item.birthDateTime) })
        .lean();

      if (existing) {
        continue;
      }

      await this.create(item as CreateMaternityRecordDto);
    }
  }

  private async resolveCitizenIdByFullName(fullName: string | null | undefined): Promise<number | null> {
    const normalized = this.normalizeName(fullName ?? '');
    if (!normalized) {
      return null;
    }

    const people = await this.citizensService.getPeopleList(normalized);
    const matched = people.find((person) => this.matchesNameLoosely(normalized, this.normalizeName(person.fullName)));
    return matched?.id ?? null;
  }

  private normalizeName(value: string | null | undefined): string {
    return (value ?? '').toLowerCase().replace(/\s+/g, ' ').replace(/[.,]/g, '').trim();
  }

  private matchesNameLoosely(expected: string, candidate: string): boolean {
    if (!expected || !candidate) {
      return false;
    }

    if (expected === candidate) {
      return true;
    }

    const expectedParts = expected.split(' ').filter((part) => part.length > 0);
    const candidateParts = candidate.split(' ').filter((part) => part.length > 0);
    if (expectedParts.length === 0 || candidateParts.length === 0) {
      return false;
    }

    if (expectedParts[0] !== candidateParts[0]) {
      return false;
    }

    for (let index = 1; index < expectedParts.length; index += 1) {
      const expectedPart = expectedParts[index];
      const candidatePart = candidateParts[index] ?? candidateParts[candidateParts.length - 1];
      if (!candidatePart) {
        return false;
      }

      if (candidatePart.startsWith(expectedPart)) {
        continue;
      }

      if (expectedPart.length === 1 && candidatePart.startsWith(expectedPart[0])) {
        continue;
      }

      if (candidatePart[0] === expectedPart[0]) {
        continue;
      }

      return false;
    }

    return true;
  }

  private normalizeBirthCaseType(
    value: string | undefined | null,
    fatherFullName: string | null | undefined,
    motherFullName: string | null | undefined,
  ): string {
    if (value && MATERNITY_BIRTH_CASE_TYPES.includes(value as (typeof MATERNITY_BIRTH_CASE_TYPES)[number])) {
      return value;
    }

    const hasFather = !!fatherFullName?.trim();
    const hasMother = !!motherFullName?.trim();
    if (hasMother && !hasFather) {
      return 'OUT_OF_WEDLOCK';
    }
    if (hasFather && hasMother) {
      return 'STANDARD_MARRIAGE';
    }
    return 'STANDARD_MARRIAGE';
  }
}
