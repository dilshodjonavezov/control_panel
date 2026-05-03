import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiEducationInstitution {
  id: number;
  name: string | null;
  type: string | null;
  address: string | null;
  description: string | null;
}

export interface CreateEducationInstitutionRequest {
  name: string;
  type: string;
  address: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class EducationInstitutionsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/education-institutions`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiEducationInstitution[]> {
    return this.http
      .get<ApiResponse<ApiEducationInstitution[]>>(this.apiUrl)
      .pipe(map((response) => response.data ?? []));
  }

  getById(id: number): Observable<ApiEducationInstitution | null> {
    return this.http
      .get<ApiResponse<ApiEducationInstitution> | ApiEducationInstitution>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => {
          if (this.isApiWrapper<ApiEducationInstitution>(response)) {
            return response.data ?? null;
          }
          return response ?? null;
        })
      );
  }

  create(payload: CreateEducationInstitutionRequest): Observable<boolean> {
    return this.http
      .post(this.apiUrl, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  createRecord(payload: CreateEducationInstitutionRequest): Observable<ApiEducationInstitution> {
    return this.http
      .post<ApiResponse<ApiEducationInstitution> | ApiEducationInstitution>(this.apiUrl, payload)
      .pipe(
        map((response) => {
          if (this.isApiWrapper<ApiEducationInstitution>(response)) {
            return response.data;
          }
          return response;
        }),
      );
  }

  update(id: number, payload: CreateEducationInstitutionRequest): Observable<boolean> {
    return this.http
      .put(`${this.apiUrl}/${id}`, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  updateRecord(id: number, payload: CreateEducationInstitutionRequest): Observable<ApiEducationInstitution> {
    return this.http
      .put<ApiResponse<ApiEducationInstitution> | ApiEducationInstitution>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map((response) => {
          if (this.isApiWrapper<ApiEducationInstitution>(response)) {
            return response.data;
          }
          return response;
        }),
      );
  }

  delete(id: number): Observable<boolean> {
    return this.http
      .delete(`${this.apiUrl}/${id}`, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  private isApiWrapper<T>(value: unknown): value is ApiResponse<T> {
    return !!value && typeof value === 'object' && 'data' in value;
  }
}
