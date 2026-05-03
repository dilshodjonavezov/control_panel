import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, LoginApiResponse, type AuthUser } from '../../../services/auth.service';
import { ButtonComponent, CardComponent, InputComponent } from '../../../shared/components';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, CardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  isSubmitting = false;
  submitError = '';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.restoreExistingSession();
  }

  submit(): void {
    const username = this.username.trim();
    const password = this.password.trim();

    if (!username || !password) {
      this.submitError = 'Введите логин и пароль.';
      return;
    }

    this.submitError = '';
    this.isSubmitting = true;

    this.authService
      .login({ username, password })
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: ({ token, raw }) => {
          if (raw.success === false) {
            this.submitError = this.getApiMessage(raw) ?? 'Неверный логин или пароль.';
            return;
          }

          if (!token) {
            this.submitError = 'Сервер не вернул токен авторизации.';
            return;
          }

          const currentUser = this.extractBackendUser(raw);
          const backendRole = this.extractBackendRole(raw);
          if (!currentUser || !backendRole) {
            this.submitError = 'Не удалось определить роль пользователя.';
            return;
          }

          this.authService.saveToken(token);
          this.authService.saveCurrentUser({
            ...currentUser,
            roleCode: backendRole,
          });
          this.authService.saveImpersonatedUserId(null);

          this.navigateByRole(backendRole);
        },
        error: (error: HttpErrorResponse) => {
          this.submitError = this.resolveHttpError(error);
        },
      });
  }

  onCredentialsChange(): void {
    this.submitError = '';
  }

  private extractBackendUser(response: LoginApiResponse): AuthUser | null {
    const directUser = this.normalizeAuthUser(response.user);
    if (directUser) {
      return directUser;
    }

    if (response.data && typeof response.data === 'object' && 'user' in (response.data as Record<string, unknown>)) {
      return this.normalizeAuthUser((response.data as Record<string, unknown>)['user']);
    }

    return this.normalizeAuthUser(response.data);
  }

  private normalizeAuthUser(value: unknown): AuthUser | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const id = Number(record['id']);
    const username = typeof record['username'] === 'string' ? record['username'].trim() : '';
    if (!Number.isInteger(id) || id <= 0 || !username) {
      return null;
    }

    return {
      id,
      username,
      fullName: typeof record['fullName'] === 'string' ? record['fullName'] : null,
      email: typeof record['email'] === 'string' ? record['email'] : null,
      roleId: typeof record['roleId'] === 'number' ? record['roleId'] : Number(record['roleId'] ?? null) || null,
      roleCode: typeof record['roleCode'] === 'string' ? record['roleCode'] : null,
      roleName: typeof record['roleName'] === 'string' ? record['roleName'] : null,
      organizationId:
        typeof record['organizationId'] === 'number' ? record['organizationId'] : Number(record['organizationId'] ?? null) || null,
      organizationName: typeof record['organizationName'] === 'string' ? record['organizationName'] : null,
      isActive: typeof record['isActive'] === 'boolean' ? record['isActive'] : true,
      lastLogin: typeof record['lastLoginAt'] === 'string' ? record['lastLoginAt'] : null,
    };
  }

  private extractBackendRole(response: LoginApiResponse): string | null {
    const userRole = this.extractRoleFromUnknown(response['user']);
    if (userRole) {
      return userRole;
    }

    const nestedRole = this.extractRoleFromUnknown(response['data']);
    if (nestedRole) {
      return nestedRole;
    }

    return this.extractRoleFromUnknown(response['roleCode']);
  }

  private extractRoleFromUnknown(value: unknown): string | null {
    if (!value || typeof value !== 'object') {
      if (typeof value === 'string' && value.trim()) {
        return value.trim().toLowerCase();
      }
      return null;
    }

    const record = value as Record<string, unknown>;
    const candidates: unknown[] = [record['roleCode'], record['role'], record['code']];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim().toLowerCase();
      }
    }

    return this.extractRoleFromUnknown(record['user']);
  }

  private getApiMessage(response: LoginApiResponse): string | null {
    const message = response['message'];
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return null;
  }

  private resolveHttpError(error: HttpErrorResponse): string {
    const errorPayload = error.error as Record<string, unknown> | string | null;
    if (errorPayload && typeof errorPayload === 'object') {
      const message = errorPayload['message'];
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    if (error.status === 0) {
      return 'Сервер недоступен. Проверьте подключение.';
    }

    if (typeof errorPayload === 'string' && errorPayload.trim()) {
      return errorPayload;
    }

    return 'Ошибка авторизации. Попробуйте еще раз.';
  }

  private navigateByRole(role: string): void {
    const roleRoutes: Record<string, string> = {
      admin: '/admin/dashboard',
      maternity: '/maternity/birth-records',
      zags: '/zags/acts',
      jek: '/jek/registry',
      passport: '/passport/registry',
      school: '/school/studies',
      university: '/university/studies',
      clinic: '/clinic/records',
      vvk: '/vvk/queue',
      border: '/border/crossings',
      superadmin: '/admin/dashboard',
    };

    void this.router.navigate([roleRoutes[role] ?? roleRoutes['admin']]);
  }

  private restoreExistingSession(): void {
    if (!this.authService.hasActiveSession()) {
      return;
    }

    const storedRole = this.authService.resolveStoredRole();
    if (!storedRole) {
      return;
    }

    this.navigateByRole(storedRole);
  }
}
