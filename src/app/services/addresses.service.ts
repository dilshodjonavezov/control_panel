import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiAddress {
  id: number;
  citizenId: number;
  citizenFullName: string | null;
  familyId: number | null;
  type: string;
  region: string;
  district: string | null;
  city: string | null;
  street: string;
  house: string;
  apartment: string | null;
  postalCode: string | null;
  fullAddress: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface CreateAddressRequest {
  citizenId: number;
  familyId?: number | null;
  type?: string;
  region: string;
  district?: string | null;
  city?: string | null;
  street: string;
  house: string;
  apartment?: string | null;
  postalCode?: string | null;
  startDate: string;
  endDate?: string | null;
  isActive?: boolean;
  notes?: string | null;
}

export interface ApiPerson {
  id: number;
  fullName: string | null;
}

export interface ApiCitizen {
  id: number;
  fullName: string;
  birthDate: string;
  gender: string;
  citizenship: string;
  lifeStatus: string;
  motherFullName: string | null;
  motherCitizenId?: number | null;
  fatherFullName: string | null;
  fatherCitizenId?: number | null;
  familyId?: number | null;
  militaryRegisteredAtBirth?: boolean;
}

export interface ApiFamily {
  id: number;
  familyName: string;
  primaryCitizenId: number;
  primaryCitizenFullName: string | null;
  fatherCitizenId?: number | null;
  fatherFullName?: string | null;
  motherCitizenId?: number | null;
  motherFullName?: string | null;
  memberCitizenIds: number[];
  memberCount: number;
  childCitizenIds?: number[];
  childrenCount?: number;
  sonsCount?: number;
  daughtersCount?: number;
  militaryRegisteredChildCitizenIds?: number[];
  militaryRegisteredChildrenCount?: number;
  children?: Array<{
    id: number;
    fullName: string | null;
    gender: string | null;
    birthDate: string | null;
    familyId: number | null;
    militaryRegisteredAtBirth: boolean;
  }>;
  eligibleFatherForMilitaryExemption?: boolean;
  addressId: number | null;
  addressLabel: string | null;
  status: string;
  notes: string | null;
  createdAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AddressesService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/addresses`;
  private readonly peopleApiUrl = `${environment.apiBaseUrl}/api/people`;
  private readonly citizensApiUrl = `${environment.apiBaseUrl}/api/citizens`;
  private readonly familiesApiUrl = `${environment.apiBaseUrl}/api/families`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiAddress[]> {
    return this.http
      .get<ApiResponse<ApiAddress[]> | ApiAddress[]>(this.apiUrl)
      .pipe(timeout(10000), map((response) => this.unwrapArray<ApiAddress>(response)), catchError(() => of([])));
  }

  getByCitizenId(citizenId: number): Observable<ApiAddress[]> {
    return this.http
      .get<ApiResponse<ApiAddress[]> | ApiAddress[]>(`${this.apiUrl}?citizenId=${citizenId}`)
      .pipe(timeout(10000), map((response) => this.unwrapArray<ApiAddress>(response)), catchError(() => of([])));
  }

  create(payload: CreateAddressRequest): Observable<boolean> {
    return this.http
      .post(this.apiUrl, payload, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => response.ok));
  }

  update(id: number, payload: CreateAddressRequest): Observable<boolean> {
    return this.http
      .patch(`${this.apiUrl}/${id}`, payload, { observe: 'response', responseType: 'text' })
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

  getCitizens(): Observable<ApiCitizen[]> {
    return this.http
      .get<ApiResponse<ApiCitizen[]> | ApiCitizen[]>(this.citizensApiUrl)
      .pipe(map((response) => this.unwrapArray<ApiCitizen>(response)));
  }

  getFamilies(): Observable<ApiFamily[]> {
    return this.http
      .get<ApiResponse<ApiFamily[]> | ApiFamily[]>(this.familiesApiUrl)
      .pipe(map((response) => this.unwrapArray<ApiFamily>(response)));
  }

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response.data ?? [];
  }
}
