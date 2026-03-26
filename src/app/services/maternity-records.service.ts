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
  fatherFullName: string | null;
  motherFullName: string | null;
  birthWeight: number | null;
  status: string | null;
  comment: string | null;
  createdAt: string | null;
}

export type MaternityStatus = 'Registered' | 'Pending' | 'Transferred' | 'Archived';
export type MaternityGender = 'F' | 'M';

export interface CreateMaternityRecordRequest {
  userId: number;
  birthDateTime: string;
  placeOfBirth: string;
  gender: MaternityGender;
  fatherFullName: string;
  motherFullName: string;
  birthWeight: number;
  status: MaternityStatus;
  comment: string;
}

@Injectable({ providedIn: 'root' })
export class MaternityRecordsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/maternity-records`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiMaternityRecord[]> {
    return this.http
      .get<ApiResponse<ApiMaternityRecord[] | ApiMaternityRecord> | ApiMaternityRecord[] | ApiMaternityRecord>(this.apiUrl)
      .pipe(map((response) => this.unwrap(response)));
  }

  create(payload: CreateMaternityRecordRequest): Observable<ApiMaternityRecord | null> {
    return this.http
      .post<ApiResponse<ApiMaternityRecord> | ApiMaternityRecord>(this.apiUrl, payload)
      .pipe(
        map((response) => {
          if (this.isApiWrapper<ApiMaternityRecord>(response)) {
            return response.data ?? null;
          }
          return response ?? null;
        }),
      );
  }

  update(id: number, payload: CreateMaternityRecordRequest): Observable<boolean> {
    return this.http
      .put(`${this.apiUrl}/${id}`, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  delete(id: number): Observable<boolean> {
    return this.http
      .delete(`${this.apiUrl}/${id}`, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
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
}
