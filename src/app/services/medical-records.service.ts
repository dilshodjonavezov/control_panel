import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiMedicalRecord {
  id: number;
  citizenId?: number;
  peopleId: number;
  peopleFullName: string | null;
  fatherFullName: string | null;
  motherFullName: string | null;
  addressLabel: string | null;
  userId: number;
  userName: string | null;
  organizationId: number | null;
  clinic: string;
  decision: string | null;
  reason: string | null;
  defermentReason: string | null;
  createdAtRecord: string | null;
  notes: string | null;
}

export interface CreateMedicalRecordRequest {
  peopleId: number;
  userId: number;
  clinic: string;
  decision: string;
  reason?: string | null;
  defermentReason?: string | null;
  createdAtRecord?: string | null;
  notes?: string | null;
}

export interface ApiSchoolRecord {
  id: number;
  citizenId?: number;
  peopleId: number;
  peopleFullName: string | null;
  fatherFullName: string | null;
  motherFullName: string | null;
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

export interface ApiCitizen {
  id: number;
  fullName: string;
  birthDate: string;
  gender: string;
  citizenship: string;
  lifeStatus: string;
  fatherFullName: string | null;
  motherFullName: string | null;
  fatherCitizenId?: number | null;
  motherCitizenId?: number | null;
  familyId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class MedicalRecordsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/medical-records`;
  private readonly schoolApiUrl = `${environment.apiBaseUrl}/api/school-records`;
  private readonly citizensApiUrl = `${environment.apiBaseUrl}/api/citizens`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiMedicalRecord[]> {
    return this.http
      .get<ApiResponse<ApiMedicalRecord[]> | ApiMedicalRecord[]>(this.apiUrl)
      .pipe(map((response) => this.unwrapArray<ApiMedicalRecord>(response)));
  }

  create(payload: CreateMedicalRecordRequest): Observable<boolean> {
    return this.http
      .post(this.apiUrl, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  update(id: number, payload: CreateMedicalRecordRequest): Observable<boolean> {
    return this.http
      .put(`${this.apiUrl}/${id}`, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  delete(id: number): Observable<boolean> {
    return this.http
      .delete(`${this.apiUrl}/${id}`, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  getGraduatedSchoolRecords(): Observable<ApiSchoolRecord[]> {
    return this.http
      .get<ApiResponse<ApiSchoolRecord[]> | ApiSchoolRecord[]>(this.schoolApiUrl)
      .pipe(
        map((response) => this.unwrapArray<ApiSchoolRecord>(response)),
        map((records) => records.filter((record) => this.normalizeText(record.graduationDate))),
      );
  }

  getCitizens(): Observable<ApiCitizen[]> {
    return this.http
      .get<ApiResponse<ApiCitizen[]> | ApiCitizen[]>(this.citizensApiUrl)
      .pipe(map((response) => this.unwrapArray<ApiCitizen>(response)));
  }

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response.data ?? [];
  }

  private normalizeText(value: string | null | undefined): string {
    return (value ?? '').trim();
  }
}
