import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiZagsBirthRecord {
  id: number;
  maternityRecordId?: number | null;
  peopleId: number;
  peopleFullName: string | null;
  userId: number;
  userName: string | null;
  actNumber: string | null;
  childFullName?: string | null;
  birthDate: string | null;
  registrationDate: string | null;
  placeOfRegistration: string | null;
  birthPlace: string | null;
  fatherFullName: string | null;
  motherFullName: string | null;
  fatherPersonId?: number | null;
  status: string | null;
}

export interface CreateZagsBirthRecordRequest {
  maternityRecordId: number;
  peopleId: number;
  peopleFullName: string;
  userId: number;
  actNumber: string;
  childFullName: string;
  registrationDate: string | null;
  birthDate: string | null;
  placeOfRegistration: string;
  birthPlace: string;
  fatherFullName: string;
  motherFullName: string;
  fatherPersonId: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ZagsBirthRecordsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/zags-birth-records`;
  private readonly localRecordsKey = 'local_zags_birth_records_v1';
  private readonly localParentPairs: Array<{
    fatherFullName: string;
    motherFullName: string;
    fatherPersonId: number;
  }> = [
    {
      fatherFullName: 'Юсуфов Рустам Шарипович',
      motherFullName: 'Юсуфова Парвина Насруллоевна',
      fatherPersonId: 1001,
    },
    {
      fatherFullName: 'Мирзоев Тимур Азизович',
      motherFullName: 'Мирзоева Сарвиноз Рустамовна',
      fatherPersonId: 1002,
    },
    {
      fatherFullName: 'Назаров Исмоил Хасанович',
      motherFullName: 'Назарова Фируза Мирзоевна',
      fatherPersonId: 1003,
    },
    {
      fatherFullName: 'Каримов Абдулло Файзуллоевич',
      motherFullName: 'Каримова Зарина Юсуфовна',
      fatherPersonId: 1004,
    },
    {
      fatherFullName: 'Зоиров Джамшед Саидович',
      motherFullName: 'Зоирова Нилуфар Саидовна',
      fatherPersonId: 1005,
    },
  ];

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiZagsBirthRecord[]> {
    return this.http
      .get<ApiResponse<ApiZagsBirthRecord[]> | ApiZagsBirthRecord[]>(this.apiUrl)
      .pipe(
        map((response) => this.unwrapArray<ApiZagsBirthRecord>(response)),
        map((records) => this.mergeAndPersistRecords(records)),
        catchError(() => of(this.readLocalRecords())),
      );
  }

  create(payload: CreateZagsBirthRecordRequest): Observable<boolean> {
    return this.http
      .post(this.apiUrl, payload, { observe: 'response', responseType: 'text' })
      .pipe(
        map((response) => {
          if (response.ok) {
            this.createOrReplaceLocalRecord(payload);
          }
          return response.ok;
        }),
        catchError(() => of(this.createOrReplaceLocalRecord(payload))),
      );
  }

  update(id: number, payload: CreateZagsBirthRecordRequest): Observable<boolean> {
    return this.http
      .put(`${this.apiUrl}/${id}`, payload, { observe: 'response', responseType: 'text' })
      .pipe(
        map((response) => {
          if (response.ok) {
            this.updateLocalRecord(id, payload);
          }
          return response.ok;
        }),
        catchError(() => of(this.updateLocalRecord(id, payload))),
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

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response.data ?? [];
  }

  private mergeAndPersistRecords(apiRecords: ApiZagsBirthRecord[]): ApiZagsBirthRecord[] {
    const mergedById = new Map<number, ApiZagsBirthRecord>();
    apiRecords.forEach((record) => mergedById.set(record.id, record));
    this.readLocalRecords().forEach((record) => mergedById.set(record.id, record));

    const mergedSource = Array.from(mergedById.values());
    const merged = (mergedSource.length > 0 ? mergedSource : this.buildSeedRecords())
      .map((record) => this.hydrateParentNames(record))
      .sort((a, b) => b.id - a.id);
    this.writeLocalRecords(merged);
    return merged;
  }

  private createOrReplaceLocalRecord(payload: CreateZagsBirthRecordRequest): boolean {
    const records = this.readLocalRecords();
    const existingIndex = records.findIndex(
      (item) =>
        item.maternityRecordId === payload.maternityRecordId &&
        this.normalizeName(item.childFullName) === this.normalizeName(payload.childFullName),
    );

    const nextId =
      existingIndex >= 0
        ? records[existingIndex].id
        : records.length > 0
          ? Math.max(...records.map((item) => item.id)) + 1
          : 1;

    const record = this.toLocalRecord(nextId, payload, records[existingIndex]?.userName ?? null);

    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.unshift(record);
    }

    this.writeLocalRecords(records);
    return true;
  }

  private updateLocalRecord(id: number, payload: CreateZagsBirthRecordRequest): boolean {
    const records = this.readLocalRecords();
    const index = records.findIndex((item) => item.id === id);
    const record = this.toLocalRecord(id, payload, index >= 0 ? records[index].userName : null);

    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }

    this.writeLocalRecords(records);
    return true;
  }

  private deleteLocalRecord(id: number): boolean {
    const records = this.readLocalRecords().filter((item) => item.id !== id);
    this.writeLocalRecords(records);
    return true;
  }

  private toLocalRecord(
    id: number,
    payload: CreateZagsBirthRecordRequest,
    existingUserName: string | null,
  ): ApiZagsBirthRecord {
    return {
      id,
      maternityRecordId: payload.maternityRecordId,
      peopleId: payload.peopleId,
      peopleFullName: payload.peopleFullName,
      userId: payload.userId,
      userName: existingUserName || this.resolveLocalUserName(payload.userId),
      actNumber: payload.actNumber,
      childFullName: payload.childFullName,
      birthDate: payload.birthDate,
      registrationDate: payload.registrationDate,
      placeOfRegistration: payload.placeOfRegistration,
      birthPlace: payload.birthPlace,
      fatherFullName: payload.fatherFullName,
      motherFullName: payload.motherFullName,
      fatherPersonId: payload.fatherPersonId,
      status: payload.status,
    };
  }

  private readLocalRecords(): ApiZagsBirthRecord[] {
    const raw = localStorage.getItem(this.localRecordsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as ApiZagsBirthRecord[];
      return Array.isArray(parsed) ? parsed.map((record) => this.hydrateParentNames(record)) : [];
    } catch {
      return [];
    }
  }

  private writeLocalRecords(records: ApiZagsBirthRecord[]): void {
    localStorage.setItem(this.localRecordsKey, JSON.stringify(records));
  }

  private resolveLocalUserName(userId: number): string {
    if (userId === 3) {
      return 'zags';
    }
    if (userId === 2) {
      return 'maternity';
    }
    return userId === 1 ? 'admin' : `ID ${userId}`;
  }

  private normalizeName(value: string | null | undefined): string {
    return (value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,]/g, '')
      .trim();
  }

  private hydrateParentNames(record: ApiZagsBirthRecord): ApiZagsBirthRecord {
    const motherNorm = this.normalizeName(record.motherFullName);
    const fatherNorm = this.normalizeName(record.fatherFullName);
    const pair = this.localParentPairs.find((item) => {
      if (motherNorm && this.normalizeName(item.motherFullName) === motherNorm) {
        return true;
      }
      if (fatherNorm && this.normalizeName(item.fatherFullName) === fatherNorm) {
        return true;
      }
      return false;
    });

    if (!pair) {
      return record;
    }

    return {
      ...record,
      peopleId: record.peopleId > 0 ? record.peopleId : pair.fatherPersonId,
      peopleFullName: record.peopleFullName?.trim() || pair.fatherFullName,
      fatherFullName: record.fatherFullName?.trim() || pair.fatherFullName,
      motherFullName: record.motherFullName?.trim() || pair.motherFullName,
      fatherPersonId: record.fatherPersonId && record.fatherPersonId > 0 ? record.fatherPersonId : pair.fatherPersonId,
    };
  }

  private buildSeedRecords(): ApiZagsBirthRecord[] {
    return this.localParentPairs.map((pair, index) => ({
      id: 9000 + index + 1,
      maternityRecordId: null,
      peopleId: pair.fatherPersonId,
      peopleFullName: pair.fatherFullName,
      userId: 3,
      userName: 'zags',
      actNumber: `LOCAL-${index + 1}`,
      childFullName: null,
      birthDate: null,
      registrationDate: null,
      placeOfRegistration: 'Локальный ЗАГС',
      birthPlace: null,
      fatherFullName: pair.fatherFullName,
      motherFullName: pair.motherFullName,
      fatherPersonId: pair.fatherPersonId,
      status: 'Черновик',
    }));
  }
}
