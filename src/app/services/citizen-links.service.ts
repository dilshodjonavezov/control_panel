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

export interface LinkedCitizen {
  id: number;
  peopleId: number;
  fullName: string;
  birthDate: string;
  gender: string;
  citizenship: string;
  lifeStatus: string;
  motherFullName: string | null;
  motherCitizenId: number | null;
  fatherFullName: string | null;
  fatherCitizenId: number | null;
  familyId: number | null;
  militaryRegisteredAtBirth: boolean;
}

export interface LinkedFamilyChild {
  id: number;
  fullName: string | null;
  gender: string | null;
  birthDate: string | null;
  familyId: number | null;
  militaryRegisteredAtBirth: boolean;
}

export interface LinkedFamily {
  id: number;
  familyName: string;
  primaryCitizenId: number;
  primaryCitizenFullName: string | null;
  fatherCitizenId: number | null;
  fatherFullName: string | null;
  motherCitizenId: number | null;
  motherFullName: string | null;
  memberCitizenIds: number[];
  memberCount: number;
  childCitizenIds: number[];
  childrenCount: number;
  sonsCount: number;
  daughtersCount: number;
  addressId: number | null;
  addressLabel: string | null;
  eligibleFatherForMilitaryExemption: boolean;
  children: LinkedFamilyChild[];
}

export interface LinkedAddress {
  id: number;
  citizenId: number;
  familyId: number | null;
  type: string;
  fullAddress: string;
  isActive: boolean;
}

export interface LinkedPassportRecord {
  id: number;
  citizenId: number;
  peopleId: number;
  peopleFullName: string | null;
  passportNumber: string | null;
  dateOfIssue: string | null;
  expireDate: string | null;
  placeOfIssue: string | null;
}

export interface LinkedSchoolRecord {
  id: number;
  citizenId: number;
  peopleId: number;
  peopleFullName: string | null;
  institutionId: number;
  institutionName: string | null;
  classNumber: number | null;
  admissionDate: string | null;
  graduationDate: string | null;
  expulsionDate: string | null;
  isStudying: boolean;
  userId: number;
  userName: string | null;
  comment: string | null;
}

export interface LinkedEducationRecord {
  id: number;
  citizenId: number;
  peopleId: number;
  peopleFullName: string | null;
  schoolRecordId: number | null;
  medicalRecordId: number | null;
  institutionId: number;
  institutionName: string | null;
  studyForm: string | null;
  faculty: string | null;
  specialty: string | null;
  admissionDate: string | null;
  expulsionDate: string | null;
  graduationDate: string | null;
  isDeferralActive: boolean;
}

export interface LinkedMedicalRecord {
  id: number;
  citizenId: number;
  peopleId: number;
  peopleFullName: string | null;
  fatherFullName: string | null;
  motherFullName: string | null;
  addressLabel: string | null;
  clinic: string;
  decision: string | null;
  reason: string | null;
  defermentReason: string | null;
  createdAtRecord: string | null;
  notes: string | null;
}

export interface LinkedMedicalVisit {
  id: number;
  citizenId: number;
  peopleId: number;
  peopleFullName: string | null;
  medicalRecordId: number | null;
  doctor: string;
  visitDate: string | null;
  diagnosis: string;
  notes: string | null;
  status: string;
}

export interface LinkedVvkResult {
  id: number;
  citizenId: number;
  peopleId: number;
  peopleFullName: string | null;
  medicalVisitId: number | null;
  examDate: string;
  category: string;
  queueStatus: string;
  fitnessCategory: string | null;
  finalDecision: string | null;
  reason: string | null;
  notes: string | null;
  nextReviewDate: string | null;
}

export interface LinkedMilitaryRecord {
  id: number;
  citizenId: number;
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
  childrenCount: number;
  eligibleForFamilyExemption: boolean;
  familyExemptionReason: string | null;
}

export interface LinkedBorderCrossing {
  id: number;
  citizenId: number;
  peopleId: number;
  peopleName: string | null;
  departureDate: string;
  returnDate: string | null;
  outsideBorder: boolean;
  country: string | null;
  status: string;
  documentNumber: string | null;
}

export interface LinkedZagsAct {
  id: number;
  actNumber: string;
  actType: 'BIRTH' | 'MARRIAGE' | 'DEATH';
  citizenId: number | null;
  familyId: number | null;
  status: string | null;
  registrationDate: string | null;
  placeOfRegistration: string | null;
  birthDetails?: {
    childCitizenId?: number | null;
    childFullName?: string | null;
    birthDate?: string | null;
    birthPlace?: string | null;
    motherCitizenId?: number | null;
    motherFullName?: string | null;
    fatherCitizenId?: number | null;
    fatherFullName?: string | null;
  } | null;
  marriageDetails?: {
    spouseOneCitizenId?: number | null;
    spouseOneFullName?: string | null;
    spouseTwoCitizenId?: number | null;
    spouseTwoFullName?: string | null;
    marriageDate?: string | null;
    marriagePlace?: string | null;
  } | null;
  deathDetails?: {
    deceasedCitizenId?: number | null;
    deceasedFullName?: string | null;
    deathDate?: string | null;
    deathPlace?: string | null;
    deathReason?: string | null;
  } | null;
}

export interface CitizenLinksSnapshot {
  citizens: LinkedCitizen[];
  families: LinkedFamily[];
  addresses: LinkedAddress[];
  passports: LinkedPassportRecord[];
  schoolRecords: LinkedSchoolRecord[];
  educationRecords: LinkedEducationRecord[];
  medicalRecords: LinkedMedicalRecord[];
  medicalVisits: LinkedMedicalVisit[];
  vvkResults: LinkedVvkResult[];
  militaryRecords: LinkedMilitaryRecord[];
  borderCrossings: LinkedBorderCrossing[];
  zagsActs: LinkedZagsAct[];
}

export interface LinkedCitizenProfile {
  citizen: LinkedCitizen;
  father: LinkedCitizen | null;
  mother: LinkedCitizen | null;
  family: LinkedFamily | null;
  address: LinkedAddress | null;
  passport: LinkedPassportRecord | null;
  schoolRecords: LinkedSchoolRecord[];
  educationRecords: LinkedEducationRecord[];
  medicalRecords: LinkedMedicalRecord[];
  medicalVisits: LinkedMedicalVisit[];
  vvkResults: LinkedVvkResult[];
  militaryRecords: LinkedMilitaryRecord[];
  borderCrossings: LinkedBorderCrossing[];
  zagsActs: LinkedZagsAct[];
}

@Injectable({ providedIn: 'root' })
export class CitizenLinksService {
  private readonly apiBaseUrl = `${environment.apiBaseUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  getSnapshot(): Observable<CitizenLinksSnapshot> {
    return forkJoin({
      citizens: this.getArray<LinkedCitizen>('citizens').pipe(
        map((items) =>
          items.map((item) => ({
            ...item,
            peopleId: item.peopleId ?? item.id,
            motherCitizenId: item.motherCitizenId ?? null,
            fatherCitizenId: item.fatherCitizenId ?? null,
            familyId: item.familyId ?? null,
            militaryRegisteredAtBirth: Boolean(item.militaryRegisteredAtBirth),
          })),
        ),
      ),
      families: this.getArray<LinkedFamily>('families').pipe(
        map((items) =>
          items.map((item) => ({
            ...item,
            fatherCitizenId: item.fatherCitizenId ?? null,
            motherCitizenId: item.motherCitizenId ?? null,
            childCitizenIds: item.childCitizenIds ?? [],
            childrenCount: item.childrenCount ?? 0,
            sonsCount: item.sonsCount ?? 0,
            daughtersCount: item.daughtersCount ?? 0,
            eligibleFatherForMilitaryExemption: Boolean(item.eligibleFatherForMilitaryExemption),
            children: item.children ?? [],
          })),
        ),
      ),
      addresses: this.getArray<LinkedAddress>('addresses').pipe(
        map((items) => items.map((item) => ({ ...item, familyId: item.familyId ?? null, isActive: Boolean(item.isActive) }))),
      ),
      passports: this.getArray<LinkedPassportRecord>('passport-records').pipe(
        map((items) => items.map((item) => ({ ...item, citizenId: this.resolveCitizenId(item) }))),
      ),
      schoolRecords: this.getArray<LinkedSchoolRecord>('school-records').pipe(
        map((items) => items.map((item) => ({ ...item, citizenId: this.resolveCitizenId(item) }))),
      ),
      educationRecords: this.getArray<LinkedEducationRecord>('education-records').pipe(
        map((items) => items.map((item) => ({ ...item, citizenId: this.resolveCitizenId(item) }))),
      ),
      medicalRecords: this.getArray<LinkedMedicalRecord>('medical-records').pipe(
        map((items) => items.map((item) => ({ ...item, citizenId: this.resolveCitizenId(item) }))),
      ),
      medicalVisits: this.getArray<LinkedMedicalVisit>('medical-visits').pipe(
        map((items) => items.map((item) => ({ ...item, citizenId: this.resolveCitizenId(item) }))),
      ),
      vvkResults: this.getArray<LinkedVvkResult>('vvk-results').pipe(
        map((items) => items.map((item) => ({ ...item, citizenId: this.resolveCitizenId(item) }))),
      ),
      militaryRecords: this.getArray<LinkedMilitaryRecord>('military-records').pipe(
        map((items) => items.map((item) => ({ ...item, citizenId: this.resolveCitizenId(item) }))),
      ),
      borderCrossings: this.getArray<LinkedBorderCrossing>('border-crossings').pipe(
        map((items) => items.map((item) => ({ ...item, citizenId: this.resolveCitizenId(item) }))),
      ),
      zagsActs: this.getArray<LinkedZagsAct>('zags-acts'),
    });
  }

  buildCitizenProfile(snapshot: CitizenLinksSnapshot, citizenId: number): LinkedCitizenProfile | null {
    const citizen = snapshot.citizens.find((item) => item.id === citizenId) ?? null;
    if (!citizen) {
      return null;
    }

    const family =
      snapshot.families.find((item) => item.id === citizen.familyId) ??
      snapshot.families.find((item) => item.memberCitizenIds.includes(citizen.id) || item.childCitizenIds.includes(citizen.id)) ??
      null;

    return {
      citizen,
      father: citizen.fatherCitizenId ? snapshot.citizens.find((item) => item.id === citizen.fatherCitizenId) ?? null : null,
      mother: citizen.motherCitizenId ? snapshot.citizens.find((item) => item.id === citizen.motherCitizenId) ?? null : null,
      family,
      address:
        snapshot.addresses.find((item) => item.citizenId === citizen.id && item.isActive) ??
        snapshot.addresses.find((item) => family?.id && item.familyId === family.id && item.isActive) ??
        null,
      passport: snapshot.passports.find((item) => item.citizenId === citizen.id) ?? null,
      schoolRecords: snapshot.schoolRecords.filter((item) => item.citizenId === citizen.id),
      educationRecords: snapshot.educationRecords.filter((item) => item.citizenId === citizen.id),
      medicalRecords: snapshot.medicalRecords.filter((item) => item.citizenId === citizen.id),
      medicalVisits: snapshot.medicalVisits.filter((item) => item.citizenId === citizen.id),
      vvkResults: snapshot.vvkResults.filter((item) => item.citizenId === citizen.id),
      militaryRecords: snapshot.militaryRecords.filter((item) => item.citizenId === citizen.id),
      borderCrossings: snapshot.borderCrossings.filter((item) => item.citizenId === citizen.id),
      zagsActs: snapshot.zagsActs.filter(
        (item) =>
          item.citizenId === citizen.id ||
          item.birthDetails?.childCitizenId === citizen.id ||
          item.birthDetails?.motherCitizenId === citizen.id ||
          item.birthDetails?.fatherCitizenId === citizen.id ||
          item.marriageDetails?.spouseOneCitizenId === citizen.id ||
          item.marriageDetails?.spouseTwoCitizenId === citizen.id ||
          item.deathDetails?.deceasedCitizenId === citizen.id,
      ),
    };
  }

  formatCitizenOptionLabel(snapshot: CitizenLinksSnapshot, citizenId: number): string {
    const profile = this.buildCitizenProfile(snapshot, citizenId);
    if (!profile) {
      return `ID ${citizenId}`;
    }

    const parts: string[] = [];
    if (profile.father?.fullName || profile.citizen.fatherFullName) {
      parts.push(`отец: ${profile.father?.fullName ?? profile.citizen.fatherFullName}`);
    }
    if (profile.mother?.fullName || profile.citizen.motherFullName) {
      parts.push(`мать: ${profile.mother?.fullName ?? profile.citizen.motherFullName}`);
    }
    if (profile.address?.fullAddress) {
      parts.push(profile.address.fullAddress);
    }
    return parts.length > 0 ? `${profile.citizen.fullName} (${parts.join(', ')})` : profile.citizen.fullName;
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

  private resolveCitizenId(value: { citizenId?: number | null; peopleId?: number | null }): number {
    const citizenId = value.citizenId ?? value.peopleId ?? null;
    return Number.isInteger(citizenId) && (citizenId ?? 0) > 0 ? Number(citizenId) : 0;
  }
}
