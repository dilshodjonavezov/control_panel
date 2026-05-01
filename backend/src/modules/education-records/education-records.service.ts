import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CitizensService } from '../citizens/citizens.service';
import { CountersService } from '../counters/counters.service';
import { EducationInstitutionsService } from '../education-institutions/education-institutions.service';
import { MedicalRecordsService } from '../medical-records/medical-records.service';
import { MilitaryRecord, MilitaryRecordDocument } from '../military/schemas/military-record.schema';
import { SchoolService } from '../school/school.service';
import { UsersService } from '../users/users.service';
import { CreateEducationRecordDto } from './dto/create-education-record.dto';
import { ProcessEducationExpulsionDto } from './dto/process-education-expulsion.dto';
import { ReviewEducationDefermentDto } from './dto/review-education-deferment.dto';
import { UpdateEducationRecordDto } from './dto/update-education-record.dto';
import { EDUCATION_RECORD_SEED } from './education-records.seed';
import { EducationRecord, EducationRecordDocument } from './schemas/education-record.schema';

@Injectable()
export class EducationRecordsService implements OnModuleInit {
  constructor(
    @InjectModel(EducationRecord.name)
    private readonly educationRecordModel: Model<EducationRecordDocument>,
    @InjectModel(MilitaryRecord.name)
    private readonly militaryRecordModel: Model<MilitaryRecordDocument>,
    private readonly countersService: CountersService,
    private readonly citizensService: CitizensService,
    private readonly educationInstitutionsService: EducationInstitutionsService,
    private readonly schoolService: SchoolService,
    private readonly medicalRecordsService: MedicalRecordsService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.ENABLE_DOMAIN_SEEDS === 'true') {
      await this.seedDefaults();
    }
  }

  async create(dto: CreateEducationRecordDto): Promise<Record<string, unknown>> {
    await this.citizensService.findOne(dto.peopleId);
    await this.educationInstitutionsService.findOne(dto.institutionId);
    await this.usersService.findOne(dto.userId);
    const schoolRecord = await this.resolveSchoolRecord(dto.peopleId, dto.schoolRecordId ?? null);
    const medicalRecord = await this.resolveMedicalRecord(dto.peopleId, dto.medicalRecordId ?? null);

    const nextId = await this.countersService.getNextSequence('education_records');
    await this.educationRecordModel.create({
      id: nextId,
      peopleId: dto.peopleId,
      schoolRecordId: schoolRecord?.id ?? null,
      medicalRecordId: medicalRecord?.id ?? null,
      institutionId: dto.institutionId,
      studyForm: dto.studyForm,
      faculty: dto.faculty,
      specialty: dto.specialty,
      admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : null,
      expulsionDate: dto.expulsionDate ? new Date(dto.expulsionDate) : null,
      graduationDate: dto.graduationDate ? new Date(dto.graduationDate) : null,
      isDeferralActive: dto.isDeferralActive,
      defermentReviewStatus: dto.isDeferralActive ? 'APPROVED' : 'PENDING',
      defermentReviewComment: null,
      defermentReviewedAt: null,
      defermentReviewedByUserId: null,
      expulsionProcessStatus: dto.expulsionDate ? 'PENDING_CALL' : null,
      expulsionProcessComment: null,
      expulsionProcessedAt: null,
      expulsionProcessedByUserId: null,
      userId: dto.userId,
    });

    return this.findOne(nextId);
  }

  async findAll(filters: {
    search?: string;
    peopleId?: string;
    institutionId?: string;
    userId?: string;
  } = {}): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<EducationRecordDocument> = {};
    if (filters.peopleId) query.peopleId = Number(filters.peopleId);
    if (filters.institutionId) query.institutionId = Number(filters.institutionId);
    if (filters.userId) query.userId = Number(filters.userId);

    const records = await this.educationRecordModel.find(query).sort({ id: -1 }).lean();
    const mapped = await Promise.all(records.map((record) => this.mapRecord(record)));

    if (!filters.search?.trim()) {
      return mapped;
    }

    const searchValue = filters.search.trim().toLowerCase();
    return mapped.filter((record) => {
      const peopleFullName = String(record.peopleFullName ?? '').toLowerCase();
      const institutionName = String(record.institutionName ?? '').toLowerCase();
      const faculty = String(record.faculty ?? '').toLowerCase();
      const specialty = String(record.specialty ?? '').toLowerCase();
      return (
        peopleFullName.includes(searchValue) ||
        institutionName.includes(searchValue) ||
        faculty.includes(searchValue) ||
        specialty.includes(searchValue)
      );
    });
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Education record');
    const record = await this.educationRecordModel.findOne({ id: numericId }).lean();
    if (!record) {
      throw new NotFoundException(`Education record ${numericId} not found`);
    }
    return this.mapRecord(record);
  }

  async update(id: number | string, dto: UpdateEducationRecordDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Education record');
    const existing = await this.educationRecordModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Education record ${numericId} not found`);
    }

    const payload: Record<string, unknown> = {};
    if (dto.peopleId !== undefined) {
      await this.citizensService.findOne(dto.peopleId);
      payload.peopleId = dto.peopleId;
    }
    const nextPeopleId = dto.peopleId ?? existing.peopleId;
    if (dto.schoolRecordId !== undefined) {
      const schoolRecord = await this.resolveSchoolRecord(nextPeopleId, dto.schoolRecordId ?? null);
      payload.schoolRecordId = schoolRecord?.id ?? null;
    }
    if (dto.medicalRecordId !== undefined) {
      const medicalRecord = await this.resolveMedicalRecord(nextPeopleId, dto.medicalRecordId ?? null);
      payload.medicalRecordId = medicalRecord?.id ?? null;
    }
    if (dto.institutionId !== undefined) {
      await this.educationInstitutionsService.findOne(dto.institutionId);
      payload.institutionId = dto.institutionId;
    }
    if (dto.userId !== undefined) {
      await this.usersService.findOne(dto.userId);
      payload.userId = dto.userId;
    }
    if (dto.studyForm !== undefined) payload.studyForm = dto.studyForm;
    if (dto.faculty !== undefined) payload.faculty = dto.faculty;
    if (dto.specialty !== undefined) payload.specialty = dto.specialty;
    if (dto.admissionDate !== undefined) payload.admissionDate = dto.admissionDate ? new Date(dto.admissionDate) : null;
    if (dto.expulsionDate !== undefined) {
      payload.expulsionDate = dto.expulsionDate ? new Date(dto.expulsionDate) : null;
      payload.expulsionProcessStatus = dto.expulsionDate ? existing.expulsionProcessStatus ?? 'PENDING_CALL' : null;
    }
    if (dto.graduationDate !== undefined) payload.graduationDate = dto.graduationDate ? new Date(dto.graduationDate) : null;
    if (dto.isDeferralActive !== undefined) payload.isDeferralActive = dto.isDeferralActive;

    const updated = await this.educationRecordModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException(`Education record ${numericId} not found`);
    }
    return this.mapRecord(updated);
  }

  async reviewDeferment(id: number | string, dto: ReviewEducationDefermentDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Education record');
    const existing = await this.educationRecordModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Education record ${numericId} not found`);
    }

    await this.usersService.findOne(dto.userId);

    const isApproved = dto.decision === 'APPROVED';
    const nextReviewStatus = dto.decision;
    const nextReviewComment = dto.comment?.trim() || null;
    const nextReviewDate = new Date();

    await this.educationRecordModel.findOneAndUpdate(
      { id: numericId },
      {
        isDeferralActive: isApproved,
        defermentReviewStatus: nextReviewStatus,
        defermentReviewComment: nextReviewComment,
        defermentReviewedAt: nextReviewDate,
        defermentReviewedByUserId: dto.userId,
      },
      { new: true, runValidators: true },
    );

    await this.syncMilitaryRecordWithEducationDecision(existing.peopleId, dto.decision, nextReviewComment, existing.graduationDate, existing.expulsionDate);

    return this.findOne(numericId);
  }

  async processExpulsion(id: number | string, dto: ProcessEducationExpulsionDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Education record');
    const existing = await this.educationRecordModel.findOne({ id: numericId }).lean();
    if (!existing) {
      throw new NotFoundException(`Education record ${numericId} not found`);
    }
    if (!existing.expulsionDate) {
      throw new NotFoundException(`Education record ${numericId} has no expulsion date`);
    }

    await this.usersService.findOne(dto.userId);

    const processComment = dto.comment?.trim() || null;
    const nextProcessDate = new Date();

    await this.educationRecordModel.findOneAndUpdate(
      { id: numericId },
      {
        isDeferralActive: false,
        defermentReviewStatus: existing.defermentReviewStatus ?? 'APPROVED',
        expulsionProcessStatus: dto.decision,
        expulsionProcessComment: processComment,
        expulsionProcessedAt: nextProcessDate,
        expulsionProcessedByUserId: dto.userId,
      },
      { new: true, runValidators: true },
    );

    await this.syncMilitaryRecordWithExpulsion(existing.peopleId, dto.decision, processComment);

    return this.findOne(numericId);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Education record');
    const deleted = await this.educationRecordModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`Education record ${numericId} not found`);
    }
  }

  private async mapRecord(record: Record<string, any>): Promise<Record<string, unknown>> {
    const [citizen, institution, user, defermentReviewer, expulsionReviewer] = await Promise.all([
      this.safeFindCitizen(record.peopleId),
      this.safeFindInstitution(record.institutionId),
      this.safeFindUser(record.userId),
      record.defermentReviewedByUserId ? this.safeFindUser(record.defermentReviewedByUserId) : Promise.resolve(null),
      record.expulsionProcessedByUserId ? this.safeFindUser(record.expulsionProcessedByUserId) : Promise.resolve(null),
    ]);

    return {
      id: record.id,
      citizenId: record.peopleId,
      peopleId: record.peopleId,
      peopleFullName: citizen?.fullName ?? null,
      schoolRecordId: record.schoolRecordId ?? null,
      schoolGraduationDate: await this.resolveSchoolGraduationDate(record.peopleId, record.schoolRecordId ?? null),
      medicalRecordId: record.medicalRecordId ?? null,
      medicalDecision: await this.resolveMedicalDecision(record.peopleId, record.medicalRecordId ?? null),
      institutionId: record.institutionId,
      institutionName: institution?.name ?? null,
      studyForm: record.studyForm ?? null,
      faculty: record.faculty ?? null,
      specialty: record.specialty ?? null,
      admissionDate: record.admissionDate ? new Date(record.admissionDate).toISOString().split('T')[0] : null,
      expulsionDate: record.expulsionDate ? new Date(record.expulsionDate).toISOString().split('T')[0] : null,
      graduationDate: record.graduationDate ? new Date(record.graduationDate).toISOString().split('T')[0] : null,
      isDeferralActive: Boolean(record.isDeferralActive),
      defermentReviewStatus: record.defermentReviewStatus ?? null,
      defermentReviewComment: record.defermentReviewComment ?? null,
      defermentReviewedAt: record.defermentReviewedAt ? new Date(record.defermentReviewedAt).toISOString().split('T')[0] : null,
      defermentReviewedByUserId: record.defermentReviewedByUserId ?? null,
      defermentReviewedByUserName: defermentReviewer?.fullName ?? null,
      expulsionProcessStatus: record.expulsionProcessStatus ?? null,
      expulsionProcessComment: record.expulsionProcessComment ?? null,
      expulsionProcessedAt: record.expulsionProcessedAt ? new Date(record.expulsionProcessedAt).toISOString().split('T')[0] : null,
      expulsionProcessedByUserId: record.expulsionProcessedByUserId ?? null,
      expulsionProcessedByUserName: expulsionReviewer?.fullName ?? null,
      userId: record.userId,
      userName: user?.fullName ?? null,
    };
  }

  private async seedDefaults(): Promise<void> {
    for (const item of EDUCATION_RECORD_SEED) {
      const existing = await this.educationRecordModel
        .findOne({
          peopleId: item.peopleId,
          institutionId: item.institutionId,
          specialty: item.specialty,
        })
        .lean();
      if (existing) {
        continue;
      }

      const [citizen, institution] = await Promise.all([
        this.safeFindCitizen(item.peopleId),
        this.safeFindInstitution(item.institutionId),
      ]);
      const user = await this.safeFindUserByUsername(item.username);
      if (!citizen || !institution || !user?.id) {
        continue;
      }

      const nextId = await this.countersService.getNextSequence('education_records');
      await this.educationRecordModel.create({
        id: nextId,
        peopleId: item.peopleId,
        institutionId: item.institutionId,
        studyForm: item.studyForm,
        faculty: item.faculty,
        specialty: item.specialty,
        admissionDate: item.admissionDate ? new Date(item.admissionDate) : null,
        expulsionDate: item.expulsionDate ? new Date(item.expulsionDate) : null,
        graduationDate: item.graduationDate ? new Date(item.graduationDate) : null,
        isDeferralActive: item.isDeferralActive,
        defermentReviewStatus: item.isDeferralActive ? 'APPROVED' : 'PENDING',
        defermentReviewComment: null,
        defermentReviewedAt: null,
        defermentReviewedByUserId: null,
        expulsionProcessStatus: item.expulsionDate ? 'PENDING_CALL' : null,
        expulsionProcessComment: null,
        expulsionProcessedAt: null,
        expulsionProcessedByUserId: null,
        userId: user.id as number,
      });
    }
  }

  private async syncMilitaryRecordWithEducationDecision(
    peopleId: number,
    decision: string,
    comment: string | null,
    graduationDate: Date | null,
    expulsionDate: Date | null,
  ): Promise<void> {
    const record = await this.militaryRecordModel.findOne({ peopleId }).sort({ id: -1 }).lean();
    if (!record) {
      return;
    }

    const isApproved = decision === 'APPROVED';
    const note = this.appendNote(
      record.notes,
      isApproved
        ? `Военкомат подтвердил учебную отсрочку.${comment ? ` ${comment}` : ''}`
        : `Военкомат отклонил учебную отсрочку (${decision}).${comment ? ` ${comment}` : ''}`,
    );

    await this.militaryRecordModel.findOneAndUpdate(
      { id: record.id },
      {
        status: isApproved ? 'DEFERRED' : 'ENLISTED',
        defermentReason: isApproved ? 'Учебная отсрочка подтверждена военкоматом' : null,
        defermentUntil: isApproved ? (graduationDate ?? expulsionDate ?? null) : null,
        notes: note,
      },
      { new: true, runValidators: true },
    );
  }

  private async syncMilitaryRecordWithExpulsion(
    peopleId: number,
    decision: string,
    comment: string | null,
  ): Promise<void> {
    const record = await this.militaryRecordModel.findOne({ peopleId }).sort({ id: -1 }).lean();
    if (!record) {
      return;
    }

    const note = this.appendNote(
      record.notes,
      decision === 'DEFERMENT_REMOVED'
        ? `После отчисления учебная отсрочка снята.${comment ? ` ${comment}` : ''}`
        : `По уведомлению об отчислении отмечена ошибка данных.${comment ? ` ${comment}` : ''}`,
    );

    await this.militaryRecordModel.findOneAndUpdate(
      { id: record.id },
      decision === 'DEFERMENT_REMOVED'
        ? {
            status: 'ENLISTED',
            defermentReason: null,
            defermentUntil: null,
            notes: note,
          }
        : {
            notes: note,
          },
      { new: true, runValidators: true },
    );
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

  private async safeFindUserByUsername(username: string): Promise<Record<string, unknown> | null> {
    const users = await this.usersService.findAll();
    return users.find((user) => user.username === username) ?? null;
  }

  private async resolveSchoolRecord(peopleId: number, schoolRecordId: number | null): Promise<Record<string, any> | null> {
    if (schoolRecordId) {
      const schoolRecord = await this.schoolService.findOne(schoolRecordId);
      if (Number(schoolRecord.peopleId) !== peopleId) {
        throw new NotFoundException(`School record ${schoolRecordId} does not belong to person ${peopleId}`);
      }
      if (!schoolRecord.graduationDate) {
        throw new NotFoundException(`School record ${schoolRecordId} is not graduated`);
      }
      return schoolRecord;
    }

    const schoolRecords = await this.schoolService.findAll({ peopleId: peopleId.toString() });
    return schoolRecords.find((record) => Boolean(record.graduationDate)) ?? null;
  }

  private async resolveMedicalRecord(peopleId: number, medicalRecordId: number | null): Promise<Record<string, any> | null> {
    if (medicalRecordId) {
      const medicalRecord = await this.medicalRecordsService.findOne(medicalRecordId);
      if (Number(medicalRecord.peopleId) !== peopleId) {
        throw new NotFoundException(`Medical record ${medicalRecordId} does not belong to person ${peopleId}`);
      }
      if (String(medicalRecord.decision ?? '').toUpperCase() !== 'FIT') {
        throw new NotFoundException(`Medical record ${medicalRecordId} is not fit`);
      }
      return medicalRecord;
    }

    const medicalRecords = await this.medicalRecordsService.findAll({ peopleId: peopleId.toString() });
    return medicalRecords.find((record) => String(record.decision ?? '').toUpperCase() === 'FIT') ?? null;
  }

  private async resolveSchoolGraduationDate(peopleId: number, schoolRecordId: number | null): Promise<string | null> {
    const schoolRecord = await this.resolveSchoolRecord(peopleId, schoolRecordId);
    return schoolRecord?.graduationDate ? new Date(schoolRecord.graduationDate).toISOString().split('T')[0] : null;
  }

  private async resolveMedicalDecision(peopleId: number, medicalRecordId: number | null): Promise<string | null> {
    const medicalRecord = await this.resolveMedicalRecord(peopleId, medicalRecordId);
    return medicalRecord?.decision ?? null;
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }

  private appendNote(current: string | null | undefined, next: string): string {
    const normalizedCurrent = (current ?? '').trim();
    if (!normalizedCurrent) {
      return next;
    }

    if (normalizedCurrent.includes(next)) {
      return normalizedCurrent;
    }

    return `${normalizedCurrent}\n${next}`;
  }
}

