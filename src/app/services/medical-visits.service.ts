import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  value?: T;
}

export interface ApiMedicalVisit {
  id: number;
  citizenId: number;
  peopleId: number;
  peopleFullName: string | null;
  medicalRecordId: number | null;
  userId: number;
  userName: string | null;
  doctor: string;
  visitDate: string | null;
  diagnosis: string;
  notes: string | null;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class MedicalVisitsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/medical-visits`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiMedicalVisit[]> {
    return this.http
      .get<ApiResponse<ApiMedicalVisit[]> | ApiMedicalVisit[]>(this.apiUrl)
      .pipe(map((response) => this.unwrapArray(response)));
  }

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.value)) {
      return response.value;
    }
    return [];
  }
}
