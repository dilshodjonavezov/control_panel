import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, AuthUser, LoginApiResponse } from '../../../services/auth.service';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  SelectOption,
} from '../../../shared/components';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, CardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private readonly adminUsernameMarker = 'admin';
  private readonly adminPasswordMarker = 'password';

  email = '';
  password = '';
  role = 'student';
  roleLocked = false;
  routeRole: string | null = null;
  isSubmitting = false;
  isLoadingUsers = false;
  submitError = '';
  private users: AuthUser[] = [];

  roleOptions: SelectOption[] = [
    { value: 'admin', label: 'Админ Системы' },
    { value: 'maternity', label: 'ГКБ Роддом' },
    { value: 'zags', label: 'ЗАГС Центральный' },
    { value: 'jek', label: 'ЖЭК Центральный' },
    { value: 'passport', label: 'Паспортный стол Центральный' },
    { value: 'school', label: 'Школа №21' },
    { value: 'university', label: 'Колледж №3' },
    { value: 'clinic', label: 'Поликлиника №1' },
    { value: 'vvk', label: 'ВВК Центральная' },
    { value: 'border', label: 'Пограничная служба' },
    { value: 'superadmin', label: 'Суперадмин Системы' },
  ];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    const roleFromRoute = this.route.snapshot.data['role'] as string | undefined;
    if (roleFromRoute) {
      this.routeRole = roleFromRoute;
      this.role = roleFromRoute;
      this.roleLocked = true;
    }

    this.loadUsers();
  }

  submit(): void {
    const username = this.resolveLoginUsername();
    if (!username || !this.password.trim()) {
      this.submitError = 'Введите логин и пароль.';
      return;
    }

    this.submitError = '';
    this.isSubmitting = true;

    this.authService
      .login({ username, password: this.password })
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
            this.submitError = 'Токен не получен от сервера.';
            return;
          }

          this.authService.saveToken(token);
          this.authService.saveCurrentUsername(username);
          this.applyRoleAfterLogin(username);
          this.navigateByRole();
        },
        error: (error: HttpErrorResponse) => {
          this.submitError = this.resolveHttpError(error);
        },
      });
  }

  canSelectRole(): boolean {
    return (
      this.email.trim().toLowerCase() === this.adminUsernameMarker &&
      this.password.trim().toLowerCase() === this.adminPasswordMarker
    );
  }

  onRoleChange(role: string): void {
    this.role = role;
    this.syncUsernameWithRole();
  }

  private loadUsers(): void {
    this.isLoadingUsers = true;

    this.authService
      .getUsers()
      .pipe(
        finalize(() => {
          this.isLoadingUsers = false;
        }),
      )
      .subscribe({
        next: (users) => {
          this.users = users;
          this.syncUsernameWithRole();
        },
        error: () => {
          this.users = [];
        },
      });
  }

  private syncUsernameWithRole(): void {
    const username = this.getUsernameForRole(this.role);
    if (username) {
      this.email = username;
    }
  }

  private resolveLoginUsername(): string {
    return this.getUsernameForRole(this.role) ?? this.email.trim();
  }

  private applyRoleAfterLogin(username: string): void {
    if (this.routeRole) {
      this.role = this.routeRole;
      return;
    }

    if (this.role !== 'student') {
      return;
    }

    const detectedRole = this.detectRoleByUser(username);
    if (detectedRole) {
      this.role = detectedRole;
    }
  }

  private detectRoleByUser(username: string): string | null {
    const normalizedUsername = username.trim().toLowerCase();
    const matchedUser = this.users.find(
      (user) => user.username.trim().toLowerCase() === normalizedUsername,
    );
    if (matchedUser) {
      return this.mapRoleIdToRole(matchedUser.roleId);
    }

    return this.detectRoleByUsernameFallback(normalizedUsername);
  }

  private getUsernameForRole(role: string): string | null {
    const roleId = this.mapRoleToRoleId(role);
    if (roleId !== null) {
      const userByRoleId = this.users.find(
        (user) => user.roleId === roleId && !!user.username?.trim(),
      );
      if (userByRoleId) {
        return userByRoleId.username.trim();
      }
    }

    const userByFallbackRole = this.users.find(
      (user) => this.detectRoleByUsernameFallback(user.username) === role,
    );
    return userByFallbackRole?.username.trim() ?? null;
  }

  private mapRoleToRoleId(role: string): number | null {
    const roleToId: Record<string, number> = {
      admin: 1,
      maternity: 2,
      zags: 3,
      jek: 4,
      passport: 5,
      school: 6,
      university: 7,
      clinic: 8,
      vvk: 9,
      border: 10,
    };

    return roleToId[role] ?? null;
  }

  private mapRoleIdToRole(roleId: number | null): string | null {
    const idToRole: Record<number, string> = {
      1: 'admin',
      2: 'maternity',
      3: 'zags',
      4: 'jek',
      5: 'passport',
      6: 'school',
      7: 'university',
      8: 'clinic',
      9: 'vvk',
      10: 'border',
    };

    if (roleId === null) {
      return null;
    }

    return idToRole[roleId] ?? null;
  }

  private detectRoleByUsernameFallback(username: string): string | null {
    const value = username.trim().toLowerCase();
    const roleByUsername: Record<string, string> = {
      admin: 'admin',
      maternity: 'maternity',
      zagsemployee: 'zags',
      jek: 'jek',
      passportofficer: 'passport',
      school: 'school',
      highereducation: 'university',
      medicalcenter: 'clinic',
      militaryofficer: 'vvk',
      borderservice: 'border',
      borderservice2: 'border',
    };

    return roleByUsername[value] ?? null;
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

  private navigateByRole(): void {
    if (this.role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    if (this.role === 'teacher') {
      this.router.navigate(['/teacher/dashboard']);
      return;
    }
    if (this.role === 'maternity') {
      this.router.navigate(['/maternity/birth-records']);
      return;
    }
    if (this.role === 'zags') {
      this.router.navigate(['/zags/acts']);
      return;
    }
    if (this.role === 'jek') {
      this.router.navigate(['/jek/registry']);
      return;
    }
    if (this.role === 'passport') {
      this.router.navigate(['/passport/registry']);
      return;
    }
    if (this.role === 'school') {
      this.router.navigate(['/school/studies']);
      return;
    }
    if (this.role === 'university') {
      this.router.navigate(['/university/studies']);
      return;
    }
    if (this.role === 'clinic') {
      this.router.navigate(['/clinic/records']);
      return;
    }
    if (this.role === 'vvk') {
      this.router.navigate(['/vvk/queue']);
      return;
    }
    if (this.role === 'border') {
      this.router.navigate(['/border/crossings']);
      return;
    }
    if (this.role === 'superadmin') {
      this.router.navigate(['/superadmin/access']);
      return;
    }

    this.router.navigate(['/student/dashboard']);
  }
}
