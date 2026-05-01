import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { FamiliesService } from '../families/families.service';
import { MaternityService } from '../maternity/maternity.service';
import { MilitaryService } from '../military/military.service';
import { UsersService } from '../users/users.service';
import { CreateZagsActDto } from './dto/create-zags-act.dto';
import { UpdateZagsActDto } from './dto/update-zags-act.dto';
import { MATERNITY_BIRTH_CASE_TYPES } from '../maternity/maternity.constants';
import { ZAGS_ACT_SEED } from './zags.seed';
import { ZagsAct, ZagsActDocument } from './schemas/zags-act.schema';

@Injectable()
export class ZagsService implements OnModuleInit {
  constructor(
    @InjectModel(ZagsAct.name) private readonly zagsModel: Model<ZagsActDocument>,
    private readonly countersService: CountersService,
    private readonly usersService: UsersService,
    private readonly maternityService: MaternityService,
    private readonly citizensService: CitizensService,
    private readonly familiesService: FamiliesService,
    private readonly militaryService: MilitaryService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaults();
    await this.backfillBirthLinks();
  }

  async create(dto: CreateZagsActDto): Promise<Record<string, unknown>> {
    this.assertBirthChildName(dto.actType, dto.birthDetails?.childFullName ?? null);
    const user = await this.usersService.findOne(dto.userId);
    if (dto.maternityRecordId) await this.maternityService.findOne(dto.maternityRecordId);
    if (dto.citizenId) await this.citizensService.findOne(dto.citizenId);

    const nextId = await this.countersService.getNextSequence('zags_acts');
    await this.zagsModel.create({
      id: nextId,
      actNumber: dto.actNumber,
      actType: dto.actType,
      status: dto.status ?? 'REGISTERED',
      registrationDate: new Date(dto.registrationDate),
      placeOfRegistration: dto.placeOfRegistration,
      citizenId: dto.citizenId ?? null,
      maternityRecordId: dto.maternityRecordId ?? null,
      familyId: dto.familyId ?? null,
      createdByUserId: dto.userId,
      organizationId: (user.organizationId as number | null) ?? 0,
      birthDetails: this.mapBirthDetails(dto),
      marriageDetails: await this.mapMarriageDetails(dto),
      deathDetails: this.mapDeathDetails(dto),
    });

    const created = await this.findOne(nextId);
    if (dto.actType === 'BIRTH') {
      await this.syncBirthLinks(created as Record<string, any>, this.normalizeBirthCaseType(
        dto.birthDetails?.birthCaseType,
        dto.birthDetails?.motherFullName ?? null,
        dto.birthDetails?.fatherFullName ?? null,
      ));
      return this.findOne(nextId);
    }

    return created;
  }

  async findAll(filters: Record<string, string | undefined>): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<ZagsActDocument> = {};
    if (filters.id) query.id = Number(filters.id);
    if (filters.actType) query.actType = filters.actType;
    if (filters.status) query.status = filters.status;
    if (filters.userId) query.createdByUserId = Number(filters.userId);
    if (filters.citizenId) query.citizenId = Number(filters.citizenId);
    if (filters.maternityRecordId) query.maternityRecordId = Number(filters.maternityRecordId);
    if (filters.search?.trim()) {
      const value = filters.search.trim();
      query.$or = [
        { actNumber: { $regex: value, $options: 'i' } },
        { placeOfRegistration: { $regex: value, $options: 'i' } },
        { 'birthDetails.childFullName': { $regex: value, $options: 'i' } },
        { 'marriageDetails.spouseOneFullName': { $regex: value, $options: 'i' } },
        { 'marriageDetails.spouseTwoFullName': { $regex: value, $options: 'i' } },
        { 'deathDetails.deceasedFullName': { $regex: value, $options: 'i' } },
      ];
    }
    const acts = await this.zagsModel.find(query).sort({ id: -1 }).lean();
    return Promise.all(acts.map((act) => this.mapAct(act)));
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Zags act');
    const act = await this.zagsModel.findOne({ id: numericId }).lean();
    if (!act) throw new NotFoundException(`Zags act ${numericId} not found`);
    return this.mapAct(act);
  }

  async update(id: number | string, dto: UpdateZagsActDto): Promise<Record<string, unknown>> {
    this.assertBirthChildName(
      dto.actType ?? undefined,
      dto.birthDetails ? dto.birthDetails.childFullName : undefined,
      true,
    );
    const numericId = this.parseId(id, 'Zags act');
    const existing = await this.zagsModel.findOne({ id: numericId }).lean();
    if (!existing) throw new NotFoundException(`Zags act ${numericId} not found`);

    const payload: Record<string, unknown> = {};
    if (dto.actNumber !== undefined) payload.actNumber = dto.actNumber;
    if (dto.actType !== undefined) payload.actType = dto.actType;
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.registrationDate !== undefined) payload.registrationDate = new Date(dto.registrationDate);
    if (dto.placeOfRegistration !== undefined) payload.placeOfRegistration = dto.placeOfRegistration;
    if (Object.prototype.hasOwnProperty.call(dto, 'citizenId')) payload.citizenId = dto.citizenId ?? null;
    if (Object.prototype.hasOwnProperty.call(dto, 'maternityRecordId')) payload.maternityRecordId = dto.maternityRecordId ?? null;
    if (Object.prototype.hasOwnProperty.call(dto, 'familyId')) payload.familyId = dto.familyId ?? null;
    if (dto.userId !== undefined) {
      const user = await this.usersService.findOne(dto.userId);
      payload.createdByUserId = dto.userId;
      payload.organizationId = (user.organizationId as number | null) ?? 0;
    }
    if (dto.birthDetails !== undefined) payload.birthDetails = this.mapBirthDetails(dto);
    if (dto.marriageDetails !== undefined) payload.marriageDetails = await this.mapMarriageDetails(dto);
    if (dto.deathDetails !== undefined) payload.deathDetails = this.mapDeathDetails(dto);

    const updated = await this.zagsModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) throw new NotFoundException(`Zags act ${numericId} not found`);
    if ((existing.actType ?? dto.actType) === 'BIRTH') {
      const birthCaseType = this.normalizeBirthCaseType(
        dto.birthDetails?.birthCaseType ?? updated.birthDetails?.birthCaseType,
        dto.birthDetails?.motherFullName ?? updated.birthDetails?.motherFullName ?? null,
        dto.birthDetails?.fatherFullName ?? updated.birthDetails?.fatherFullName ?? null,
      );
      await this.syncBirthLinks(updated as Record<string, any>, birthCaseType);
      return this.findOne(numericId);
    }
    return this.mapAct(updated);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Zags act');
    const result = await this.zagsModel.findOneAndDelete({ id: numericId }).lean();
    if (!result) throw new NotFoundException(`Zags act ${numericId} not found`);
  }

  async findBirthRecords(): Promise<Record<string, unknown>[]> {
    const acts = await this.zagsModel.find({ actType: 'BIRTH' }).sort({ id: -1 }).lean();
    return Promise.all(acts.map((act) => this.mapBirthRecord(act)));
  }

  async createBirthRecord(dto: any): Promise<Record<string, unknown>> {
    this.assertBirthChildName('BIRTH', dto.childFullName ?? dto.birthDetails?.childFullName ?? null);
    const birthCaseType = this.normalizeBirthCaseType(
      dto.birthDetails?.birthCaseType,
      dto.motherFullName ?? dto.birthDetails?.motherFullName ?? null,
      dto.fatherFullName ?? dto.birthDetails?.fatherFullName ?? null,
    );
    const act = await this.create({
      actNumber: dto.actNumber,
      actType: 'BIRTH',
      status: dto.status ?? 'REGISTERED',
      registrationDate: dto.registrationDate,
      placeOfRegistration: dto.placeOfRegistration,
      userId: dto.userId,
      citizenId: dto.peopleId ?? null,
      maternityRecordId: dto.maternityRecordId ?? null,
      birthDetails: {
        childCitizenId: dto.peopleId ?? null,
        birthCaseType,
        childFullName: dto.childFullName?.trim() ? dto.childFullName.trim() : null,
        birthDate: dto.birthDate,
        birthPlace: dto.birthPlace,
        motherFullName: dto.motherFullName ?? null,
        fatherCitizenId: dto.fatherPersonId ?? null,
        fatherFullName: dto.fatherFullName ?? null,
        motherCitizenId: dto.motherCitizenId ?? null,
      },
    } as CreateZagsActDto);
    const synced = await this.syncBirthLinks(act as Record<string, any>, birthCaseType);
    return this.mapBirthRecord(synced as Record<string, any>);
  }

  async updateBirthRecord(id: number | string, dto: any): Promise<Record<string, unknown>> {
    this.assertBirthChildName(
      'BIRTH',
      dto.childFullName !== undefined ? dto.childFullName : dto.birthDetails?.childFullName,
      true,
    );
    const birthCaseType = this.normalizeBirthCaseType(
      dto.birthDetails?.birthCaseType,
      dto.motherFullName ?? dto.birthDetails?.motherFullName ?? null,
      dto.fatherFullName ?? dto.birthDetails?.fatherFullName ?? null,
    );
    const act = await this.update(id, {
      actNumber: dto.actNumber,
      status: dto.status ?? 'REGISTERED',
      registrationDate: dto.registrationDate,
      placeOfRegistration: dto.placeOfRegistration,
      userId: dto.userId,
      citizenId: dto.peopleId ?? null,
      maternityRecordId: dto.maternityRecordId ?? null,
      birthDetails: {
        childCitizenId: dto.peopleId ?? null,
        birthCaseType,
        childFullName: dto.childFullName?.trim() ? dto.childFullName.trim() : null,
        birthDate: dto.birthDate,
        birthPlace: dto.birthPlace,
        motherFullName: dto.motherFullName ?? null,
        fatherCitizenId: dto.fatherPersonId ?? null,
        fatherFullName: dto.fatherFullName ?? null,
        motherCitizenId: dto.motherCitizenId ?? null,
      },
    } as UpdateZagsActDto);
    const synced = await this.syncBirthLinks(act as Record<string, any>, birthCaseType);
    return this.mapBirthRecord(synced as Record<string, any>);
  }

  private async mapAct(act: Record<string, any>): Promise<Record<string, unknown>> {
    const user = await this.usersService.findOne(act.createdByUserId);
    return {
      id: act.id,
      actNumber: act.actNumber,
      actType: act.actType,
      status: act.status,
      registrationDate: new Date(act.registrationDate).toISOString().split('T')[0],
      placeOfRegistration: act.placeOfRegistration,
      citizenId: act.citizenId ?? null,
      maternityRecordId: act.maternityRecordId ?? null,
      familyId: act.familyId ?? null,
      userId: act.createdByUserId,
      userName: (user.username as string) ?? null,
      organizationId: act.organizationId ?? null,
      birthDetails: act.birthDetails ?? null,
      marriageDetails: act.marriageDetails ?? null,
      deathDetails: act.deathDetails ?? null,
      createdAt: act.createdAt ? new Date(act.createdAt).toISOString() : null,
    };
  }

  private async mapBirthRecord(source: Record<string, any>): Promise<Record<string, unknown>> {
    const act = source.birthDetails ? source : await this.findOne(source.id);
    const birthDetails = act.birthDetails ?? null;
    return {
      id: act.id,
      maternityRecordId: act.maternityRecordId ?? null,
      peopleId: birthDetails?.childCitizenId ?? act.citizenId ?? null,
      peopleFullName: birthDetails?.childFullName ?? null,
      userId: act.userId ?? act.createdByUserId,
      userName: act.userName ?? null,
      actNumber: act.actNumber ?? null,
      childFullName: birthDetails?.childFullName ?? null,
      birthDate: birthDetails?.birthDate ? new Date(birthDetails.birthDate).toISOString().split('T')[0] : null,
      registrationDate: act.registrationDate ?? null,
      placeOfRegistration: act.placeOfRegistration ?? null,
      birthPlace: birthDetails?.birthPlace ?? null,
      birthCaseType: birthDetails?.birthCaseType ?? act.birthCaseType ?? null,
      fatherFullName: birthDetails?.fatherFullName ?? null,
      motherFullName: birthDetails?.motherFullName ?? null,
      fatherPersonId: birthDetails?.fatherCitizenId ?? null,
      motherCitizenId: birthDetails?.motherCitizenId ?? null,
      childCitizenId: birthDetails?.childCitizenId ?? null,
      familyId: act.familyId ?? null,
      status: act.status ?? null,
    };
  }

  private mapBirthDetails(dto: CreateZagsActDto | UpdateZagsActDto) {
    if (!dto.birthDetails) return dto.actType === 'BIRTH' ? null : undefined;
    return {
      childCitizenId: dto.birthDetails.childCitizenId ?? null,
      birthCaseType: dto.birthDetails.birthCaseType ?? 'STANDARD_MARRIAGE',
      childFullName: dto.birthDetails.childFullName?.trim() ? dto.birthDetails.childFullName.trim() : null,
      birthDate: new Date(dto.birthDetails.birthDate),
      birthPlace: dto.birthDetails.birthPlace,
      motherCitizenId: dto.birthDetails.motherCitizenId ?? null,
      motherFullName: dto.birthDetails.motherFullName ?? null,
      fatherCitizenId: dto.birthDetails.fatherCitizenId ?? null,
      fatherFullName: dto.birthDetails.fatherFullName ?? null,
    };
  }

  private async mapMarriageDetails(dto: CreateZagsActDto | UpdateZagsActDto) {
    if (!dto.marriageDetails) return dto.actType === 'MARRIAGE' ? null : undefined;
    const spouseOneCitizenId = await this.resolveCitizenIdByFullName(dto.marriageDetails.spouseOneFullName);
    const spouseTwoCitizenId = await this.resolveCitizenIdByFullName(dto.marriageDetails.spouseTwoFullName);
    return {
      spouseOneCitizenId,
      spouseOneFullName: dto.marriageDetails.spouseOneFullName,
      spouseTwoCitizenId,
      spouseTwoFullName: dto.marriageDetails.spouseTwoFullName,
      marriageDate: new Date(dto.marriageDetails.marriageDate),
      marriagePlace: dto.marriageDetails.marriagePlace,
    };
  }

  private mapDeathDetails(dto: CreateZagsActDto | UpdateZagsActDto) {
    if (!dto.deathDetails) return dto.actType === 'DEATH' ? null : undefined;
    return {
      deceasedCitizenId: dto.citizenId ?? null,
      deceasedFullName: dto.deathDetails.deceasedFullName,
      deathDate: new Date(dto.deathDetails.deathDate),
      deathPlace: dto.deathDetails.deathPlace,
      deathReason: dto.deathDetails.deathReason ?? null,
    };
  }

  private async syncBirthLinks(act: Record<string, any>, birthCaseType: string): Promise<Record<string, unknown>> {
    const birthDetails = act.birthDetails ?? null;
    if (!birthDetails) {
      return act;
    }

    const maternityRecord =
      act.maternityRecordId ? await this.maternityService.findOne(act.maternityRecordId) : null;

    const childCitizenId = await this.ensureChildCitizen(act, maternityRecord);
    const motherCitizenId =
      this.asNullableNumber(maternityRecord?.motherCitizenId) ??
      (await this.resolveCitizenIdByFullName(birthDetails.motherFullName ?? maternityRecord?.motherFullName ?? null));
    const fatherCitizenId =
      this.asNullableNumber(maternityRecord?.fatherCitizenId) ??
      (await this.resolveCitizenIdByFullName(birthDetails.fatherFullName ?? maternityRecord?.fatherFullName ?? null));
    const marriageDetails = await this.resolveMarriageDetailsByParents(
      birthDetails.fatherFullName ?? maternityRecord?.fatherFullName ?? null,
      birthDetails.motherFullName ?? maternityRecord?.motherFullName ?? null,
    );

    const isMilitaryRegisteredChild = await this.militaryService.ensureInitialRegistrationForBirth({
      peopleId: childCitizenId,
      gender: typeof maternityRecord?.gender === 'string' ? maternityRecord.gender : null,
      birthDate:
        (birthDetails.birthDate ? new Date(birthDetails.birthDate).toISOString().split('T')[0] : null) ??
        (typeof maternityRecord?.birthDateTime === 'string' || maternityRecord?.birthDateTime instanceof Date
          ? new Date(maternityRecord.birthDateTime).toISOString().split('T')[0]
          : null),
    });
    const family = await this.familiesService.syncBirthFamily({
      childCitizenId,
      motherCitizenId,
      fatherCitizenId,
      childFullName: birthDetails.childFullName ?? maternityRecord?.childFullName ?? '',
      isMilitaryRegisteredChild,
    });
    const familyId = (family?.id as number | undefined) ?? null;

    await this.syncCitizenFamilyLinks({
      childCitizenId,
      motherCitizenId,
      fatherCitizenId,
      familyId,
      isMilitaryRegisteredChild,
    });

    if (act.maternityRecordId) {
      await this.maternityService.update(act.maternityRecordId, {
        childFullName: birthDetails.childFullName ?? maternityRecord?.childFullName ?? null,
        childCitizenId,
        motherCitizenId,
        familyId,
        fatherPersonId: fatherCitizenId,
        birthCaseType,
        status: 'REGISTERED_BY_ZAGS',
      });
    }

    await this.militaryService.syncFamilyBenefitsForCitizen(fatherCitizenId);

    const updated = await this.zagsModel
      .findOneAndUpdate(
        { id: act.id },
        {
          citizenId: childCitizenId,
          familyId,
        birthDetails: {
          ...birthDetails,
          childCitizenId,
          motherCitizenId,
          fatherCitizenId,
          birthCaseType,
        },
        marriageDetails: marriageDetails ?? act.marriageDetails ?? null,
      },
      { new: true, runValidators: true },
    )
      .lean();

    return updated ?? act;
  }

  private async ensureChildCitizen(act: Record<string, any>, maternityRecord: Record<string, any> | null): Promise<number | null> {
    const existingChildId = act.birthDetails?.childCitizenId ?? act.citizenId ?? maternityRecord?.childCitizenId ?? null;
    if (existingChildId) {
      return existingChildId;
    }

    if (!maternityRecord) {
      return null;
    }

    const fullName = maternityRecord.childFullName ?? act.birthDetails?.childFullName ?? null;
    if (!fullName) {
      return null;
    }

    const parsedName = this.parseFullName(fullName);
    const gender = this.normalizeCitizenGender(maternityRecord.gender);
    const motherCitizenId =
      this.asNullableNumber(maternityRecord.motherCitizenId) ??
      (await this.resolveCitizenIdByFullName(maternityRecord.motherFullName ?? act.birthDetails?.motherFullName ?? null));
    const fatherCitizenId =
      this.asNullableNumber(maternityRecord.fatherCitizenId) ??
      (await this.resolveCitizenIdByFullName(maternityRecord.fatherFullName ?? act.birthDetails?.fatherFullName ?? null));
    const created = await this.citizensService.create({
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      middleName: parsedName.middleName,
      birthDate: maternityRecord.birthDateTime ?? act.birthDetails.birthDate,
      gender,
      citizenship: 'Таджикистан',
      lifeStatus: 'NEWBORN',
      motherFullName: maternityRecord.motherFullName ?? null,
      fatherFullName: maternityRecord.fatherFullName ?? null,
      motherCitizenId,
      fatherCitizenId,
      militaryRegisteredAtBirth: false,
    } as any);

    return (created.id as number) ?? null;
  }

  private async syncCitizenFamilyLinks(params: {
    childCitizenId: number | null;
    motherCitizenId: number | null;
    fatherCitizenId: number | null;
    familyId: number | null;
    isMilitaryRegisteredChild: boolean;
  }): Promise<void> {
    if (params.childCitizenId) {
      await this.citizensService.update(params.childCitizenId, {
        motherCitizenId: params.motherCitizenId,
        fatherCitizenId: params.fatherCitizenId,
        familyId: params.familyId,
        militaryRegisteredAtBirth: params.isMilitaryRegisteredChild,
      } as any);
    }

    if (params.fatherCitizenId) {
      await this.citizensService.update(params.fatherCitizenId, {
        familyId: params.familyId,
      } as any);
    }

    if (params.motherCitizenId) {
      await this.citizensService.update(params.motherCitizenId, {
        familyId: params.familyId,
      } as any);
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

  private asNullableNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
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

  private async resolveMarriageDetailsByParents(
    fatherFullName: string | null | undefined,
    motherFullName: string | null | undefined,
  ): Promise<Record<string, unknown> | null> {
    const father = this.normalizeName(fatherFullName ?? '');
    const mother = this.normalizeName(motherFullName ?? '');
    if (!father && !mother) {
      return null;
    }

    const marriageActs = await this.zagsModel.find({ actType: 'MARRIAGE' }).sort({ id: -1 }).lean();
    const matched = marriageActs.find((act) => {
      const spouseOne = this.normalizeName(act.marriageDetails?.spouseOneFullName ?? null);
      const spouseTwo = this.normalizeName(act.marriageDetails?.spouseTwoFullName ?? null);
      const directMatch = this.matchesNameLoosely(father, spouseOne) && this.matchesNameLoosely(mother, spouseTwo);
      const reversedMatch = this.matchesNameLoosely(father, spouseTwo) && this.matchesNameLoosely(mother, spouseOne);
      return directMatch || reversedMatch;
    });

    if (!matched?.marriageDetails) {
      return null;
    }

    return {
      spouseOneCitizenId: await this.resolveCitizenIdByFullName(matched.marriageDetails.spouseOneFullName),
      spouseOneFullName: matched.marriageDetails.spouseOneFullName ?? null,
      spouseTwoCitizenId: await this.resolveCitizenIdByFullName(matched.marriageDetails.spouseTwoFullName),
      spouseTwoFullName: matched.marriageDetails.spouseTwoFullName ?? null,
      marriageDate: matched.marriageDetails.marriageDate,
      marriagePlace: matched.marriageDetails.marriagePlace,
    };
  }

  private async backfillBirthLinks(): Promise<void> {
    const birthActs = await this.zagsModel.find({ actType: 'BIRTH' }).sort({ id: 1 }).lean();
    for (const act of birthActs) {
      const birthDetails = act.birthDetails ?? null;
      const needsSync =
        !act.citizenId ||
        !act.familyId ||
        !birthDetails?.childCitizenId ||
        !birthDetails?.motherCitizenId ||
        !birthDetails?.fatherCitizenId ||
        !act.marriageDetails;

      if (!needsSync) {
        continue;
      }

      const birthCaseType = this.normalizeBirthCaseType(
        birthDetails?.birthCaseType ?? null,
        birthDetails?.motherFullName ?? null,
        birthDetails?.fatherFullName ?? null,
      );
      try {
        await this.syncBirthLinks(act as Record<string, any>, birthCaseType);
      } catch (error) {
        if (error instanceof NotFoundException) {
          continue;
        }
        throw error;
      }
    }
  }

  private parseFullName(fullName: string): { firstName: string; lastName: string; middleName: string | null } {
    const parts = fullName.trim().split(/\s+/).filter((part) => part.length > 0);
    if (parts.length === 0) {
      return { firstName: fullName.trim(), lastName: fullName.trim(), middleName: null };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: parts[0], middleName: null };
    }
    if (parts.length === 2) {
      return { lastName: parts[0], firstName: parts[1], middleName: null };
    }
    return {
      lastName: parts[0],
      firstName: parts[1],
      middleName: parts.slice(2).join(' '),
    };
  }

  private normalizeCitizenGender(value: string | null | undefined): 'MALE' | 'FEMALE' | 'UNKNOWN' {
    const normalized = (value ?? '').toString().trim().toUpperCase();
    if (normalized === 'MALE' || normalized === 'M' || normalized === 'МУЖСКОЙ') {
      return 'MALE';
    }
    if (normalized === 'FEMALE' || normalized === 'F' || normalized === 'ЖЕНСКИЙ') {
      return 'FEMALE';
    }
    return 'UNKNOWN';
  }

  private normalizeBirthCaseType(
    value: string | undefined | null,
    motherFullName: string | null | undefined,
    fatherFullName: string | null | undefined,
  ): string {
    if (value && MATERNITY_BIRTH_CASE_TYPES.includes(value as (typeof MATERNITY_BIRTH_CASE_TYPES)[number])) {
      return value;
    }

    const hasMother = !!motherFullName?.trim();
    const hasFather = !!fatherFullName?.trim();
    if (hasMother && !hasFather) {
      return 'OUT_OF_WEDLOCK';
    }
    if (hasFather && hasMother) {
      return 'STANDARD_MARRIAGE';
    }
    return 'STANDARD_MARRIAGE';
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }

  private assertBirthChildName(
    actType: string | undefined,
    childFullName: string | null | undefined,
    allowExistingUpdate: boolean = false,
  ): void {
    if ((actType ?? '').toUpperCase() !== 'BIRTH') {
      return;
    }

    if (allowExistingUpdate && childFullName === undefined) {
      return;
    }

    if (!childFullName?.trim()) {
      throw new BadRequestException('childFullName is required for BIRTH acts');
    }
  }

  private async seedDefaults(): Promise<void> {
    for (const seed of ZAGS_ACT_SEED) {
      const existing = await this.zagsModel.findOne({ actNumber: seed.actNumber }).lean();
      if (existing) {
        continue;
      }

      await this.create(seed as CreateZagsActDto);
    }
  }
}
