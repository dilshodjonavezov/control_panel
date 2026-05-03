import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import {
  CardComponent,
  TableComponent,
  TableColumn,
  ButtonComponent,
  ModalComponent,
  InputComponent,
  SelectComponent,
  SelectOption,
} from '../../../shared/components';
import {
  AuthService,
  type AuthRole,
  type AuthUser,
  type CreateAuthUserRequest,
  type UpdateAuthUserRequest,
} from '../../../services/auth.service';

interface UserItem {
  id: number;
  fullName: string;
  username: string;
  email: string;
  roleCode: string;
  roleName: string;
  isActive: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    TableComponent,
    ButtonComponent,
    ModalComponent,
    InputComponent,
    SelectComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  showModal = false;
  editing: UserItem | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  formErrorMessage = '';

  private roles: AuthRole[] = [];

  formData = {
    fullName: '',
    username: '',
    password: '',
    email: '',
    roleId: '',
  };

  roleOptions: SelectOption[] = [];

  columns: TableColumn[] = [
    { key: 'fullName', label: 'ФИО', sortable: true },
    { key: 'username', label: 'Логин', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'roleName', label: 'Роль', sortable: true },
    { key: 'isActive', label: 'Статус', sortable: true },
  ];

  users: UserItem[] = [];

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      users: this.authService.getUsers(),
      roles: this.authService.getRoles(),
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: ({ users, roles }) => {
          this.roles = roles.filter((role) => role.isActive !== false && role.code !== 'superadmin');
          this.roleOptions = this.roles.map((role) => ({
            value: role.id,
            label: role.name,
          }));
          this.users = users.map((user) => this.mapUser(user));
        },
        error: () => {
          this.users = [];
          this.roleOptions = [];
          this.errorMessage = 'Не удалось загрузить пользователей.';
        },
      });
  }

  openAdd(): void {
    this.editing = null;
    this.formErrorMessage = '';
    this.formData = {
      fullName: '',
      username: '',
      password: '',
      email: '',
      roleId: this.roleOptions[0]?.value?.toString() ?? '',
    };
    this.showModal = true;
  }

  openEdit(user: UserItem): void {
    const matchedRole = this.roles.find((role) => role.code === user.roleCode);
    this.editing = user;
    this.formErrorMessage = '';
    this.formData = {
      fullName: user.fullName,
      username: user.username,
      password: '',
      email: user.email,
      roleId: matchedRole?.id?.toString() ?? '',
    };
    this.showModal = true;
  }

  closeModal(): void {
    if (this.isSaving) {
      return;
    }
    this.showModal = false;
    this.editing = null;
    this.formErrorMessage = '';
  }

  save(): void {
    const roleId = Number(this.formData.roleId);
    if (!this.formData.fullName.trim()) {
      this.formErrorMessage = 'Укажите ФИО.';
      return;
    }
    if (!this.formData.username.trim()) {
      this.formErrorMessage = 'Укажите логин.';
      return;
    }
    if (!Number.isInteger(roleId) || roleId <= 0) {
      this.formErrorMessage = 'Выберите роль.';
      return;
    }
    if (!this.editing && this.formData.password.trim().length < 4) {
      this.formErrorMessage = 'Пароль должен быть не короче 4 символов.';
      return;
    }

    this.isSaving = true;
    this.formErrorMessage = '';

    const basePayload = {
      fullName: this.formData.fullName.trim(),
      username: this.formData.username.trim(),
      email: this.formData.email.trim() || null,
      roleId,
    };

    const updatePayload: UpdateAuthUserRequest = {
      ...basePayload,
      ...(this.formData.password.trim() ? { password: this.formData.password.trim() } : {}),
    };
    const createPayload: CreateAuthUserRequest = {
      ...basePayload,
      password: this.formData.password.trim(),
      isActive: true,
    };

    const request$ = this.editing
      ? this.authService.updateUser(this.editing.id, updatePayload)
      : this.authService.createUser(createPayload);

    request$
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
        error: () => {
          this.formErrorMessage = this.editing
            ? 'Не удалось обновить пользователя.'
            : 'Не удалось создать пользователя.';
        },
      });
  }

  toggleStatus(user: UserItem): void {
    this.authService
      .updateUser(user.id, { isActive: !user.isActive })
      .subscribe({
        next: () => {
          this.users = this.users.map((item) =>
            item.id === user.id ? { ...item, isActive: !item.isActive } : item,
          );
        },
        error: () => {
          this.errorMessage = 'Не удалось изменить статус пользователя.';
        },
      });
  }

  getRoleLabel(roleCode: string): string {
    return this.roles.find((role) => role.code === roleCode)?.name ?? roleCode;
  }

  private mapUser(user: AuthUser): UserItem {
    return {
      id: user.id,
      fullName: user.fullName?.trim() || `ID ${user.id}`,
      username: user.username,
      email: user.email?.trim() || '—',
      roleCode: user.roleCode?.trim() || 'unknown',
      roleName: user.roleCode?.trim() === 'superadmin'
        ? 'Военкомат'
        : user.roleName?.trim() || this.getRoleLabel(user.roleCode?.trim() || 'unknown'),
      isActive: user.isActive !== false,
    };
  }
}
