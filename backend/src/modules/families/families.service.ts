import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { Family, FamilyDocument } from './schemas/family.schema';

type BirthFamilySyncParams = {
  childCitizenId: number | null;
  motherCitizenId: number | null;
  fatherCitizenId: number | null;
  childFullName: string;
  isMilitaryRegisteredChild: boolean;
};

@Injectable()
export class FamiliesService {
  constructor(
    @InjectModel(Family.name) private readonly familyModel: Model<FamilyDocument>,
    private readonly countersService: CountersService,
    private readonly citizensService: CitizensService,
  ) {}

  async create(dto: CreateFamilyDto): Promise<Record<string, unknown>> {
    const normalized = await this.normalizeFamilyDraft(dto);
    const nextId = await this.countersService.getNextSequence('families');
    await this.familyModel.create({
      id: nextId,
      familyName: dto.familyName,
      primaryCitizenId: normalized.primaryCitizenId,
      fatherCitizenId: normalized.fatherCitizenId,
      motherCitizenId: normalized.motherCitizenId,
      memberCitizenIds: normalized.memberCitizenIds,
      childCitizenIds: normalized.childCitizenIds,
      militaryRegisteredChildCitizenIds: normalized.militaryRegisteredChildCitizenIds,
      addressId: dto.addressId ?? null,
      status: dto.status ?? 'ACTIVE',
      notes: dto.notes ?? null,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: { search?: string; citizenId?: string; status?: string }): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<FamilyDocument> = {};
    if (filters.citizenId) {
      const citizenId = Number(filters.citizenId);
      query.$or = [
        { primaryCitizenId: citizenId },
        { fatherCitizenId: citizenId },
        { motherCitizenId: citizenId },
        { memberCitizenIds: citizenId },
        { childCitizenIds: citizenId },
      ];
    }
    if (filters.status?.trim()) {
      query.status = filters.status.trim();
    }
    if (filters.search?.trim()) {
      query.familyName = { $regex: filters.search.trim(), $options: 'i' };
    }

    const families = await this.familyModel.find(query).sort({ id: -1 }).lean();
    return Promise.all(families.map((family) => this.mapFamily(family)));
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Family');
    const family = await this.familyModel.findOne({ id: numericId }).lean();
    if (!family) {
      throw new NotFoundException(`Family ${numericId} not found`);
    }
    return this.mapFamily(family);
  }

  async update(id: number | string, dto: UpdateFamilyDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Family');
    const existing = await this.familyModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Family ${numericId} not found`);
    }

    const normalized = await this.normalizeFamilyDraft({
      familyName: dto.familyName ?? existing.familyName,
      primaryCitizenId: dto.primaryCitizenId ?? existing.primaryCitizenId,
      fatherCitizenId:
        Object.prototype.hasOwnProperty.call(dto, 'fatherCitizenId')
          ? dto.fatherCitizenId ?? null
          : existing.fatherCitizenId ?? null,
      motherCitizenId:
        Object.prototype.hasOwnProperty.call(dto, 'motherCitizenId')
          ? dto.motherCitizenId ?? null
          : existing.motherCitizenId ?? null,
      memberCitizenIds: dto.memberCitizenIds ?? existing.memberCitizenIds ?? [],
      childCitizenIds: dto.childCitizenIds ?? existing.childCitizenIds ?? [],
      militaryRegisteredChildCitizenIds:
        dto.militaryRegisteredChildCitizenIds ?? existing.militaryRegisteredChildCitizenIds ?? [],
      addressId:
        Object.prototype.hasOwnProperty.call(dto, 'addressId') ? dto.addressId ?? null : existing.addressId ?? null,
      status: dto.status ?? existing.status,
      notes: dto.notes ?? existing.notes ?? null,
    });

    const payload: Record<string, unknown> = {
      primaryCitizenId: normalized.primaryCitizenId,
      fatherCitizenId: normalized.fatherCitizenId,
      motherCitizenId: normalized.motherCitizenId,
      memberCitizenIds: normalized.memberCitizenIds,
      childCitizenIds: normalized.childCitizenIds,
      militaryRegisteredChildCitizenIds: normalized.militaryRegisteredChildCitizenIds,
    };

    if (dto.familyName !== undefined) payload.familyName = dto.familyName;
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.notes !== undefined) payload.notes = dto.notes ?? null;
    if (Object.prototype.hasOwnProperty.call(dto, 'addressId')) payload.addressId = dto.addressId ?? null;

    const updated = await this.familyModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();

    if (!updated) {
      throw new NotFoundException(`Family ${numericId} not found`);
    }
    return this.mapFamily(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Family');
    const deleted = await this.familyModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`Family ${numericId} not found`);
    }
  }

  async syncBirthFamily(params: BirthFamilySyncParams): Promise<Record<string, unknown> | null> {
    const childCitizenId = this.asValidId(params.childCitizenId);
    const motherCitizenId = this.asValidId(params.motherCitizenId);
    const fatherCitizenId = this.asValidId(params.fatherCitizenId);
    const candidateIds = [childCitizenId, motherCitizenId, fatherCitizenId].filter(
      (value): value is number => typeof value === 'number',
    );

    if (candidateIds.length === 0) {
      return null;
    }

    const existing = await this.findMatchingFamily(childCitizenId, motherCitizenId, fatherCitizenId);
    const memberCitizenIds = this.buildMemberIds(
      childCitizenId,
      fatherCitizenId,
      motherCitizenId,
      existing?.memberCitizenIds as number[] | undefined,
      existing?.childCitizenIds as number[] | undefined,
    );
    const childCitizenIds = this.buildChildIds(childCitizenId, existing?.childCitizenIds as number[] | undefined);
    const militaryRegisteredChildCitizenIds = this.buildMilitaryChildIds(
      childCitizenId,
      params.isMilitaryRegisteredChild,
      existing?.militaryRegisteredChildCitizenIds as number[] | undefined,
    );
    const familyName = this.buildFamilyName(params.childFullName, fatherCitizenId, motherCitizenId);

    if (existing?.id) {
      return this.update(existing.id as number, {
        familyName,
        primaryCitizenId:
          (existing.primaryCitizenId as number | undefined) ??
          fatherCitizenId ??
          motherCitizenId ??
          childCitizenId ??
          0,
        fatherCitizenId,
        motherCitizenId,
        memberCitizenIds,
        childCitizenIds,
        militaryRegisteredChildCitizenIds,
        status: 'ACTIVE',
      });
    }

    if (!childCitizenId && !fatherCitizenId && !motherCitizenId) {
      return null;
    }

    return this.create({
      familyName,
      primaryCitizenId: fatherCitizenId ?? motherCitizenId ?? childCitizenId ?? 0,
      fatherCitizenId,
      motherCitizenId,
      memberCitizenIds,
      childCitizenIds,
      militaryRegisteredChildCitizenIds,
      status: 'ACTIVE',
      notes: 'Auto-linked from birth registration',
    });
  }

  private async mapFamily(family: Record<string, any>): Promise<Record<string, unknown>> {
    const primaryCitizen = await this.safeFindCitizen(family.primaryCitizenId);
    const father = await this.safeFindCitizen(family.fatherCitizenId);
    const mother = await this.safeFindCitizen(family.motherCitizenId);
    const childIds = this.toSortedUniqueNumberArray(family.childCitizenIds ?? []);
    const militaryChildIds = this.toSortedUniqueNumberArray(family.militaryRegisteredChildCitizenIds ?? []);
    const children = await Promise.all(childIds.map((citizenId) => this.safeFindCitizen(citizenId)));
    const normalizedChildren = children
      .filter((child): child is Record<string, unknown> => !!child)
      .map((child) => ({
        id: child.id,
        fullName: child.fullName,
        gender: child.gender,
        birthDate: child.birthDate,
        familyId: child.familyId ?? null,
        militaryRegisteredAtBirth: Boolean(child.militaryRegisteredAtBirth),
      }));

    const sonsCount = normalizedChildren.filter((child) => String(child.gender ?? '').toUpperCase() === 'MALE').length;
    const daughtersCount = normalizedChildren.filter((child) => String(child.gender ?? '').toUpperCase() === 'FEMALE').length;

    return {
      id: family.id,
      familyName: family.familyName,
      primaryCitizenId: family.primaryCitizenId,
      primaryCitizenFullName: primaryCitizen?.fullName ?? null,
      fatherCitizenId: family.fatherCitizenId ?? null,
      fatherFullName: father?.fullName ?? null,
      motherCitizenId: family.motherCitizenId ?? null,
      motherFullName: mother?.fullName ?? null,
      memberCitizenIds: this.toSortedUniqueNumberArray(family.memberCitizenIds ?? []),
      memberCount: this.toSortedUniqueNumberArray(family.memberCitizenIds ?? []).length,
      childCitizenIds: childIds,
      childrenCount: childIds.length,
      sonsCount,
      daughtersCount,
      militaryRegisteredChildCitizenIds: militaryChildIds,
      militaryRegisteredChildrenCount: militaryChildIds.length,
      children: normalizedChildren,
      eligibleFatherForMilitaryExemption: childIds.length >= 2,
      addressId: family.addressId ?? null,
      addressLabel: family.addressId ? `Address ${family.addressId}` : null,
      status: family.status,
      notes: family.notes ?? null,
      createdAt: family.createdAt ? new Date(family.createdAt).toISOString() : null,
    };
  }

  private async normalizeFamilyDraft(
    dto: CreateFamilyDto,
  ): Promise<{
    primaryCitizenId: number;
    fatherCitizenId: number | null;
    motherCitizenId: number | null;
    memberCitizenIds: number[];
    childCitizenIds: number[];
    militaryRegisteredChildCitizenIds: number[];
  }> {
    const primaryCitizenId = this.asRequiredId(dto.primaryCitizenId);
    await this.assertCitizenExists(primaryCitizenId);

    const fatherCitizenId = this.asValidId(dto.fatherCitizenId ?? null);
    const motherCitizenId = this.asValidId(dto.motherCitizenId ?? null);
    const childCitizenIds = this.toSortedUniqueNumberArray(dto.childCitizenIds ?? []);
    const militaryRegisteredChildCitizenIds = this.toSortedUniqueNumberArray(
      (dto.militaryRegisteredChildCitizenIds ?? []).filter((citizenId) => childCitizenIds.includes(citizenId)),
    );
    const memberCitizenIds = this.buildMemberIds(
      null,
      fatherCitizenId,
      motherCitizenId,
      dto.memberCitizenIds ?? [],
      childCitizenIds,
      primaryCitizenId,
    );

    await this.assertCitizensExist(
      [primaryCitizenId, fatherCitizenId, motherCitizenId, ...memberCitizenIds, ...childCitizenIds].filter(
        (value): value is number => typeof value === 'number',
      ),
    );

    return {
      primaryCitizenId,
      fatherCitizenId,
      motherCitizenId,
      memberCitizenIds,
      childCitizenIds,
      militaryRegisteredChildCitizenIds,
    };
  }

  private buildMemberIds(
    childCitizenId: number | null,
    fatherCitizenId: number | null,
    motherCitizenId: number | null,
    memberCitizenIds: number[] = [],
    childCitizenIds: number[] = [],
    primaryCitizenId?: number,
  ): number[] {
    return this.toSortedUniqueNumberArray([
      ...(primaryCitizenId ? [primaryCitizenId] : []),
      ...(fatherCitizenId ? [fatherCitizenId] : []),
      ...(motherCitizenId ? [motherCitizenId] : []),
      ...(childCitizenId ? [childCitizenId] : []),
      ...memberCitizenIds,
      ...childCitizenIds,
    ]);
  }

  private buildChildIds(childCitizenId: number | null, currentChildIds: number[] = []): number[] {
    return this.toSortedUniqueNumberArray([...(childCitizenId ? [childCitizenId] : []), ...currentChildIds]);
  }

  private buildMilitaryChildIds(
    childCitizenId: number | null,
    isMilitaryRegisteredChild: boolean,
    currentIds: number[] = [],
  ): number[] {
    const nextIds = [...currentIds];
    if (childCitizenId && isMilitaryRegisteredChild) {
      nextIds.push(childCitizenId);
    }
    return this.toSortedUniqueNumberArray(nextIds);
  }

  private async findMatchingFamily(
    childCitizenId: number | null,
    motherCitizenId: number | null,
    fatherCitizenId: number | null,
  ): Promise<Record<string, unknown> | null> {
    const query: FilterQuery<FamilyDocument> = {
      $or: [
        ...(fatherCitizenId ? [{ fatherCitizenId }] : []),
        ...(motherCitizenId ? [{ motherCitizenId }] : []),
        ...(childCitizenId ? [{ childCitizenIds: childCitizenId }, { memberCitizenIds: childCitizenId }] : []),
      ],
    };

    if (!query.$or || query.$or.length === 0) {
      return null;
    }

    const family = await this.familyModel.findOne(query).sort({ id: -1 }).lean();
    return family ? this.mapFamily(family) : null;
  }

  private buildFamilyName(childFullName: string, fatherCitizenId: number | null, motherCitizenId: number | null): string {
    const childSurname = childFullName.trim().split(/\s+/)[0] || 'Family';
    if (fatherCitizenId || motherCitizenId) {
      return `${childSurname} family`;
    }
    return `${childSurname} family`;
  }

  private toSortedUniqueNumberArray(values: number[]): number[] {
    return Array.from(
      new Set(
        values.filter((value) => typeof value === 'number' && Number.isInteger(value) && value > 0),
      ),
    ).sort((left, right) => left - right);
  }

  private asValidId(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
  }

  private asRequiredId(value: number | null | undefined): number {
    const normalized = this.asValidId(value);
    if (!normalized) {
      throw new NotFoundException('Family primary citizen not found');
    }
    return normalized;
  }

  private async assertCitizensExist(citizenIds: number[]): Promise<void> {
    for (const citizenId of citizenIds) {
      await this.assertCitizenExists(citizenId);
    }
  }

  private async assertCitizenExists(citizenId: number): Promise<void> {
    await this.citizensService.findOne(citizenId);
  }

  private async safeFindCitizen(citizenId: number | null | undefined): Promise<Record<string, unknown> | null> {
    if (!citizenId) {
      return null;
    }
    try {
      return await this.citizensService.findOne(citizenId);
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
