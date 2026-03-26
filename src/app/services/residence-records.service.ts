import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiResidenceRecord {
  id: number;
  peopleId: number;
  peopleFullName: string | null;
  address: string | null;
  registeredAt: string | null;
  unregisteredAt: string | null;
  isActive: boolean;
  userId: number;
  userName: string | null;
  comment: string | null;
}

export interface CreateResidenceRecordRequest {
  peopleId: number;
  address: string;
  registeredAt: string | null;
  unregisteredAt: string | null;
  userId: number;
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

@Injectable({ providedIn: 'root' })
export class ResidenceRecordsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/residence-records`;
  private readonly peopleApiUrl = `${environment.apiBaseUrl}/api/people`;
  private readonly usersApiUrl = `${environment.apiBaseUrl}/api/users`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResidenceRecord[]> {
    return this.http
      .get<ApiResponse<ApiResidenceRecord[]> | ApiResidenceRecord[]>(this.apiUrl)
      .pipe(map((response) => this.unwrapArray<ApiResidenceRecord>(response)));
  }

  create(payload: CreateResidenceRecordRequest): Observable<boolean> {
    return this.http
      .post(this.apiUrl, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  update(id: number, payload: CreateResidenceRecordRequest): Observable<boolean> {
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
