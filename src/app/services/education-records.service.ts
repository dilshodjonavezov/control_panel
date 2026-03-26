import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiEducationRecord {
  id: number;
  peopleId: number;
  peopleFullName: string | null;
  institutionId: number;
  institutionName: string | null;
  studyForm: string | null;
  faculty: string | null;
  specialty: string | null;
  admissionDate: string | null;
  expulsionDate: string | null;
  graduationDate: string | null;
  isDeferralActive: boolean;
  userId: number;
  userName: string | null;
}

export interface ApiPerson {
  id: number;
  fullName: string | null;
}

export interface CreateEducationRecordRequest {
  peopleId: number;
  institutionId: number;
  studyForm: string;
  faculty: string;
  specialty: string;
  admissionDate: string | null;
  expulsionDate: string | null;
  graduationDate: string | null;
  isDeferralActive: boolean;
  userId: number;
}

@Injectable({ providedIn: 'root' })
export class EducationRecordsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/education-records`;
  private readonly peopleApiUrl = `${environment.apiBaseUrl}/api/people`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiEducationRecord[]> {
    return this.http
      .get<ApiResponse<ApiEducationRecord[]> | ApiEducationRecord[]>(this.apiUrl)
      .pipe(map((response) => this.unwrapArray<ApiEducationRecord>(response)));
  }

  getById(id: number): Observable<ApiEducationRecord | null> {
    return this.http
      .get<ApiResponse<ApiEducationRecord> | ApiEducationRecord>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => {
          if (this.isApiWrapper<ApiEducationRecord>(response)) {
            return response.data ?? null;
          }

          return response ?? null;
        })
      );
  }

  create(payload: CreateEducationRecordRequest): Observable<boolean> {
    return this.http
      .post(this.apiUrl, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  update(id: number, payload: CreateEducationRecordRequest): Observable<boolean> {
    return this.http
      .put(`${this.apiUrl}/${id}`, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  delete(id: number): Observable<boolean> {
    return this.http
      .delete(`${this.apiUrl}/${id}`, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  getPeople(): Observable<ApiPerson[]> {
    return this.http
      .get<ApiResponse<ApiPerson[]> | ApiPerson[]>(this.peopleApiUrl)
      .pipe(map((response) => this.unwrapArray<ApiPerson>(response)));
  }

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response.data ?? [];
  }

  private isApiWrapper<T>(value: unknown): value is ApiResponse<T> {
    return !!value && typeof value === 'object' && 'data' in value;
  }
}
