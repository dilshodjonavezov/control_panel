import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiSchoolRecord {
  id: number;
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

export interface CreateSchoolRecordRequest {
  peopleId: number;
  institutionId: number;
  classNumber: number;
  admissionDate: string | null;
  graduationDate: string | null;
  expulsionDate: string | null;
  comment: string;
}

export interface ApiPerson {
  id: number;
  fullName: string | null;
}

export interface ApiUser {
  id: number;
  fullName: string | null;
}

export interface ApiEducationInstitution {
  id: number;
  name: string | null;
  type: string | null;
}

@Injectable({ providedIn: 'root' })
export class SchoolRecordsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/school-records`;
  private readonly peopleApiUrl = `${environment.apiBaseUrl}/api/people`;
  private readonly usersApiUrl = `${environment.apiBaseUrl}/api/users`;
  private readonly institutionsApiUrl = `${environment.apiBaseUrl}/api/education-institutions`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiSchoolRecord[]> {
    return this.http
      .get<ApiResponse<ApiSchoolRecord[]> | ApiSchoolRecord[]>(this.apiUrl)
      .pipe(map((response) => this.unwrapArray<ApiSchoolRecord>(response)));
  }

  create(payload: CreateSchoolRecordRequest): Observable<boolean> {
    return this.http
      .post(this.apiUrl, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  update(id: number, payload: CreateSchoolRecordRequest): Observable<boolean> {
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

  getUsers(): Observable<ApiUser[]> {
    return this.http
      .get<ApiResponse<ApiUser[]> | ApiUser[]>(this.usersApiUrl)
      .pipe(map((response) => this.unwrapArray<ApiUser>(response)));
  }

  getInstitutions(): Observable<ApiEducationInstitution[]> {
    return this.http
      .get<ApiResponse<ApiEducationInstitution[]> | ApiEducationInstitution[]>(this.institutionsApiUrl)
      .pipe(map((response) => this.unwrapArray<ApiEducationInstitution>(response)));
  }

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response.data ?? [];
  }
}
