import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface OrganizationRecord {
  id: number;
  type: string;
  code: string;
  name: string;
  city?: string | null;
  addressText?: string | null;
  phone?: string | null;
  email?: string | null;
  headFullName?: string | null;
  headPosition?: string | null;
  serviceArea?: string | null;
  licenseNumber?: string | null;
  capacity?: number | null;
  educationInstitutionId?: number | null;
  isActive?: boolean;
}

export interface CreateOrganizationRequest {
  type: string;
  code: string;
  name: string;
  city?: string | null;
  addressText?: string | null;
  phone?: string | null;
  email?: string | null;
  headFullName?: string | null;
  headPosition?: string | null;
  serviceArea?: string | null;
  licenseNumber?: string | null;
  capacity?: number | null;
  educationInstitutionId?: number | null;
  isActive?: boolean;
}

export type UpdateOrganizationRequest = Partial<CreateOrganizationRequest>;

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/organizations`;

  constructor(private readonly http: HttpClient) {}

  getOrganizations(): Observable<OrganizationRecord[]> {
    return this.http
      .get<ApiResponse<OrganizationRecord[]> | OrganizationRecord[]>(this.apiUrl)
      .pipe(map((response) => this.unwrapArray(response)), catchError(() => of([])));
  }

  createOrganization(payload: CreateOrganizationRequest): Observable<OrganizationRecord> {
    return this.http
      .post<ApiResponse<OrganizationRecord> | OrganizationRecord>(this.apiUrl, payload)
      .pipe(map((response) => this.unwrapItem(response)));
  }

  updateOrganization(id: number, payload: UpdateOrganizationRequest): Observable<OrganizationRecord> {
    return this.http
      .patch<ApiResponse<OrganizationRecord> | OrganizationRecord>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => this.unwrapItem(response)));
  }

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response.data ?? [];
  }

  private unwrapItem<T>(response: ApiResponse<T> | T): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as ApiResponse<T>).data as T;
    }

    return response as T;
  }
}
