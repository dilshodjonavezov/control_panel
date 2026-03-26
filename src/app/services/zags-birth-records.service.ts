import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiZagsBirthRecord {
  id: number;
  peopleId: number;
  peopleFullName: string | null;
  userId: number;
  userName: string | null;
  actNumber: string | null;
  birthDate: string | null;
  registrationDate: string | null;
  placeOfRegistration: string | null;
  birthPlace: string | null;
  fatherFullName: string | null;
  motherFullName: string | null;
  status: string | null;
}

export interface CreateZagsBirthRecordRequest {
  peopleId: number;
  userId: number;
  actNumber: string;
  registrationDate: string | null;
  birthDate: string | null;
  placeOfRegistration: string;
  birthPlace: string;
  fatherFullName: string;
  motherFullName: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ZagsBirthRecordsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/zags-birth-records`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiZagsBirthRecord[]> {
    return this.http
      .get<ApiResponse<ApiZagsBirthRecord[]> | ApiZagsBirthRecord[]>(this.apiUrl)
      .pipe(map((response) => this.unwrapArray<ApiZagsBirthRecord>(response)));
  }

  create(payload: CreateZagsBirthRecordRequest): Observable<boolean> {
    return this.http
      .post(this.apiUrl, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  update(id: number, payload: CreateZagsBirthRecordRequest): Observable<boolean> {
    return this.http
      .put(`${this.apiUrl}/${id}`, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  delete(id: number): Observable<boolean> {
    return this.http
      .delete(`${this.apiUrl}/${id}`, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response.data ?? [];
  }
}
