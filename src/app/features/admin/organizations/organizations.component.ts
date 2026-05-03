import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  ModalComponent,
  SelectComponent,
  SelectOption,
  TableColumn,
  TableComponent,
} from '../../../shared/components';
import { AuthRole, AuthService, AuthUser, CreateAuthUserRequest, UpdateAuthUserRequest } from '../../../services/auth.service';
import { CreateEducationInstitutionRequest, EducationInstitutionsService } from '../../../services/education-institutions.service';
import {
  CreateOrganizationRequest,
  OrganizationRecord,
  OrganizationsService,
  UpdateOrganizationRequest,
} from '../../../services/organizations.service';

interface OrganizationTableItem {
  id: number;
  name: string;
  type: string;
  city: string;
  phone: string;
  headFullName: string;
  login: string;
  statusLabel: string;
  isActive: boolean;
  organization: OrganizationRecord;
  linkedUser: AuthUser | null;
}

type InstitutionType = 'SCHOOL' | 'COLLEGE' | 'INSTITUTE' | 'UNIVERSITY' | 'CLINIC';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, SelectComponent],
  templateUrl: './organizations.component.html',
  styleUrl: './organizations.component.css',
})
export class OrganizationsComponent implements OnInit {
  showModal = false;
  editing: OrganizationTableItem | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  formErrorMessage = '';

  private roles: AuthRole[] = [];
  private users: AuthUser[] = [];

  readonly typeOptions: SelectOption[] = [
    { value: 'SCHOOL', label: 'Школа' },
    { value: 'COLLEGE', label: 'Колледж' },
    { value: 'INSTITUTE', label: 'Институт' },
    { value: 'UNIVERSITY', label: 'Университет' },
    { value: 'CLINIC', label: 'Поликлиника' },
  ];

  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Учреждение', sortable: true },
    { key: 'type', label: 'Тип', sortable: true },
    { key: 'city', label: 'Город', sortable: true },
    { key: 'phone', label: 'Телефон', sortable: false },
    { key: 'headFullName', label: 'Руководитель', sortable: true },
    { key: 'login', label: 'Логин', sortable: true },
    { key: 'statusLabel', label: 'Статус', sortable: true },
  ];

  organizations: OrganizationTableItem[] = [];

  formData = this.createEmptyForm();

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly authService: AuthService,
    private readonly educationInstitutionsService: EducationInstitutionsService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      organizations: this.organizationsService.getOrganizations(),
      users: this.authService.getUsers(),
      roles: this.authService.getRoles(),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ organizations, users, roles }) => {
          this.roles = roles.filter((role) => role.isActive !== false);
          this.users = users;
          this.organizations = organizations
            .filter((organization) => this.isInstitutionType(organization.type))
            .map((organization) => this.mapOrganizationRow(organization, users))
            .sort((left, right) => left.name.localeCompare(right.name, 'ru'));
        },
        error: () => {
          this.organizations = [];
          this.errorMessage = 'Не удалось загрузить учреждения.';
        },
      });
  }

  openAdd(): void {
    this.editing = null;
    this.formErrorMessage = '';
    this.formData = this.createEmptyForm();
    this.showModal = true;
  }

  openEdit(item: OrganizationTableItem): void {
    this.editing = item;
    this.formErrorMessage = '';
    this.formData = {
      type: this.isInstitutionType(item.organization.type) ? item.organization.type : 'SCHOOL',
      name: item.organization.name ?? '',
      city: item.organization.city ?? '',
      addressText: item.organization.addressText ?? '',
      phone: item.organization.phone ?? '',
      email: item.organization.email ?? '',
      headFullName: item.organization.headFullName ?? '',
      serviceArea: item.organization.serviceArea ?? '',
      licenseNumber: item.organization.licenseNumber ?? '',
      capacity: item.organization.capacity != null ? String(item.organization.capacity) : '',
      username: item.linkedUser?.username ?? '',
      password: '',
      accountFullName: item.linkedUser?.fullName ?? item.organization.headFullName ?? '',
      isActive: item.organization.isActive !== false && item.linkedUser?.isActive !== false,
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
    const validationError = this.validateForm();
    if (validationError) {
      this.formErrorMessage = validationError;
      return;
    }

    const role = this.resolveRoleForType(this.formData.type);
    if (!role) {
      this.formErrorMessage = 'Для выбранного типа не найдена роль в системе.';
      return;
    }

    const organizationPayload = this.buildOrganizationPayload();
    const userPayload = this.buildUserPayload(role.id);
    const educationPayload = this.shouldCreateEducationInstitution() ? this.buildEducationInstitutionPayload() : null;

    this.isSaving = true;
    this.formErrorMessage = '';

    const request$ = this.resolveEducationInstitutionRequest(educationPayload).pipe(
      switchMap((educationInstitution) => {
        const organizationRequest = {
          ...organizationPayload,
          educationInstitutionId: educationInstitution?.id ?? null,
        };

        const organizationAction$ = this.editing
          ? this.organizationsService.updateOrganization(this.editing.id, organizationRequest)
          : this.organizationsService.createOrganization(organizationRequest);

        return organizationAction$.pipe(
          switchMap((organization) => {
            const linkedUser = this.editing?.linkedUser;
            if (linkedUser) {
              return this.authService.updateUser(linkedUser.id, {
                ...userPayload,
                organizationId: organization.id,
              } as UpdateAuthUserRequest);
            }

            return this.authService.createUser({
              ...(userPayload as CreateAuthUserRequest),
              password: this.formData.password.trim(),
              organizationId: organization.id,
              isActive: this.formData.isActive,
            });
          }),
        );
      }),
    );

    request$
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
        error: () => {
          this.formErrorMessage = this.editing
            ? 'Не удалось обновить учреждение и его учётку.'
            : 'Не удалось создать учреждение и его учётку.';
        },
      });
  }

  toggleStatus(item: OrganizationTableItem): void {
    const nextStatus = !item.isActive;
    const organizationPayload: UpdateOrganizationRequest = { isActive: nextStatus };
    const updateUserPayload: UpdateAuthUserRequest = { isActive: nextStatus };

    this.organizationsService
      .updateOrganization(item.id, organizationPayload)
      .pipe(
        switchMap(() => {
          if (!item.linkedUser) {
            return of(null);
          }

          return this.authService.updateUser(item.linkedUser.id, updateUserPayload);
        }),
      )
      .subscribe({
        next: () => {
          this.loadData();
        },
        error: () => {
          this.errorMessage = 'Не удалось изменить статус учреждения.';
        },
      });
  }

  onTypeChange(value: string | number | null): void {
    if (!value || !this.isInstitutionType(String(value))) {
      return;
    }

    this.formData.type = String(value) as InstitutionType;
    if (this.formData.accountFullName.trim() === '') {
      this.formData.accountFullName = this.getDefaultAccountName(this.formData.name, String(value));
    }
  }

  getTypeLabel(type: string): string {
    return this.typeOptions.find((option) => option.value === type)?.label ?? type;
  }

  getHeadLabel(): string {
    switch (this.formData.type) {
      case 'SCHOOL':
        return 'Директор школы';
      case 'CLINIC':
        return 'Главный врач';
      case 'COLLEGE':
        return 'Директор колледжа';
      case 'INSTITUTE':
        return 'Ректор или директор института';
      case 'UNIVERSITY':
        return 'Ректор университета';
      default:
        return 'Руководитель';
    }
  }

  getHeadHint(): string {
    return 'Главное ответственное лицо учреждения.';
  }

  shouldShowLicenseField(): boolean {
    return this.formData.type === 'COLLEGE' || this.formData.type === 'INSTITUTE' || this.formData.type === 'UNIVERSITY';
  }

  shouldShowCapacityField(): boolean {
    return this.formData.type === 'SCHOOL' || this.formData.type === 'COLLEGE' || this.formData.type === 'INSTITUTE' || this.formData.type === 'UNIVERSITY';
  }

  shouldShowServiceAreaField(): boolean {
    return this.formData.type === 'CLINIC';
  }

  private mapOrganizationRow(organization: OrganizationRecord, users: AuthUser[]): OrganizationTableItem {
    const linkedUser = users.find((user) => user.organizationId === organization.id) ?? null;
    const isActive = organization.isActive !== false && linkedUser?.isActive !== false;

    return {
      id: organization.id,
      name: organization.name,
      type: this.getTypeLabel(organization.type),
      city: organization.city?.trim() || '—',
      phone: organization.phone?.trim() || '—',
      headFullName: organization.headFullName?.trim() || '—',
      login: linkedUser?.username?.trim() || '—',
      statusLabel: isActive ? 'Активно' : 'Отключено',
      isActive,
      organization,
      linkedUser,
    };
  }

  private resolveRoleForType(type: string): AuthRole | null {
    const roleCode =
      type === 'SCHOOL'
        ? 'school'
        : type === 'CLINIC'
          ? 'clinic'
          : type === 'COLLEGE' || type === 'INSTITUTE' || type === 'UNIVERSITY'
            ? 'university'
            : null;

    if (!roleCode) {
      return null;
    }

    return this.roles.find((role) => role.code === roleCode) ?? null;
  }

  private buildOrganizationPayload(): CreateOrganizationRequest {
    const type = this.formData.type as InstitutionType;
    return {
      type,
      code: this.editing?.organization.code ?? this.generateCode(type, this.formData.name, this.formData.city),
      name: this.formData.name.trim(),
      city: this.nullable(this.formData.city),
      addressText: this.nullable(this.formData.addressText),
      phone: this.nullable(this.formData.phone),
      email: this.nullable(this.formData.email),
      headFullName: this.nullable(this.formData.headFullName),
      headPosition: this.getHeadLabel(),
      serviceArea: this.shouldShowServiceAreaField() ? this.nullable(this.formData.serviceArea) : null,
      licenseNumber: this.shouldShowLicenseField() ? this.nullable(this.formData.licenseNumber) : null,
      capacity: this.shouldShowCapacityField() && this.formData.capacity.trim() ? Number(this.formData.capacity) : null,
      isActive: this.formData.isActive,
    };
  }

  private buildEducationInstitutionPayload(): CreateEducationInstitutionRequest {
    return {
      name: this.formData.name.trim(),
      type: this.formData.type.trim(),
      address: this.formData.addressText.trim(),
      description: this.formData.email.trim() || this.formData.phone.trim() || '',
    };
  }

  private buildUserPayload(roleId: number): CreateAuthUserRequest | UpdateAuthUserRequest {
    return {
      username: this.formData.username.trim(),
      fullName: this.formData.accountFullName.trim(),
      email: this.nullable(this.formData.email),
      phone: this.nullable(this.formData.phone),
      roleId,
      isActive: this.formData.isActive,
    };
  }

  private validateForm(): string | null {
    if (!this.formData.name.trim()) {
      return 'Укажите название учреждения.';
    }
    if (!this.formData.city.trim()) {
      return 'Укажите город.';
    }
    if (!this.formData.phone.trim()) {
      return 'Укажите телефон.';
    }
    if (!this.formData.headFullName.trim()) {
      return 'Укажите руководителя учреждения.';
    }
    if (!this.formData.username.trim()) {
      return 'Укажите логин для входа.';
    }
    if (!this.editing && this.formData.password.trim().length < 4) {
      return 'Пароль должен быть не короче 4 символов.';
    }
    if (!this.formData.accountFullName.trim()) {
      return 'Укажите ФИО ответственного пользователя.';
    }
    if (this.shouldShowCapacityField() && this.formData.capacity.trim() && Number.isNaN(Number(this.formData.capacity))) {
      return 'Количество мест должно быть числом.';
    }

    return null;
  }

  private createEmptyForm() {
    return {
      type: 'SCHOOL' as InstitutionType,
      name: '',
      city: '',
      addressText: '',
      phone: '',
      email: '',
      headFullName: '',
      serviceArea: '',
      licenseNumber: '',
      capacity: '',
      username: '',
      password: '',
      accountFullName: '',
      isActive: true,
    };
  }

  private getDefaultAccountName(organizationName: string, type: string): string {
    const label = this.getTypeLabel(type);
    return organizationName.trim() ? `Оператор ${organizationName.trim()}` : `Оператор ${label}`;
  }

  private generateCode(type: string, name: string, city: string): string {
    const slug = `${type}-${name}-${city}`
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    return slug || `${type.toLowerCase()}-${Date.now()}`;
  }

  private nullable(value: string): string | null {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private isInstitutionType(value: string): value is InstitutionType {
    return value === 'SCHOOL' || value === 'COLLEGE' || value === 'INSTITUTE' || value === 'UNIVERSITY' || value === 'CLINIC';
  }

  private shouldCreateEducationInstitution(): boolean {
    return this.formData.type === 'SCHOOL' || this.formData.type === 'COLLEGE' || this.formData.type === 'INSTITUTE' || this.formData.type === 'UNIVERSITY';
  }

  private resolveEducationInstitutionRequest(payload: CreateEducationInstitutionRequest | null) {
    if (!payload) {
      return of<{ id?: number } | null>(null);
    }

    const linkedEducationInstitutionId = this.editing?.organization.educationInstitutionId ?? null;
    if (linkedEducationInstitutionId) {
      return this.educationInstitutionsService.updateRecord(linkedEducationInstitutionId, payload);
    }

    return this.educationInstitutionsService.createRecord(payload);
  }
}
