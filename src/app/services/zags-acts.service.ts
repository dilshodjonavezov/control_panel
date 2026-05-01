import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type ZagsActType = 'BIRTH' | 'MARRIAGE' | 'DEATH';
export type ZagsActStatus = 'DRAFT' | 'REGISTERED' | 'UPDATED' | 'CANCELLED' | 'ARCHIVED';

export interface ApiZagsActRecord {
  id: number;
  actNumber: string;
  actType: ZagsActType;
  status: string | null;
  registrationDate: string | null;
  placeOfRegistration: string | null;
  citizenId: number | null;
  maternityRecordId: number | null;
  familyId: number | null;
  userId: number;
  userName: string | null;
  organizationId?: number | null;
  birthDetails?: {
    childCitizenId?: number | null;
    birthCaseType?: string | null;
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
  createdAt?: string | null;
}

export interface CreateZagsActRequest {
  actNumber: string;
  actType: ZagsActType;
  status?: string;
  registrationDate: string;
  placeOfRegistration: string;
  userId: number;
  citizenId?: number | null;
  maternityRecordId?: number | null;
  familyId?: number | null;
  birthDetails?: {
    childCitizenId?: number | null;
    birthCaseType?: string;
    childFullName: string;
    birthDate: string;
    birthPlace: string;
    motherCitizenId?: number | null;
    motherFullName?: string | null;
    fatherCitizenId?: number | null;
    fatherFullName?: string | null;
  };
  marriageDetails?: {
    spouseOneCitizenId?: number | null;
    spouseOneFullName: string;
    spouseTwoCitizenId?: number | null;
    spouseTwoFullName: string;
    marriageDate: string;
    marriagePlace: string;
  };
  deathDetails?: {
    deceasedCitizenId?: number | null;
    deceasedFullName: string;
    deathDate: string;
    deathPlace: string;
    deathReason?: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class ZagsActsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/zags-acts`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiZagsActRecord[]> {
    return this.http
      .get<ApiResponse<ApiZagsActRecord[]> | ApiZagsActRecord[]>(this.apiUrl)
      .pipe(map((response) => this.unwrapArray(response)));
  }

  getOne(id: number): Observable<ApiZagsActRecord> {
    return this.http
      .get<ApiResponse<ApiZagsActRecord> | ApiZagsActRecord>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.unwrapOne(response)));
  }

  create(payload: CreateZagsActRequest): Observable<ApiZagsActRecord> {
    return this.http
      .post<ApiResponse<ApiZagsActRecord> | ApiZagsActRecord>(this.apiUrl, payload)
      .pipe(map((response) => this.unwrapOne(response)));
  }

  update(id: number, payload: CreateZagsActRequest): Observable<ApiZagsActRecord> {
    return this.http
      .patch<ApiResponse<ApiZagsActRecord> | ApiZagsActRecord>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => this.unwrapOne(response)));
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${id}`, { observe: 'response' }).pipe(map((response) => response.ok));
  }

  private unwrapArray(response: ApiResponse<ApiZagsActRecord[]> | ApiZagsActRecord[]): ApiZagsActRecord[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response.data ?? [];
  }

  private unwrapOne(response: ApiResponse<ApiZagsActRecord> | ApiZagsActRecord): ApiZagsActRecord {
    if (this.isApiWrapper(response)) {
      return response.data;
    }
    return response;
  }

  private isApiWrapper<T>(value: unknown): value is ApiResponse<T> {
    return !!value && typeof value === 'object' && 'data' in value;
  }
}
