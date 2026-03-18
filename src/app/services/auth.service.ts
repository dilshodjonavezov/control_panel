import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginApiResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface AuthUser {
  id: number;
  fullName: string | null;
  username: string;
  email: string | null;
  roleId: number | null;
  lastLogin: string | null;
}

export interface LoginResult {
  token: string | null;
  raw: LoginApiResponse;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Auth`;
  private readonly usersApiUrl = `${environment.apiBaseUrl}/api/users`;
  private readonly tokenStorageKey = 'auth_token';

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResult> {
    return this.http.post<LoginApiResponse>(`${this.apiUrl}/login`, payload).pipe(
      map((response) => ({
        token: this.extractToken(response),
        raw: response,
      })),
    );
  }

  getUsers(): Observable<AuthUser[]> {
    return this.http
      .get<ApiResponse<AuthUser[]> | AuthUser[]>(this.usersApiUrl)
      .pipe(map((response) => this.unwrapArray<AuthUser>(response)));
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenStorageKey);
  }

  private unwrapArray<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response.data ?? [];
  }

  private extractToken(response: LoginApiResponse): string | null {
    const directToken = this.extractTokenFromUnknown(response);
    if (directToken) {
      return directToken;
    }

    return this.extractTokenFromUnknown(response.data);
  }

  private extractTokenFromUnknown(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value.trim() ? value : null;
    }

    if (typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const candidates: unknown[] = [
      record['token'],
      record['accessToken'],
      record['jwt'],
      record['result'],
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }

    const nestedKeys = ['data', 'token'];
    for (const key of nestedKeys) {
      const nestedToken = this.extractTokenFromUnknown(record[key]);
      if (nestedToken) {
        return nestedToken;
      }
    }

    return null;
  }
}
