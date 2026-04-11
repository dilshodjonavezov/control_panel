import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
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
  birthWeight: number | null;
  status: string | null;
  comment: string | null;
  createdAt: string | null;
}

export type MaternityStatus =
  | 'Черновик'
  | 'Отправлен в ЗАГС'
  | 'Зарегистрирован'
  | 'Registered'
  | 'Pending'
  | 'Transferred'
  | 'Archived'
  | 'Ожидает'
  | 'В ожидании'
  | 'Передан'
  | 'Архив'
  | 'Архивирован';
export type MaternityGender = 'F' | 'M' | 'Женский' | 'Мужской';

export interface CreateMaternityRecordRequest {
  userId: number;
  birthDateTime: string;
  placeOfBirth: string;
  gender: MaternityGender;
  childFullName: string;
  fatherFullName: string;
  motherFullName: string;
  fatherPersonId?: number;
  birthWeight: number;
  status: MaternityStatus;
  comment: string;
}

export interface ApiPerson {
  id: number;
  fullName: string | null;
}

type LocalZagsPersonRecord = {
  peopleId: number;
  peopleFullName: string | null;
  fatherFullName: string | null;
  fatherPersonId?: number | null;
};

@Injectable({ providedIn: 'root' })
export class MaternityRecordsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/maternity-records`;
  private readonly peopleApiUrl = `${environment.apiBaseUrl}/api/people`;
  private readonly maternityStatusesApiUrl = `${environment.apiBaseUrl}/api/Enums/maternity-statuses`;
  private readonly localRecordsKey = 'local_maternity_seed_v1';
  private readonly localZagsKey = 'local_zags_birth_records_v1';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiMaternityRecord[]> {
    return this.http
      .get<ApiResponse<ApiMaternityRecord[] | ApiMaternityRecord> | ApiMaternityRecord[] | ApiMaternityRecord>(this.apiUrl)
      .pipe(
        map((response) => this.unwrap(response)),
        map((records) => this.mergeAndPersistRecords(records)),
        catchError(() => of(this.readLocalRecords())),
      );
  }

  create(payload: CreateMaternityRecordRequest): Observable<ApiMaternityRecord | null> {
    const apiPayload = this.toApiPayload(payload);
    return this.http
      .post<ApiResponse<ApiMaternityRecord> | ApiMaternityRecord>(this.apiUrl, apiPayload)
      .pipe(
        map((response) => {
          const created = this.isApiWrapper<ApiMaternityRecord>(response)
            ? (response.data ?? null)
            : (response ?? null);

          if (created) {
            this.upsertLocalRecord(created);
            return created;
          }

          return this.createLocalRecord(apiPayload);
        }),
        catchError(() => of(this.createLocalRecord(apiPayload))),
      );
  }

  update(id: number, payload: CreateMaternityRecordRequest): Observable<boolean> {
    const apiPayload = this.toApiPayload(payload);
    return this.http
      .put(`${this.apiUrl}/${id}`, apiPayload, { observe: 'response', responseType: 'text' })
      .pipe(
        map((response) => {
          if (response.ok) {
            this.updateLocalRecord(id, apiPayload);
          }
          return response.ok;
        }),
        catchError(() => of(this.updateLocalRecord(id, apiPayload))),
      );
  }

  delete(id: number): Observable<boolean> {
    return this.http
      .delete(`${this.apiUrl}/${id}`, { observe: 'response', responseType: 'text' })
      .pipe(
        map((response) => {
          if (response.ok) {
            this.deleteLocalRecord(id);
          }
          return response.ok;
        }),
        catchError(() => of(this.deleteLocalRecord(id))),
      );
  }

  getPeople(): Observable<ApiPerson[]> {
    return this.http
      .get<ApiResponse<ApiPerson[]> | ApiPerson[]>(this.peopleApiUrl)
      .pipe(
        map((response) => this.unwrapPeople(response)),
        catchError(() => of(this.buildLocalPeople())),
      );
  }

  getMaternityStatuses(): Observable<string[]> {
    return this.http
      .get<Record<string, string>>(this.maternityStatusesApiUrl)
      .pipe(
        map((response) => {
          const statuses = Object.values(response ?? {})
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
          return statuses.length > 0 ? statuses : ['Черновик', 'Отправлен в ЗАГС', 'Зарегистрирован'];
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

  private toApiPayload(payload: CreateMaternityRecordRequest): CreateMaternityRecordRequest {
    const genderMap: Record<string, MaternityGender> = {
      F: 'Женский',
      M: 'Мужской',
      Женский: 'Женский',
      Мужской: 'Мужской',
    };

    const statusMap: Record<string, MaternityStatus> = {
      Черновик: 'Черновик',
      'Отправлен в ЗАГС': 'Отправлен в ЗАГС',
      Зарегистрирован: 'Зарегистрирован',
      Registered: 'Зарегистрирован',
      Pending: 'Черновик',
      Transferred: 'Отправлен в ЗАГС',
      Archived: 'Зарегистрирован',
      Ожидает: 'Черновик',
      'В ожидании': 'Черновик',
      Передан: 'Отправлен в ЗАГС',
      Архив: 'Зарегистрирован',
      Архивирован: 'Зарегистрирован',
    };

    return {
      ...payload,
      gender: genderMap[payload.gender] ?? 'Мужской',
      status: statusMap[payload.status] ?? 'Черновик',
    };
  }

  private mergeAndPersistRecords(apiRecords: ApiMaternityRecord[]): ApiMaternityRecord[] {
    const mergedById = new Map<number, ApiMaternityRecord>();
    apiRecords.forEach((record) => mergedById.set(record.id, record));
    this.readLocalRecords().forEach((record) => mergedById.set(record.id, record));

    const merged = Array.from(mergedById.values()).sort((a, b) => b.id - a.id);
    this.writeLocalRecords(merged);
    return merged;
  }

  private buildLocalPeople(): ApiPerson[] {
    const peopleById = new Map<number, string>();

    this.readLocalRecords().forEach((record) => {
      if (record.fatherPersonId && record.fatherPersonId > 0 && record.fatherFullName?.trim()) {
        peopleById.set(record.fatherPersonId, record.fatherFullName.trim());
      }
    });

    this.readLocalZagsRecords().forEach((record) => {
      const peopleId = record.fatherPersonId ?? record.peopleId;
      const fullName = record.fatherFullName?.trim() || record.peopleFullName?.trim() || '';
      if (peopleId && peopleId > 0 && fullName) {
        peopleById.set(peopleId, fullName);
      }
    });

    return Array.from(peopleById.entries())
      .sort((a, b) => a[1].localeCompare(b[1], 'ru'))
      .map(([id, fullName]) => ({ id, fullName }));
  }

  private createLocalRecord(payload: CreateMaternityRecordRequest): ApiMaternityRecord {
    const records = this.readLocalRecords();
    const nextId = records.length > 0 ? Math.max(...records.map((item) => item.id)) + 1 : 1;
    const record: ApiMaternityRecord = {
      id: nextId,
      userId: payload.userId,
      userName: this.resolveLocalUserName(payload.userId),
      birthDateTime: payload.birthDateTime,
      placeOfBirth: payload.placeOfBirth,
      gender: payload.gender,
      childFullName: payload.childFullName,
      fatherFullName: payload.fatherFullName,
      motherFullName: payload.motherFullName,
      fatherPersonId: payload.fatherPersonId ?? null,
      birthWeight: payload.birthWeight,
      status: payload.status,
      comment: payload.comment,
      createdAt: new Date().toISOString(),
    };

    records.unshift(record);
    this.writeLocalRecords(records);
    return record;
  }

  private upsertLocalRecord(record: ApiMaternityRecord): void {
    const records = this.readLocalRecords().filter((item) => item.id !== record.id);
    records.unshift(record);
    this.writeLocalRecords(records);
  }

  private updateLocalRecord(id: number, payload: CreateMaternityRecordRequest): boolean {
    const records = this.readLocalRecords();
    const index = records.findIndex((item) => item.id === id);
    const updatedRecord: ApiMaternityRecord = {
      id,
      userId: payload.userId,
      userName: this.resolveLocalUserName(payload.userId),
      birthDateTime: payload.birthDateTime,
      placeOfBirth: payload.placeOfBirth,
      gender: payload.gender,
      childFullName: payload.childFullName,
      fatherFullName: payload.fatherFullName,
      motherFullName: payload.motherFullName,
      fatherPersonId: payload.fatherPersonId ?? null,
      birthWeight: payload.birthWeight,
      status: payload.status,
      comment: payload.comment,
      createdAt: index >= 0 ? records[index].createdAt : new Date().toISOString(),
    };

    if (index >= 0) {
      records[index] = updatedRecord;
    } else {
      records.unshift(updatedRecord);
    }

    this.writeLocalRecords(records);
    return true;
  }

  private deleteLocalRecord(id: number): boolean {
    const records = this.readLocalRecords().filter((item) => item.id !== id);
    this.writeLocalRecords(records);
    return true;
  }

  private readLocalRecords(): ApiMaternityRecord[] {
    const raw = localStorage.getItem(this.localRecordsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as ApiMaternityRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeLocalRecords(records: ApiMaternityRecord[]): void {
    localStorage.setItem(this.localRecordsKey, JSON.stringify(records));
  }

  private readLocalZagsRecords(): LocalZagsPersonRecord[] {
    const raw = localStorage.getItem(this.localZagsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as LocalZagsPersonRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private resolveLocalUserName(userId: number): string {
    if (userId === 2) {
      return 'maternity';
    }
    if (userId === 3) {
      return 'zags';
    }
    return userId === 1 ? 'admin' : `ID ${userId}`;
  }
}
