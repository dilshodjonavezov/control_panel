import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface ApiCitizen {
  id: number;
  fullName: string;
  birthDate: string;
  gender: string;
  citizenship: string;
  fatherFullName: string | null;
  motherFullName: string | null;
  familyId?: number | null;
}

export interface ApiBorderCrossing {
  id: number;
  peopleId: number;
  peopleName: string | null;
  userId: number;
  userName: string | null;
  departureDate: string;
  returnDate: string | null;
  outsideBorder: boolean;
  country: string | null;
  description: string | null;
  eventType: string;
  direction: string;
  status: string;
  purpose: string | null;
  borderCheckpoint: string | null;
  transportType: string | null;
  documentNumber: string | null;
}

export interface CreateBorderCrossingRequest {
  peopleId: number;
  userId: number;
  departureDate: string;
  returnDate: string | null;
  outsideBorder: boolean;
  country: string;
  description: string | null;
  documentNumber?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BorderCrossingService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/border-crossings`;
  private readonly citizensApiUrl = `${environment.apiBaseUrl}/api/citizens`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiBorderCrossing[]> {
    return this.http
      .get<ApiResponse<ApiBorderCrossing[]> | ApiBorderCrossing[]>(this.apiUrl)
      .pipe(map((response) => this.unwrapArray<ApiBorderCrossing>(response)));
  }

  getById(id: number): Observable<ApiBorderCrossing | null> {
    return this.http
      .get<ApiResponse<ApiBorderCrossing> | ApiBorderCrossing>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.unwrapOne<ApiBorderCrossing>(response)));
  }

  create(payload: CreateBorderCrossingRequest): Observable<ApiBorderCrossing | null> {
    return this.http
      .post<ApiResponse<ApiBorderCrossing> | ApiBorderCrossing>(this.apiUrl, payload)
      .pipe(map((response) => this.unwrapOne<ApiBorderCrossing>(response)));
  }

  update(id: number, payload: CreateBorderCrossingRequest): Observable<ApiBorderCrossing | null> {
    return this.http
      .put<ApiResponse<ApiBorderCrossing> | ApiBorderCrossing>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => this.unwrapOne<ApiBorderCrossing>(response)));
  }

  delete(id: number): Observable<boolean> {
    return this.http
      .delete(`${this.apiUrl}/${id}`, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
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

  private unwrapOne<T>(response: ApiResponse<T> | T): T | null {
    if (this.isApiWrapper<T>(response)) {
      return response.data ?? null;
    }
    return response ?? null;
  }

  private isApiWrapper<T>(value: unknown): value is ApiResponse<T> {
    return !!value && typeof value === 'object' && 'data' in value;
  }
}
