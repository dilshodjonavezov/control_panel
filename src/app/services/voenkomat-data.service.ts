import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  value?: T;
}

interface ApiCitizen {
  id: number;
  fullName: string;
  birthDate: string;
  gender: string;
  citizenship: string;
  lifeStatus: string;
  motherFullName: string | null;
  motherCitizenId?: number | null;
  fatherFullName: string | null;
  fatherCitizenId?: number | null;
  familyId?: number | null;
  militaryRegisteredAtBirth?: boolean;
}

interface ApiFamilyChild {
  id: number;
  fullName: string | null;
  gender: string | null;
  birthDate: string | null;
  familyId: number | null;
  militaryRegisteredAtBirth: boolean;
}

interface ApiFamily {
  id: number;
  familyName: string;
  primaryCitizenId: number;
  primaryCitizenFullName: string | null;
  fatherCitizenId?: number | null;
  fatherFullName?: string | null;
  motherCitizenId?: number | null;
  motherFullName?: string | null;
  memberCitizenIds: number[];
  memberCount: number;
  childCitizenIds?: number[];
  childrenCount?: number;
  sonsCount?: number;
  daughtersCount?: number;
  militaryRegisteredChildCitizenIds?: number[];
  militaryRegisteredChildrenCount?: number;
  children?: ApiFamilyChild[];
  eligibleFatherForMilitaryExemption?: boolean;
  addressId: number | null;
  addressLabel: string | null;
  status: string;
  notes: string | null;
  createdAt: string | null;
}

interface ApiAddress {
  id: number;
  citizenId: number;
  familyId: number | null;
  fullAddress: string;
  isActive: boolean;
  startDate: string;
}

interface ApiEducationRecord {
  id: number;
  peopleId: number;
  peopleFullName: string | null;
  institutionName: string | null;
  studyForm: string | null;
  faculty: string | null;
  specialty: string | null;
  admissionDate: string | null;
  expulsionDate: string | null;
  graduationDate: string | null;
  isDeferralActive: boolean;
  defermentReviewStatus?: string | null;
  defermentReviewComment?: string | null;
  defermentReviewedAt?: string | null;
  expulsionProcessStatus?: string | null;
  expulsionProcessComment?: string | null;
}

interface ApiSchoolRecord {
  id: number;
  peopleId: number;
  peopleFullName: string | null;
  institutionName: string | null;
  classNumber: number | null;
  admissionDate: string | null;
  graduationDate: string | null;
  expulsionDate: string | null;
  isStudying: boolean;
}

interface ApiMedicalRecord {
  id: number;
  peopleId: number;
  clinic: string;
  decision: string | null;
  reason: string | null;
  defermentReason: string | null;
  createdAtRecord: string | null;
  notes: string | null;
}

interface ApiPassportRecord {
  id: number;
  peopleId: number;
  passportNumber: string | null;
  dateOfIssue: string | null;
  expireDate: string | null;
  placeOfIssue: string | null;
}

interface ApiBorderCrossing {
  id: number;
  peopleId: number;
  departureDate: string;
  returnDate: string | null;
  outsideBorder: boolean;
  country: string | null;
  description: string | null;
}

interface ApiMilitaryRecord {
  id: number;
  peopleId: number;
  peopleFullName: string | null;
  office: string;
  district: string | null;
  enlistDate: string;
  assignmentDate: string | null;
  category: string | null;
  status: string;
  militaryStatus: string;
  defermentReason: string | null;
  defermentUntil: string | null;
  militaryOfficeNotified: boolean;
  notes: string | null;
  childrenCount: number;
  eligibleForFamilyExemption: boolean;
  familyExemptionReason: string | null;
  defermentReviewStatus?: string | null;
  defermentReviewComment?: string | null;
  defermentReviewedAt?: string | null;
}

interface ApiVvkResult {
  id: number;
  peopleId: number;
  peopleFullName: string | null;
  examDate: string | null;
  category: string | null;
  queueStatus: string | null;
  fitnessCategory: string | null;
  finalDecision: string | null;
  reason: string | null;
  notes: string | null;
  nextReviewDate: string | null;
}

interface ApiZagsBirthRecord {
  id: number;
  peopleId: number;
  peopleFullName: string | null;
  actNumber: string | null;
  registrationDate: string | null;
  fatherFullName: string | null;
  motherFullName: string | null;
  status: string | null;
}

type Snapshot = {
  citizens: ApiCitizen[];
  families: ApiFamily[];
  addresses: ApiAddress[];
  educationRecords: ApiEducationRecord[];
  schoolRecords: ApiSchoolRecord[];
  medicalRecords: ApiMedicalRecord[];
  passportRecords: ApiPassportRecord[];
  borderCrossings: ApiBorderCrossing[];
  militaryRecords: ApiMilitaryRecord[];
  vvkResults: ApiVvkResult[];
  zagsBirthRecords: ApiZagsBirthRecord[];
};

export interface VoenkomatCitizenRow {
  id: number;
  fullName: string;
  birthDate: string;
  age: number;
  gender: string;
  voenkomatSection: string;
  registrationAddress: string;
  militaryStatus: string;
  militaryRecordStatus: string;
  fitnessCategory: string;
  studyPlace: string;
  defermentBasis: string;
  childrenCount: number;
  familySummary: string;
  borderState: string;
  borderCountry: string;
  passportNumber: string;
  lifeStatus: string;
}

export interface VoenkomatDashboardData {
  totalCitizens: number;
  totalConscriptMen: number;
  totalCompletedService: number;
  totalOtherMen: number;
  activeMilitaryRecords: number;
  familyExemptions: number;
  activeEducationDeferments: number;
  abroadNow: number;
  missingPassport: number;
  missingAddress: number;
  pendingMedical: number;
  statusDistribution: Array<{ label: string; count: number; tone: string }>;
  quickFilters: Array<{ id: string; label: string; count: number; hint: string }>;
  linkageItems: Array<{ label: string; value: string; hint: string }>;
}

export interface VoenkomatCitizenDetail {
  citizen: VoenkomatCitizenRow;
  family: ApiFamily | null;
  address: ApiAddress | null;
  educationRecords: ApiEducationRecord[];
  schoolRecords: ApiSchoolRecord[];
  medicalRecords: ApiMedicalRecord[];
  borderCrossings: ApiBorderCrossing[];
  militaryRecords: ApiMilitaryRecord[];
  vvkResults: ApiVvkResult[];
  passportRecord: ApiPassportRecord | null;
  zagsBirthRecord: ApiZagsBirthRecord | null;
}

export interface VoenkomatEducationRow {
  id: string;
  citizenId: number;
  fullName: string;
  documentId: string;
  status: string;
  institution: string;
  form: string;
  startDate: string;
  endDate: string;
  defermentActive: boolean;
  militaryStatus: string;
}

export interface VoenkomatDefermentRow {
  id: string;
  sourceId: number;
  sourceType: 'education' | 'military';
  basisCode: 'study' | 'family' | 'health';
  citizenId: number;
  fullName: string;
  basis: string;
  institution: string;
  document: string;
  submittedAt: string;
  status: string;
  notes: string;
}

export interface VoenkomatExpulsionRow {
  id: string;
  sourceId: number;
  citizenId: number;
  fullName: string;
  institution: string;
  orderNumber: string;
  date: string;
  status: string;
}

export interface ReviewVoenkomatDecisionPayload {
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_WORK';
  userId: number;
  comment?: string | null;
}

export interface ProcessVoenkomatExpulsionPayload {
  decision: 'DEFERMENT_REMOVED' | 'DATA_ERROR';
  userId: number;
  comment?: string | null;
}

@Injectable({ providedIn: 'root' })
export class VoenkomatDataService {
  private readonly apiBaseUrl = `${environment.apiBaseUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  getDashboardData(): Observable<VoenkomatDashboardData> {
    return this.getSnapshot().pipe(map((snapshot) => this.buildDashboardData(snapshot)));
  }

  getCitizens(): Observable<VoenkomatCitizenRow[]> {
    return this.getSnapshot().pipe(map((snapshot) => this.buildCitizenRows(snapshot)));
  }

  getCitizenDetail(id: number): Observable<VoenkomatCitizenDetail | null> {
    return this.getSnapshot().pipe(map((snapshot) => this.buildCitizenDetail(snapshot, id)));
  }

  getEducationRegistry(): Observable<VoenkomatEducationRow[]> {
    return this.getSnapshot().pipe(map((snapshot) => this.buildEducationRows(snapshot)));
  }

  getDefermentReview(): Observable<VoenkomatDefermentRow[]> {
    return this.getSnapshot().pipe(map((snapshot) => this.buildDefermentRows(snapshot)));
  }

  getExpulsions(): Observable<VoenkomatExpulsionRow[]> {
    return this.getSnapshot().pipe(map((snapshot) => this.buildExpulsionRows(snapshot)));
  }

  reviewEducationDeferment(id: number, payload: ReviewVoenkomatDecisionPayload): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/education-records/${id}/review-deferment`, payload);
  }

  reviewMilitaryDeferment(id: number, payload: ReviewVoenkomatDecisionPayload): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/military-records/${id}/review-deferment`, payload);
  }

  processEducationExpulsion(id: number, payload: ProcessVoenkomatExpulsionPayload): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/education-records/${id}/process-expulsion`, payload);
  }

  private getSnapshot(): Observable<Snapshot> {
    return forkJoin({
      citizens: this.getArray<ApiCitizen>('citizens'),
      families: this.getArray<ApiFamily>('families'),
      addresses: this.getArray<ApiAddress>('addresses'),
      educationRecords: this.getArray<ApiEducationRecord>('education-records'),
      schoolRecords: this.getArray<ApiSchoolRecord>('school-records'),
      medicalRecords: this.getArray<ApiMedicalRecord>('medical-records'),
      passportRecords: this.getArray<ApiPassportRecord>('passport-records'),
      borderCrossings: this.getArray<ApiBorderCrossing>('border-crossings'),
      militaryRecords: this.getArray<ApiMilitaryRecord>('military-records'),
      vvkResults: this.getArray<ApiVvkResult>('vvk-results'),
      zagsBirthRecords: this.getArray<ApiZagsBirthRecord>('zags-birth-records'),
    });
  }

  private getArray<T>(path: string): Observable<T[]> {
    return this.http
      .get<ApiResponse<T[]> | T[]>(`${this.apiBaseUrl}/${path}`)
      .pipe(map((response) => this.unwrapArray(response)));
  }

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.value)) {
      return response.value;
    }

    return [];
  }

  private buildDashboardData(snapshot: Snapshot): VoenkomatDashboardData {
    const rows = this.buildCitizenRows(snapshot);
    const activeMilitaryRecords = snapshot.militaryRecords.filter((item) => item.status !== 'REMOVED').length;
    const familyExemptions = snapshot.militaryRecords.filter((item) => item.militaryStatus === 'FAMILY_CIRCUMSTANCES').length;
    const activeEducationDeferments = snapshot.educationRecords.filter((item) => item.isDeferralActive).length;
    const totalConscriptMen = rows.filter((item) => item.voenkomatSection === 'Призывники').length;
    const totalCompletedService = rows.filter((item) => item.voenkomatSection === 'В запасе').length;
    const totalOtherMen = rows.filter((item) => item.voenkomatSection === 'Остальные мужчины').length;
    const abroadNow = rows.filter((item) => item.borderState === 'За границей').length;
    const missingPassport = rows.filter((item) => item.passportNumber === 'Нет паспорта').length;
    const missingAddress = rows.filter((item) => item.registrationAddress === 'Адрес не указан').length;
    const pendingMedical = rows.filter((item) => item.fitnessCategory === 'Нет решения ВВК').length;

    return {
      totalCitizens: rows.length,
      totalConscriptMen,
      totalCompletedService,
      totalOtherMen,
      activeMilitaryRecords,
      familyExemptions,
      activeEducationDeferments,
      abroadNow,
      missingPassport,
      missingAddress,
      pendingMedical,
      statusDistribution: [
        { label: 'Призывники', count: totalConscriptMen, tone: 'bg-blue-100 text-blue-800' },
        { label: '2+ детей', count: rows.filter((item) => item.voenkomatSection === 'Освобождение по семье').length, tone: 'bg-amber-100 text-amber-800' },
        { label: 'Учатся', count: rows.filter((item) => item.voenkomatSection === 'Учебная отсрочка').length, tone: 'bg-emerald-100 text-emerald-800' },
        { label: 'Не годен', count: rows.filter((item) => item.voenkomatSection === 'Не годен').length, tone: 'bg-rose-100 text-rose-800' },
        { label: 'В запасе', count: totalCompletedService, tone: 'bg-indigo-100 text-indigo-800' },
        { label: 'Остальные мужчины', count: totalOtherMen, tone: 'bg-slate-100 text-slate-800' },
      ],
      quickFilters: [
        { id: 'conscripts', label: 'Призывники 18-27', count: totalConscriptMen, hint: 'Только мужчины призывного возраста' },
        { id: 'family', label: 'Льгота по семье', count: familyExemptions, hint: 'Мужчины с 2 и более детьми' },
        { id: 'study', label: 'Учатся', count: activeEducationDeferments, hint: 'Есть активные учебные основания' },
        { id: 'abroad', label: 'За границей', count: abroadNow, hint: 'Есть открытые записи о выезде' },
        { id: 'completed-service', label: 'В запасе', count: totalCompletedService, hint: 'Уже отслужили и выведены в отдельный раздел' },
        { id: 'other-men', label: 'Остальные мужчины', count: totalOtherMen, hint: 'Мужчины вне призывной группы и льгот' },
      ],
      linkageItems: [
        { label: 'Семьи', value: `${snapshot.families.length}`, hint: 'Связки отец, мать и дети собраны' },
        { label: 'Рождения из ЗАГС', value: `${snapshot.zagsBirthRecords.length}`, hint: 'По ним видны авто-связки семьи и учета' },
        { label: 'Адреса', value: `${snapshot.addresses.length}`, hint: 'Можно увидеть, у кого нет регистрации' },
        { label: 'ВВК решения', value: `${snapshot.vvkResults.length}`, hint: 'Показывают, где еще не закрыта медсвязка' },
      ],
    };
  }

  private buildCitizenRows(snapshot: Snapshot): VoenkomatCitizenRow[] {
    return snapshot.citizens
      .map((citizen) => {
        const family = this.findFamily(snapshot.families, citizen);
        const address = this.findAddress(snapshot.addresses, citizen, family);
        const education = this.getLatestByDate(snapshot.educationRecords.filter((item) => item.peopleId === citizen.id), (item) => item.admissionDate);
        const school = this.getLatestByDate(snapshot.schoolRecords.filter((item) => item.peopleId === citizen.id), (item) => item.admissionDate);
        const medical = this.getLatestByDate(snapshot.medicalRecords.filter((item) => item.peopleId === citizen.id), (item) => item.createdAtRecord);
        const military = this.getLatestByDate(snapshot.militaryRecords.filter((item) => item.peopleId === citizen.id), (item) => item.enlistDate);
        const vvk = this.getLatestByDate(snapshot.vvkResults.filter((item) => item.peopleId === citizen.id), (item) => item.examDate);
        const border = this.getLatestByDate(snapshot.borderCrossings.filter((item) => item.peopleId === citizen.id), (item) => item.departureDate);
        const passport = snapshot.passportRecords.find((item) => item.peopleId === citizen.id) ?? null;

        return {
          id: citizen.id,
          fullName: citizen.fullName,
          birthDate: citizen.birthDate,
          age: this.getAge(citizen.birthDate),
          gender: this.getGenderLabel(citizen.gender),
          voenkomatSection: '',
          registrationAddress: address?.fullAddress ?? 'Адрес не указан',
          militaryStatus: this.getMilitaryStatusLabel(military, education, vvk, border),
          militaryRecordStatus: military?.status ?? 'Нет записи',
          fitnessCategory: this.getFitnessLabel(vvk, medical),
          studyPlace: education?.institutionName ?? school?.institutionName ?? 'Нет учебной связки',
          defermentBasis: this.getDefermentBasis(military, education, family),
          childrenCount: military?.childrenCount ?? family?.childrenCount ?? 0,
          familySummary: family ? `${family.fatherFullName ?? '—'} / ${family.motherFullName ?? '—'}` : 'Семья не связана',
          borderState: border?.outsideBorder && !border.returnDate ? 'За границей' : 'В стране',
          borderCountry: border?.country ?? '—',
          passportNumber: passport?.passportNumber ?? 'Нет паспорта',
          lifeStatus: citizen.lifeStatus,
        } as VoenkomatCitizenRow;
      })
      .map((row) => ({
        ...row,
        voenkomatSection: this.getVoenkomatSection(row),
      }))
      .sort((left, right) => right.age - left.age || left.fullName.localeCompare(right.fullName, 'ru'));
  }

  private buildCitizenDetail(snapshot: Snapshot, id: number): VoenkomatCitizenDetail | null {
    const row = this.buildCitizenRows(snapshot).find((item) => item.id === id);
    const citizen = snapshot.citizens.find((item) => item.id === id);
    if (!row || !citizen) {
      return null;
    }

    const family = this.findFamily(snapshot.families, citizen);

    return {
      citizen: row,
      family,
      address: this.findAddress(snapshot.addresses, citizen, family),
      educationRecords: snapshot.educationRecords.filter((item) => item.peopleId === id),
      schoolRecords: snapshot.schoolRecords.filter((item) => item.peopleId === id),
      medicalRecords: snapshot.medicalRecords.filter((item) => item.peopleId === id),
      borderCrossings: snapshot.borderCrossings.filter((item) => item.peopleId === id),
      militaryRecords: snapshot.militaryRecords.filter((item) => item.peopleId === id),
      vvkResults: snapshot.vvkResults.filter((item) => item.peopleId === id),
      passportRecord: snapshot.passportRecords.find((item) => item.peopleId === id) ?? null,
      zagsBirthRecord: snapshot.zagsBirthRecords.find((item) => item.peopleId === id) ?? null,
    };
  }

  private buildEducationRows(snapshot: Snapshot): VoenkomatEducationRow[] {
    const citizenRows = new Map(this.buildCitizenRows(snapshot).map((item) => [item.id, item]));
    const schoolRows = snapshot.schoolRecords.map((item) => ({
      id: `school-${item.id}`,
      citizenId: item.peopleId,
      fullName: item.peopleFullName ?? `ID ${item.peopleId}`,
      documentId: this.findPassportNumber(snapshot.passportRecords, item.peopleId),
      status: item.expulsionDate ? 'Отчислен' : item.isStudying ? 'Школьник' : 'Выпускник',
      institution: item.institutionName ?? 'Школа не указана',
      form: 'Очная',
      startDate: item.admissionDate ?? '-',
      endDate: item.expulsionDate ?? item.graduationDate ?? '-',
      defermentActive: false,
      militaryStatus: citizenRows.get(item.peopleId)?.militaryStatus ?? 'Нет статуса',
    }));

    const educationRows = snapshot.educationRecords.map((item) => ({
      id: `education-${item.id}`,
      citizenId: item.peopleId,
      fullName: item.peopleFullName ?? `ID ${item.peopleId}`,
      documentId: this.findPassportNumber(snapshot.passportRecords, item.peopleId),
      status: item.expulsionDate ? 'Отчислен' : item.graduationDate ? 'Выпускник' : 'Студент',
      institution: item.institutionName ?? 'Учреждение не указано',
      form: item.studyForm ?? 'Не указана',
      startDate: item.admissionDate ?? '-',
      endDate: item.expulsionDate ?? item.graduationDate ?? '-',
      defermentActive: item.isDeferralActive,
      militaryStatus: citizenRows.get(item.peopleId)?.militaryStatus ?? 'Нет статуса',
    }));

    return [...schoolRows, ...educationRows].sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru'));
  }

  private buildDefermentRows(snapshot: Snapshot): VoenkomatDefermentRow[] {
    const rows: VoenkomatDefermentRow[] = [];

    snapshot.educationRecords
      .filter((item) => item.isDeferralActive || !!item.defermentReviewStatus)
      .forEach((item) => {
        rows.push({
          id: `edu-${item.id}`,
          sourceId: item.id,
          sourceType: 'education',
          basisCode: 'study',
          citizenId: item.peopleId,
          fullName: item.peopleFullName ?? `ID ${item.peopleId}`,
          basis: 'Учеба',
          institution: item.institutionName ?? 'Учреждение не указано',
          document: item.studyForm ?? 'Учебная запись',
          submittedAt: item.admissionDate ?? '-',
          status: this.getReviewStatusLabel(item.defermentReviewStatus, item.isDeferralActive),
          notes: `${item.faculty ?? 'Без факультета'} / ${item.specialty ?? 'Без специальности'}`,
        });
      });

    snapshot.militaryRecords
      .filter((item) => item.militaryStatus === 'FAMILY_CIRCUMSTANCES')
      .forEach((item) => {
        rows.push({
          id: `family-${item.id}`,
          sourceId: item.id,
          sourceType: 'military',
          basisCode: 'family',
          citizenId: item.peopleId,
          fullName: item.peopleFullName ?? `ID ${item.peopleId}`,
          basis: 'Семья',
          institution: 'Семейный реестр',
          document: item.familyExemptionReason ?? 'Семейное основание',
          submittedAt: item.enlistDate ?? '-',
          status: this.getReviewStatusLabel(item.defermentReviewStatus, true),
          notes: `Детей: ${item.childrenCount}`,
        });
      });

    snapshot.vvkResults
      .filter((item) => item.finalDecision === 'UNFIT' || item.fitnessCategory === 'TEMP_UNFIT')
      .forEach((item) => {
        const militaryRecord = this.getLatestByDate(
          snapshot.militaryRecords.filter((record) => record.peopleId === item.peopleId),
          (record) => record.enlistDate,
        );
        if (!militaryRecord) {
          return;
        }

        rows.push({
          id: `health-${militaryRecord.id}`,
          sourceId: militaryRecord.id,
          sourceType: 'military',
          basisCode: 'health',
          citizenId: item.peopleId,
          fullName: item.peopleFullName ?? `ID ${item.peopleId}`,
          basis: 'Здоровье',
          institution: 'ВВК',
          document: item.category ?? item.fitnessCategory ?? 'Медицинское решение',
          submittedAt: item.examDate ?? '-',
          status: this.getReviewStatusLabel(militaryRecord.defermentReviewStatus, item.finalDecision === 'UNFIT'),
          notes: item.reason ?? item.notes ?? 'Без комментария',
        });
      });

    return rows.sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru'));
  }

  private buildExpulsionRows(snapshot: Snapshot): VoenkomatExpulsionRow[] {
    return snapshot.educationRecords
      .filter((item) => !!item.expulsionDate)
      .map((item) => ({
        id: `exp-${item.id}`,
        sourceId: item.id,
        citizenId: item.peopleId,
        fullName: item.peopleFullName ?? `ID ${item.peopleId}`,
        institution: item.institutionName ?? 'Учреждение не указано',
        orderNumber: item.specialty ?? 'Приказ об отчислении',
        date: item.expulsionDate ?? '-',
        status: this.getExpulsionStatusLabel(item.expulsionProcessStatus),
      }))
      .sort((left, right) => (right.date || '').localeCompare(left.date || ''));
  }

  private findFamily(families: ApiFamily[], citizen: ApiCitizen): ApiFamily | null {
    return (
      families.find((item) => item.id === citizen.familyId) ??
      families.find((item) => item.memberCitizenIds.includes(citizen.id) || item.childCitizenIds?.includes(citizen.id)) ??
      null
    );
  }

  private findAddress(addresses: ApiAddress[], citizen: ApiCitizen, family: ApiFamily | null): ApiAddress | null {
    return (
      addresses.find((item) => item.citizenId === citizen.id && item.isActive) ??
      addresses.find((item) => family?.id && item.familyId === family.id && item.isActive) ??
      null
    );
  }

  private findPassportNumber(records: ApiPassportRecord[], peopleId: number): string {
    return records.find((item) => item.peopleId === peopleId)?.passportNumber ?? 'Нет паспорта';
  }

  private getLatestByDate<T>(records: T[], selector: (item: T) => string | null | undefined): T | null {
    return [...records]
      .sort((left, right) => String(selector(right) ?? '').localeCompare(String(selector(left) ?? '')))[0] ?? null;
  }

  private getAge(dateValue: string): number {
    const birthDate = new Date(dateValue);
    const diff = Date.now() - birthDate.getTime();
    return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
  }

  private getGenderLabel(gender: string): string {
    return gender === 'FEMALE' ? 'Женский' : 'Мужской';
  }

  private getMilitaryStatusLabel(
    military: ApiMilitaryRecord | null,
    education: ApiEducationRecord | null,
    vvk: ApiVvkResult | null,
    border: ApiBorderCrossing | null,
  ): string {
    if (border?.outsideBorder && !border.returnDate) {
      return 'За границей';
    }
    if (vvk?.finalDecision === 'UNFIT') {
      return 'Не годен';
    }
    if (military?.militaryStatus === 'FAMILY_CIRCUMSTANCES') {
      return 'Освобождение по семье';
    }
    if (military?.militaryStatus === 'STUDENT' || education?.isDeferralActive) {
      return 'Учебная отсрочка';
    }
    if (military?.militaryStatus === 'PRE_CONSCRIPT') {
      return 'Допризывник';
    }
    if (military?.militaryStatus === 'CONSCRIPT') {
      return 'Призывник';
    }
    if (military?.militaryStatus === 'IN_SERVICE') {
      return 'На службе';
    }
    if (this.hasCompletedService(military)) {
      return 'Службу прошёл';
    }
    return 'Нет связки';
  }

  private getFitnessLabel(vvk: ApiVvkResult | null, medical: ApiMedicalRecord | null): string {
    if (vvk?.fitnessCategory) {
      const labels: Record<string, string> = {
        FIT: 'Годен',
        FIT_WITH_LIMITATIONS: 'Годен с ограничениями',
        TEMP_UNFIT: 'Временно не годен',
        TEMPORARILY_UNFIT: 'Временно не годен',
        UNFIT: 'Не годен',
      };
      return labels[vvk.fitnessCategory] ?? vvk.fitnessCategory;
    }
    if (medical?.decision) {
      const labels: Record<string, string> = {
        FIT: 'Годен',
        FIT_WITH_LIMITATIONS: 'Годен с ограничениями',
        TEMPORARY_DEFERMENT: 'Временная отсрочка',
        UNFIT: 'Не годен',
      };
      return labels[medical.decision] ?? medical.decision;
    }
    return 'Нет решения ВВК';
  }

  private getDefermentBasis(military: ApiMilitaryRecord | null, education: ApiEducationRecord | null, family: ApiFamily | null): string {
    if (military?.militaryStatus === 'FAMILY_CIRCUMSTANCES') {
      return military.familyExemptionReason ?? 'Семейное основание';
    }
    if (education?.isDeferralActive) {
      return `Учеба: ${education.institutionName ?? 'учреждение не указано'}`;
    }
    if (family?.eligibleFatherForMilitaryExemption) {
      return 'Семья подходит под освобождение, проверь военную запись';
    }
    return 'Нет активного основания';
  }

  private getVoenkomatSection(row: VoenkomatCitizenRow): string {
    if (row.gender !== 'Мужской') {
      return 'Не военнообязанные';
    }

    if (row.militaryStatus === 'Освобождение по семье' || row.childrenCount >= 2) {
      return 'Освобождение по семье';
    }

    if (row.militaryStatus === 'Учебная отсрочка') {
      return 'Учебная отсрочка';
    }

    if (row.militaryStatus === 'Не годен') {
      return 'Не годен';
    }

    if (row.militaryStatus === 'Службу прошёл') {
      return 'В запасе';
    }

    if (row.age >= 18 && row.age <= 27) {
      return 'Призывники';
    }

    return 'Остальные мужчины';
  }

  private hasCompletedService(military: ApiMilitaryRecord | null): boolean {
    if (!military) {
      return false;
    }

    const normalizedStatus = String(military.militaryStatus ?? '').trim().toUpperCase();
    const normalizedRecordStatus = String(military.status ?? '').trim().toUpperCase();

    return (
      normalizedStatus === 'SERVICE_COMPLETED' ||
      normalizedStatus === 'COMPLETED_SERVICE' ||
      normalizedStatus === 'COMPLETED' ||
      normalizedStatus === 'RESERVE' ||
      normalizedStatus === 'DISCHARGED' ||
      normalizedRecordStatus === 'SERVICE_COMPLETED' ||
      normalizedRecordStatus === 'COMPLETED_SERVICE' ||
      normalizedRecordStatus === 'COMPLETED' ||
      normalizedRecordStatus === 'DISCHARGED'
    );
  }

  private getReviewStatusLabel(status: string | null | undefined, fallbackApproved: boolean): string {
    const labels: Record<string, string> = {
      PENDING: 'На проверке',
      APPROVED: 'Подтверждено',
      REJECTED: 'Отказано',
      NEEDS_WORK: 'Доработка',
    };

    if (status && labels[status]) {
      return labels[status];
    }

    return fallbackApproved ? 'Подтверждено' : 'На проверке';
  }

  private getExpulsionStatusLabel(status: string | null | undefined): string {
    const labels: Record<string, string> = {
      PENDING_CALL: 'Ожидает вызова',
      DEFERMENT_REMOVED: 'Снято с отсрочки',
      DATA_ERROR: 'Ошибка данных',
    };

    return status && labels[status] ? labels[status] : 'Ожидает вызова';
  }
}
