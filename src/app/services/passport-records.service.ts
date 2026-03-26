import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiPassportRecord {
  id: number;
  peopleId: number;
  peopleFullName: string | null;
  userId: number;
  userName: string | null;
  passportNumber: string | null;
  dateOfIssue: string | null;
  placeOfIssue: string | null;
  dateBirth: string | null;
}

export interface CreatePassportRecordRequest {
  peopleId: number;
  userId: number;
  passportNumber: string;
  dateOfIssue: string | null;
  placeOfIssue: string;
  dateBirth: string | null;
}

export interface ApiPerson {
  id: number;
  fullName: string | null;
}

export interface ApiUser {
  id: number;
  fullName: string | null;
}

@Injectable({ providedIn: 'root' })
export class PassportRecordsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/passport-records`;
  private readonly peopleApiUrl = `${environment.apiBaseUrl}/api/people`;
  private readonly usersApiUrl = `${environment.apiBaseUrl}/api/users`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiPassportRecord[]> {
    return this.http
      .get<ApiResponse<ApiPassportRecord[]> | ApiPassportRecord[]>(this.apiUrl)
      .pipe(map((response) => this.unwrapArray<ApiPassportRecord>(response)));
  }

  create(payload: CreatePassportRecordRequest): Observable<boolean> {
    return this.http
      .post(this.apiUrl, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  update(id: number, payload: CreatePassportRecordRequest): Observable<boolean> {
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

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response.data ?? [];
  }
}
