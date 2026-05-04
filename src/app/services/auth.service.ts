import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginApiResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
  user?: unknown;
  accessToken?: string;
  token?: string;
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
  roleCode?: string | null;
  roleName?: string | null;
  organizationId?: number | null;
  organizationName?: string | null;
  isActive?: boolean;
  lastLogin: string | null;
}

export interface AuthRole {
  id: number;
  code: string;
  name: string;
  isActive?: boolean;
}

export interface CreateAuthUserRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  roleId: number;
  organizationId?: number | null;
  isActive?: boolean;
}

export interface UpdateAuthUserRequest {
  username?: string;
  password?: string;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  roleId?: number;
  organizationId?: number | null;
  isActive?: boolean;
}

export interface LoginResult {
  token: string | null;
  raw: LoginApiResponse;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth`;
  private readonly usersApiUrl = `${environment.apiBaseUrl}/api/users`;
  private readonly rolesApiUrl = `${environment.apiBaseUrl}/api/roles`;
  private readonly tokenStorageKey = 'auth_token';
  private readonly usernameStorageKey = 'auth_username';
  private readonly userStorageKey = 'auth_user';
  private readonly impersonatedUserIdStorageKey = 'auth_impersonated_user_id';

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
      .pipe(timeout(10000), map((response) => this.unwrapArray<AuthUser>(response)), catchError(() => of([])));
  }

  getRoles(): Observable<AuthRole[]> {
    return this.http
      .get<ApiResponse<AuthRole[]> | AuthRole[]>(this.rolesApiUrl)
      .pipe(timeout(10000), map((response) => this.unwrapArray<AuthRole>(response)), catchError(() => of([])));
  }

  createUser(payload: CreateAuthUserRequest): Observable<AuthUser> {
    return this.http
      .post<ApiResponse<AuthUser> | AuthUser>(this.usersApiUrl, payload)
      .pipe(map((response) => this.unwrapItem<AuthUser>(response)));
  }

  updateUser(id: number, payload: UpdateAuthUserRequest): Observable<AuthUser> {
    return this.http
      .patch<ApiResponse<AuthUser> | AuthUser>(`${this.usersApiUrl}/${id}`, payload)
      .pipe(map((response) => this.unwrapItem<AuthUser>(response)));
  }

  deleteUser(id: number): Observable<boolean> {
    return this.http.delete(`${this.usersApiUrl}/${id}`, { observe: 'response', responseType: 'text' }).pipe(map((response) => response.ok));
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.usernameStorageKey);
    localStorage.removeItem(this.userStorageKey);
    localStorage.removeItem(this.impersonatedUserIdStorageKey);
  }

  saveCurrentUsername(username: string): void {
    if (!username.trim()) {
      return;
    }
    localStorage.setItem(this.usernameStorageKey, username.trim());
  }

  getCurrentUsername(): string | null {
    const currentUser = this.getCurrentUser();
    if (currentUser?.username?.trim()) {
      return currentUser.username.trim();
    }

    const value = localStorage.getItem(this.usernameStorageKey);
    return value?.trim() ? value.trim() : null;
  }

  saveCurrentUser(user: AuthUser): void {
    localStorage.setItem(this.userStorageKey, JSON.stringify(user));
    this.saveCurrentUsername(user.username);
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userStorageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as AuthUser;
      if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.username) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  hasActiveSession(): boolean {
    return !!this.getToken() || this.getImpersonatedUserId() !== null;
  }

  resolveStoredRole(): string | null {
    const currentUser = this.getCurrentUser();
    if (currentUser?.roleCode?.trim()) {
      return currentUser.roleCode.trim().toLowerCase();
    }

    const impersonatedUserId = this.getImpersonatedUserId();
    if (impersonatedUserId !== null) {
      return this.resolveRoleByUserId(impersonatedUserId);
    }

    const username = this.getCurrentUsername();
    if (!username) {
      return null;
    }

    return this.resolveRoleByUsername(username);
  }

  resolveCurrentUserId(username?: string | null): number | null {
    const currentUser = this.getCurrentUser();
    if (currentUser?.id) {
      return currentUser.id;
    }

    const value = (username ?? this.getCurrentUsername() ?? '').trim().toLowerCase();
    if (!value) {
      return null;
    }
    return null;
  }

  saveImpersonatedUserId(userId: number | null): void {
    if (!userId) {
      localStorage.removeItem(this.impersonatedUserIdStorageKey);
      return;
    }

    localStorage.setItem(this.impersonatedUserIdStorageKey, String(userId));
  }

  getImpersonatedUserId(): number | null {
    const value = localStorage.getItem(this.impersonatedUserIdStorageKey);
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private resolveRoleByUserId(userId: number): string | null {
    const roleByUserId: Record<number, string> = {
      1: 'admin',
      2: 'superadmin',
      3: 'maternity',
      4: 'zags',
      5: 'jek',
      6: 'passport',
      7: 'school',
      8: 'university',
      9: 'clinic',
      10: 'vvk',
      11: 'border',
    };

    return roleByUserId[userId] ?? null;
  }

  private resolveRoleByUsername(username: string): string | null {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      return null;
    }

    const roleByUsername: Record<string, string> = {
      voenkomat: 'admin',
      admin: 'superadmin',
      superadmin: 'superadmin',
      maternity: 'maternity',
      zags: 'zags',
      jek: 'jek',
      passport: 'passport',
      school: 'school',
      kolleg3: 'university',
      university: 'university',
      clinic: 'clinic',
      vvk: 'vvk',
      border: 'border',
      zagsemployee: 'zags',
      passportofficer: 'passport',
      highereducation: 'university',
      medicalcenter: 'clinic',
      militaryofficer: 'vvk',
      borderservice: 'border',
      borderservice2: 'border',
    };

    return roleByUsername[normalizedUsername] ?? null;
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
    const candidates: unknown[] = [record['token'], record['accessToken'], record['jwt'], record['result']];

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
