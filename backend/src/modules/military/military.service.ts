import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { UsersService } from '../users/users.service';
import { CreateMilitaryRecordDto } from './dto/create-military-record.dto';
import { ReviewMilitaryDefermentDto } from './dto/review-military-deferment.dto';
import { UpdateMilitaryRecordDto } from './dto/update-military-record.dto';
import { MILITARY_RECORD_SEED } from './military.seed';
import { MilitaryRecord, MilitaryRecordDocument } from './schemas/military-record.schema';
import { ZagsAct, ZagsActDocument } from '../zags/schemas/zags-act.schema';
import { Family, FamilyDocument } from '../families/schemas/family.schema';

const FAMILY_EXEMPTION_REASON = 'Освобожден от призыва по семейным обстоятельствам: двое или более детей';

@Injectable()
export class MilitaryService implements OnModuleInit {
  constructor(
    @InjectModel(MilitaryRecord.name)
    private readonly militaryRecordModel: Model<MilitaryRecordDocument>,
    @InjectModel(ZagsAct.name)
    private readonly zagsActModel: Model<ZagsActDocument>,
    @InjectModel(Family.name)
    private readonly familyModel: Model<FamilyDocument>,
    private readonly countersService: CountersService,
    private readonly citizensService: CitizensService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.ENABLE_DOMAIN_SEEDS === 'true') {
      await this.seedDefaults();
    }
  }

  async create(dto: CreateMilitaryRecordDto): Promise<Record<string, unknown>> {
    await this.citizensService.findOne(dto.peopleId);
    const user = await this.usersService.findOne(dto.userId);

    const nextId = await this.countersService.getNextSequence('military_records');
    await this.militaryRecordModel.create({
      id: nextId,
      peopleId: dto.peopleId,
      userId: dto.userId,
      organizationId: (user.organizationId as number | null) ?? null,
      office: dto.office,
      district: dto.district ?? null,
      enlistDate: new Date(dto.enlistDate),
      assignmentDate: dto.assignmentDate ?? null,
      serviceUnit: dto.serviceUnit ?? null,
      serviceCity: dto.serviceCity ?? null,
      commanderName: dto.commanderName ?? null,
      orderNumber: dto.orderNumber ?? null,
      category: dto.category ?? null,
      status: dto.status ?? 'ENLISTED',
      militaryStatus: dto.militaryStatus ?? 'CONSCRIPT',
      defermentReason: dto.defermentReason ?? null,
      defermentUntil: dto.defermentUntil ? new Date(dto.defermentUntil) : null,
      militaryOfficeNotified: dto.militaryOfficeNotified ?? false,
      notes: dto.notes ?? null,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: { search?: string; peopleId?: string; status?: string; militaryStatus?: string; office?: string } = {}): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<MilitaryRecordDocument> = {};
    if (filters.peopleId) query.peopleId = Number(filters.peopleId);
    if (filters.status?.trim()) query.status = filters.status.trim();
    if (filters.militaryStatus?.trim()) query.militaryStatus = filters.militaryStatus.trim();
    if (filters.office?.trim()) query.office = { $regex: filters.office.trim(), $options: 'i' };

    const records = await this.militaryRecordModel.find(query).sort({ id: -1 }).lean();
    const mapped = await Promise.all(records.map((record) => this.mapRecord(record)));

    if (!filters.search?.trim()) {
      return mapped;
    }
    const searchValue = filters.search.trim().toLowerCase();
    return mapped.filter((record) => {
      const person = String(record.peopleFullName ?? '').toLowerCase();
      const office = String(record.office ?? '').toLowerCase();
      const serviceUnit = String(record.serviceUnit ?? '').toLowerCase();
      const commanderName = String(record.commanderName ?? '').toLowerCase();
      const category = String(record.category ?? '').toLowerCase();
      return person.includes(searchValue) || office.includes(searchValue) || serviceUnit.includes(searchValue) || commanderName.includes(searchValue) || category.includes(searchValue);
    });
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Military record');
    const record = await this.militaryRecordModel.findOne({ id: numericId }).lean();
    if (!record) {
      throw new NotFoundException(`Military record ${numericId} not found`);
    }
    return this.mapRecord(record);
  }

  async update(id: number | string, dto: UpdateMilitaryRecordDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Military record');
    const existing = await this.militaryRecordModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Military record ${numericId} not found`);
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
    if (dto.office !== undefined) payload.office = dto.office;
    if (dto.district !== undefined) payload.district = dto.district ?? null;
    if (dto.enlistDate !== undefined) payload.enlistDate = new Date(dto.enlistDate);
    if (dto.assignmentDate !== undefined) payload.assignmentDate = dto.assignmentDate ?? null;
    if (dto.serviceUnit !== undefined) payload.serviceUnit = dto.serviceUnit ?? null;
    if (dto.serviceCity !== undefined) payload.serviceCity = dto.serviceCity ?? null;
    if (dto.commanderName !== undefined) payload.commanderName = dto.commanderName ?? null;
    if (dto.orderNumber !== undefined) payload.orderNumber = dto.orderNumber ?? null;
    if (dto.category !== undefined) payload.category = dto.category ?? null;
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.militaryStatus !== undefined) payload.militaryStatus = dto.militaryStatus;
    if (dto.defermentReason !== undefined) payload.defermentReason = dto.defermentReason ?? null;
    if (dto.defermentUntil !== undefined) payload.defermentUntil = dto.defermentUntil ? new Date(dto.defermentUntil) : null;
    if (dto.militaryOfficeNotified !== undefined) payload.militaryOfficeNotified = dto.militaryOfficeNotified;
    if (dto.notes !== undefined) payload.notes = dto.notes ?? null;

    const updated = await this.militaryRecordModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException(`Military record ${numericId} not found`);
    }
    return this.mapRecord(updated);
  }

  async reviewDeferment(id: number | string, dto: ReviewMilitaryDefermentDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Military record');
    const existing = await this.militaryRecordModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Military record ${numericId} not found`);
    }

    await this.usersService.findOne(dto.userId);

    const decision = dto.decision;
    const comment = dto.comment?.trim() || null;
    const baseNote = this.appendAutomationNote(
      existing.notes,
      `Решение военкомата по основанию отсрочки: ${decision}.${comment ? ` ${comment}` : ''}`,
    );

    const payload: Record<string, unknown> = {
      defermentReviewStatus: decision,
      defermentReviewComment: comment,
      defermentReviewedAt: new Date(),
      defermentReviewedByUserId: dto.userId,
      notes: baseNote,
    };

    if (decision === 'APPROVED') {
      if (existing.militaryStatus === 'FAMILY_CIRCUMSTANCES') {
        payload.status = 'REMOVED';
        payload.defermentReason = existing.defermentReason ?? FAMILY_EXEMPTION_REASON;
      } else {
        payload.status = 'REMOVED';
        payload.defermentReason = existing.defermentReason ?? 'Освобождение по состоянию здоровья подтверждено военкоматом';
      }
    }

    if (decision === 'REJECTED') {
      payload.status = 'ENLISTED';
      if (existing.militaryStatus === 'FAMILY_CIRCUMSTANCES' && existing.defermentReason === FAMILY_EXEMPTION_REASON) {
        payload.militaryStatus = 'CONSCRIPT';
        payload.defermentReason = null;
      }
    }

    if (decision === 'NEEDS_WORK') {
      payload.status = 'ENLISTED';
    }

    await this.militaryRecordModel.findOneAndUpdate(
      { id: numericId },
      payload,
      { new: true, runValidators: true },
    );

    return this.findOne(numericId);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Military record');
    const deleted = await this.militaryRecordModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`Military record ${numericId} not found`);
    }
  }

  async syncFamilyBenefitsForCitizen(citizenId: number | null | undefined): Promise<void> {
    if (!citizenId || !Number.isInteger(citizenId) || citizenId <= 0) {
      return;
    }

    const record = await this.militaryRecordModel.findOne({ peopleId: citizenId }).sort({ id: -1 }).lean();
    if (!record) {
      return;
    }

    const childrenCount = await this.countChildrenForFather(citizenId);
    const eligibleForFamilyExemption = childrenCount >= 2;
    const shouldAutoRelease =
      eligibleForFamilyExemption &&
      ['PRE_CONSCRIPT', 'CONSCRIPT', 'FAMILY_CIRCUMSTANCES'].includes(String(record.militaryStatus ?? ''));

    const shouldRollbackAutoRelease =
      !eligibleForFamilyExemption &&
      record.militaryStatus === 'FAMILY_CIRCUMSTANCES' &&
      record.defermentReason === FAMILY_EXEMPTION_REASON;

    if (!shouldAutoRelease && !shouldRollbackAutoRelease) {
      return;
    }

    const payload: Record<string, unknown> = shouldAutoRelease
      ? {
          status: 'REMOVED',
          militaryStatus: 'FAMILY_CIRCUMSTANCES',
          defermentReason: FAMILY_EXEMPTION_REASON,
          defermentUntil: null,
          notes: this.appendAutomationNote(record.notes, `Автообновление: детей ${childrenCount}.`),
        }
      : {
          status: 'ENLISTED',
          militaryStatus: 'CONSCRIPT',
          defermentReason: null,
          defermentUntil: null,
          notes: this.appendAutomationNote(record.notes, `Автопересчет: детей ${childrenCount}. Основание снято.`),
        };

    await this.militaryRecordModel.findOneAndUpdate(
      { id: record.id },
      payload,
      { new: true, runValidators: true },
    );
  }

  async ensureInitialRegistrationForBirth(params: {
    peopleId: number | null | undefined;
    gender: string | null | undefined;
    birthDate: string | null | undefined;
  }): Promise<boolean> {
    const peopleId =
      typeof params.peopleId === 'number' && Number.isInteger(params.peopleId) && params.peopleId > 0
        ? params.peopleId
        : null;
    if (!peopleId || String(params.gender ?? '').toUpperCase() !== 'MALE') {
      return false;
    }

    const existing = await this.militaryRecordModel.findOne({ peopleId }).lean();
    if (existing) {
      return true;
    }

    const automationUser = await this.findAutomationUser();
    if (!automationUser?.id) {
      return false;
    }

    const enlistDate =
      params.birthDate && !Number.isNaN(new Date(params.birthDate).getTime())
        ? params.birthDate
        : new Date().toISOString().split('T')[0];

    await this.create({
      peopleId,
      userId: automationUser.id as number,
      office: String(automationUser.organizationName ?? 'Военкомат'),
      district: null,
      enlistDate,
      assignmentDate: null,
      category: 'INITIAL',
      status: 'ENLISTED',
      militaryStatus: 'PRE_CONSCRIPT',
      defermentReason: null,
      defermentUntil: null,
      militaryOfficeNotified: true,
      notes: 'Автоматически поставлен на воинский учет при регистрации рождения.',
    });

    return true;
  }

  private async mapRecord(record: Record<string, any>): Promise<Record<string, unknown>> {
    const [citizen, user, reviewer] = await Promise.all([
      this.safeFindCitizen(record.peopleId),
      this.safeFindUser(record.userId),
      record.defermentReviewedByUserId ? this.safeFindUser(record.defermentReviewedByUserId) : Promise.resolve(null),
    ]);
    const childrenCount = await this.countChildrenForFather(record.peopleId);
    const eligibleForFamilyExemption = childrenCount >= 2;

    return {
      id: record.id,
      peopleId: record.peopleId,
      peopleFullName: citizen?.fullName ?? null,
      userId: record.userId,
      userName: user?.fullName ?? null,
      organizationId: record.organizationId ?? null,
      office: record.office,
      district: record.district ?? null,
      enlistDate: new Date(record.enlistDate).toISOString().split('T')[0],
      assignmentDate: record.assignmentDate ?? null,
      serviceUnit: record.serviceUnit ?? null,
      serviceCity: record.serviceCity ?? null,
      commanderName: record.commanderName ?? null,
      orderNumber: record.orderNumber ?? null,
      category: record.category ?? null,
      status: record.status,
      militaryStatus: record.militaryStatus,
      defermentReason: record.defermentReason ?? null,
      defermentUntil: record.defermentUntil ? new Date(record.defermentUntil).toISOString().split('T')[0] : null,
      militaryOfficeNotified: Boolean(record.militaryOfficeNotified),
      notes: record.notes ?? null,
      defermentReviewStatus: record.defermentReviewStatus ?? null,
      defermentReviewComment: record.defermentReviewComment ?? null,
      defermentReviewedAt: record.defermentReviewedAt ? new Date(record.defermentReviewedAt).toISOString().split('T')[0] : null,
      defermentReviewedByUserId: record.defermentReviewedByUserId ?? null,
      defermentReviewedByUserName: reviewer?.fullName ?? null,
      childrenCount,
      eligibleForFamilyExemption,
      familyExemptionReason: eligibleForFamilyExemption ? FAMILY_EXEMPTION_REASON : null,
    };
  }

  private async seedDefaults(): Promise<void> {
    for (const item of MILITARY_RECORD_SEED) {
      const existing = await this.militaryRecordModel.findOne({ peopleId: item.peopleId, office: item.office, enlistDate: new Date(item.enlistDate) }).lean();
      if (existing) continue;

      const citizen = await this.safeFindCitizen(item.peopleId);
      const user = await this.safeFindUserByUsername(item.username);
      if (!citizen || !user?.id) continue;

      const nextId = await this.countersService.getNextSequence('military_records');
      await this.militaryRecordModel.create({
        id: nextId,
        peopleId: item.peopleId,
        userId: user.id as number,
        organizationId: (user.organizationId as number | null) ?? null,
        office: item.office,
        district: item.district ?? null,
        enlistDate: new Date(item.enlistDate),
        assignmentDate: item.assignmentDate ?? null,
        serviceUnit: null,
        serviceCity: null,
        commanderName: null,
        orderNumber: null,
        category: item.category ?? null,
        status: item.status,
        militaryStatus: item.militaryStatus,
        defermentReason: item.defermentReason ?? null,
        defermentUntil: item.defermentUntil ? new Date(item.defermentUntil) : null,
        militaryOfficeNotified: item.militaryOfficeNotified,
        notes: item.notes ?? null,
        defermentReviewStatus: item.militaryStatus === 'FAMILY_CIRCUMSTANCES' ? 'APPROVED' : null,
        defermentReviewComment: null,
        defermentReviewedAt: null,
        defermentReviewedByUserId: null,
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

  private async findAutomationUser(): Promise<Record<string, unknown> | null> {
    const users = await this.usersService.findAll();
    return (
      users.find((user) => user.roleCode === 'admin') ??
      users.find((user) => user.username === 'admin') ??
      users[0] ??
      null
    );
  }

  private async countChildrenForFather(fatherCitizenId: number): Promise<number> {
    const families = await this.familyModel.find({ fatherCitizenId }).lean();
    const familyChildren = new Set<number>();

    for (const family of families) {
      for (const childCitizenId of family.childCitizenIds ?? []) {
        if (typeof childCitizenId === 'number' && Number.isInteger(childCitizenId) && childCitizenId > 0) {
          familyChildren.add(childCitizenId);
        }
      }
    }

    if (familyChildren.size > 0) {
      return familyChildren.size;
    }

    const birthActs = await this.zagsActModel
      .find({
        actType: 'BIRTH',
        'birthDetails.fatherCitizenId': fatherCitizenId,
      })
      .lean();

    const uniqueChildren = new Set<number | string>();
    for (const act of birthActs) {
      const childCitizenId = act.birthDetails?.childCitizenId;
      if (typeof childCitizenId === 'number' && Number.isInteger(childCitizenId) && childCitizenId > 0) {
        uniqueChildren.add(childCitizenId);
        continue;
      }

      const childKey = String(act.birthDetails?.childFullName ?? act.id ?? '').trim().toLowerCase();
      if (childKey) {
        uniqueChildren.add(childKey);
      }
    }

    return uniqueChildren.size;
  }

  private appendAutomationNote(currentNotes: string | null | undefined, message: string): string {
    const normalizedCurrent = (currentNotes ?? '').trim();
    if (!normalizedCurrent) {
      return message;
    }

    if (normalizedCurrent.includes(message)) {
      return normalizedCurrent;
    }

    return `${normalizedCurrent}\n${message}`;
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }
}

