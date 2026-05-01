import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiMaternityRecord {
  id: number;
  userId: number;
  userName: string | null;
  birthDateTime: string;
  placeOfBirth: string | null;
  gender: string | null;
  childFullName: string | null;
  fatherFullName: string | null;
  motherFullName: string | null;
  fatherPersonId: number | null;
  childCitizenId?: number | null;
  motherCitizenId?: number | null;
  familyId?: number | null;
  birthCaseType?: string | null;
  birthWeight: number | null;
  status: string | null;
  comment: string | null;
  createdAt: string | null;
}

export type MaternityStatus = 'DRAFT' | 'SUBMITTED_TO_ZAGS' | 'REGISTERED_BY_ZAGS' | 'REJECTED' | 'ARCHIVED';
export type MaternityGender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export interface CreateMaternityRecordRequest {
  userId: number;
  birthDateTime: string;
  placeOfBirth: string;
  gender: MaternityGender | 'F' | 'M' | 'Женский' | 'Мужской';
  childFullName?: string | null;
  fatherFullName?: string | null;
  motherFullName?: string | null;
  fatherPersonId?: number;
  childCitizenId?: number | null;
  motherCitizenId?: number | null;
  familyId?: number | null;
  birthCaseType?: string;
  birthWeight: number;
  status: MaternityStatus | string;
  comment: string;
}

export interface ApiPerson {
  id: number;
  fullName: string | null;
}

export interface ApiCitizen {
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
}

@Injectable({ providedIn: 'root' })
export class MaternityRecordsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/maternity-records`;
  private readonly peopleApiUrl = `${environment.apiBaseUrl}/api/people`;
  private readonly citizensApiUrl = `${environment.apiBaseUrl}/api/citizens`;
  private readonly maternityStatusesApiUrl = `${environment.apiBaseUrl}/api/enums/maternity-statuses`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiMaternityRecord[]> {
    return this.http
      .get<ApiResponse<ApiMaternityRecord[] | ApiMaternityRecord> | ApiMaternityRecord[] | ApiMaternityRecord>(this.apiUrl)
      .pipe(map((response) => this.unwrap(response)));
  }

  create(payload: CreateMaternityRecordRequest): Observable<ApiMaternityRecord | null> {
    return this.http
      .post<ApiResponse<ApiMaternityRecord> | ApiMaternityRecord>(this.apiUrl, this.toApiPayload(payload))
      .pipe(map((response) => (this.isApiWrapper<ApiMaternityRecord>(response) ? (response.data ?? null) : (response ?? null))));
  }

  update(id: number, payload: CreateMaternityRecordRequest): Observable<boolean> {
    return this.http
      .patch(`${this.apiUrl}/${id}`, this.toApiPayload(payload), { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${id}`, { observe: 'response', responseType: 'text' }).pipe(map((response) => response.ok));
  }

  getPeople(): Observable<ApiPerson[]> {
    return this.http
      .get<ApiResponse<ApiPerson[]> | ApiPerson[]>(this.peopleApiUrl)
      .pipe(map((response) => this.unwrapPeople(response)));
  }

  getCitizens(): Observable<ApiCitizen[]> {
    return this.http
      .get<ApiResponse<ApiCitizen[]> | ApiCitizen[]>(this.citizensApiUrl)
      .pipe(map((response) => this.unwrapCitizens(response)));
  }

  getMaternityStatuses(): Observable<string[]> {
    return this.http.get<Record<string, string>>(this.maternityStatusesApiUrl).pipe(
      map((response) => {
        const statuses = Object.values(response ?? {})
          .map((value) => value.trim())
          .filter((value) => value.length > 0);
        return statuses.length > 0 ? statuses : ['DRAFT', 'SUBMITTED_TO_ZAGS', 'REGISTERED_BY_ZAGS'];
      }),
    );
  }

  private unwrap(
    response: ApiResponse<ApiMaternityRecord[] | ApiMaternityRecord> | ApiMaternityRecord[] | ApiMaternityRecord,
  ): ApiMaternityRecord[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (this.isApiWrapper(response)) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data ? [response.data] : [];
    }

    return response ? [response] : [];
  }

  private isApiWrapper<T>(value: unknown): value is ApiResponse<T> {
    return !!value && typeof value === 'object' && 'data' in value;
  }

  private unwrapPeople(response: ApiResponse<ApiPerson[]> | ApiPerson[]): ApiPerson[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response.data ?? [];
  }

  private unwrapCitizens(response: ApiResponse<ApiCitizen[]> | ApiCitizen[]): ApiCitizen[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response.data ?? [];
  }

  private toApiPayload(payload: CreateMaternityRecordRequest): CreateMaternityRecordRequest {
    const gender = String(payload.gender).trim().toUpperCase();
    const status = String(payload.status).trim().toUpperCase();

    const normalizedGender: MaternityGender =
      gender === 'F' || gender === 'FEMALE'
        ? 'FEMALE'
        : gender === 'M' || gender === 'MALE'
          ? 'MALE'
          : 'UNKNOWN';

    const normalizedStatus: MaternityStatus =
      status === 'SUBMITTED_TO_ZAGS'
        ? 'SUBMITTED_TO_ZAGS'
        : status === 'REGISTERED_BY_ZAGS'
          ? 'REGISTERED_BY_ZAGS'
          : status === 'REJECTED'
            ? 'REJECTED'
            : status === 'ARCHIVED'
              ? 'ARCHIVED'
              : 'DRAFT';

    return {
      ...payload,
      gender: normalizedGender,
      status: normalizedStatus,
    };
  }
}
