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

export interface ApiVvkResult {
  id: number;
  citizenId: number;
  peopleId: number;
  peopleFullName: string | null;
  userId: number;
  userName: string | null;
  organizationId: number | null;
  medicalVisitId: number | null;
  examDate: string;
  category: string;
  queueStatus: string;
  fitnessCategory: string | null;
  finalDecision: string | null;
  reason: string | null;
  notes: string | null;
  nextReviewDate: string | null;
}

@Injectable({ providedIn: 'root' })
export class VvkResultsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/vvk-results`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiVvkResult[]> {
    return this.http
      .get<ApiResponse<ApiVvkResult[]> | ApiVvkResult[]>(this.apiUrl)
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
