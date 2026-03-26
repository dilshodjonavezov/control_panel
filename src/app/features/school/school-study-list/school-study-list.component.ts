import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, TimeoutError, timeout } from 'rxjs';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  ModalComponent,
  TableComponent,
  TableColumn,
} from '../../../shared/components';
import {
  ApiSchoolRecord,
  CreateSchoolRecordRequest,
  SchoolRecordsService,
} from '../../../services/school-records.service';

interface SchoolRecordItem {
  id: number;
  peopleId: number;
  peopleFullName: string;
  institutionId: number;
  institutionName: string;
  classNumber: number;
  admissionDate: string;
  admissionDateRaw: string;
  graduationDate: string;
  graduationDateRaw: string;
  expulsionDate: string;
  expulsionDateRaw: string;
  isStudying: 'Да' | 'Нет';
  userId: number;
  userName: string;
  comment: string;
}

interface SchoolRecordForm {
  peopleId: string;
  institutionId: string;
  classNumber: string;
  admissionDate: string;
  graduationDate: string;
  expulsionDate: string;
  userId: string;
  comment: string;
}

@Component({
  selector: 'app-school-study-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, ButtonComponent, ModalComponent],
  templateUrl: './school-study-list.component.html',
  styleUrl: './school-study-list.component.css',
})
export class SchoolStudyListComponent implements OnInit {
  filters = {
    fullName: '',
    classNumber: '',
  };

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'peopleFullName', label: 'ФИО', sortable: true },
    { key: 'institutionName', label: 'Учреждение', sortable: true },
    { key: 'classNumber', label: 'Класс', sortable: true },
    { key: 'admissionDate', label: 'Поступление', sortable: true },
    { key: 'graduationDate', label: 'Окончание', sortable: true },
    { key: 'expulsionDate', label: 'Отчисление', sortable: true },
    { key: 'isStudying', label: 'Обучается', sortable: true },
    { key: 'userName', label: 'Пользователь', sortable: true },
    { key: 'comment', label: 'Комментарий', sortable: false },
  ];

  records: SchoolRecordItem[] = [];
  inferredInstitutionId: number | null = null;
  currentUserId: number | null = null;

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formData: SchoolRecordForm = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: SchoolRecordItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(
    private readonly schoolRecordsService: SchoolRecordsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.readUserIdFromToken();
    this.loadData();
  }

  get filteredRecords(): SchoolRecordItem[] {
    const byName = this.filters.fullName.trim().toLowerCase();
    const byClass = this.filters.classNumber.trim().toLowerCase();

    return this.records.filter((record) => {
      const matchesName = !byName || record.peopleFullName.toLowerCase().includes(byName);
      const matchesClass = !byClass || record.classNumber.toString().toLowerCase().includes(byClass);
      return matchesName && matchesClass;
    });
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Изменить запись обучения' : 'Добавить запись обучения';
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.schoolRecordsService
      .getAll()
      .pipe(timeout(15000))
      .subscribe({
        next: (records) => {
          this.records = records.map((record) => this.mapRecord(record));
          this.inferredInstitutionId = records.length ? records[0].institutionId : null;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.records = [];
          this.inferredInstitutionId = null;
          if (error instanceof TimeoutError) {
            this.errorMessage = 'Превышено время ожидания ответа API.';
          } else {
            this.errorMessage = 'Не удалось загрузить реестр школы.';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingRecordId = null;
    this.formData = this.createDefaultForm();
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  openEdit(row: SchoolRecordItem): void {
    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.formData = {
      peopleId: row.peopleId.toString(),
      institutionId: row.institutionId.toString(),
      classNumber: row.classNumber.toString(),
      admissionDate: row.admissionDateRaw,
      graduationDate: row.graduationDateRaw,
      expulsionDate: row.expulsionDateRaw,
      userId: row.userId.toString(),
      comment: row.comment === '-' ? '' : row.comment,
    };
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (this.isFormSubmitting) {
      return;
    }
    this.showFormModal = false;
  }

  saveForm(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.isFormSubmitting = true;
    this.formErrorMessage = '';

    const request$ =
      this.isEditMode && this.editingRecordId
        ? this.schoolRecordsService.update(this.editingRecordId, payload)
        : this.schoolRecordsService.create(payload);

    request$
      .pipe(
        finalize(() => {
          this.isFormSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (ok) => {
          if (!ok) {
            this.formErrorMessage = this.isEditMode
              ? 'Не удалось изменить запись.'
              : 'Не удалось создать запись.';
            return;
          }
          this.showFormModal = false;
          this.loadData();
        },
        error: () => {
          this.formErrorMessage = this.isEditMode
            ? 'Не удалось изменить запись.'
            : 'Не удалось создать запись.';
        },
      });
  }

  openDelete(row: SchoolRecordItem): void {
    this.deletingRecord = row;
    this.deleteErrorMessage = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) {
      return;
    }
    this.showDeleteModal = false;
    this.deletingRecord = null;
    this.deleteErrorMessage = '';
  }

  confirmDelete(): void {
    if (!this.deletingRecord || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.deleteErrorMessage = '';

    this.schoolRecordsService
      .delete(this.deletingRecord.id)
      .pipe(
        finalize(() => {
          this.isDeleting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (ok) => {
          if (!ok) {
            this.deleteErrorMessage = 'Не удалось удалить запись.';
            return;
          }
          this.showDeleteModal = false;
          this.deletingRecord = null;
          this.loadData();
        },
        error: () => {
          this.deleteErrorMessage = 'Не удалось удалить запись.';
        },
      });
  }

  private mapRecord(record: ApiSchoolRecord): SchoolRecordItem {
    return {
      id: record.id,
      peopleId: record.peopleId,
      peopleFullName: record.peopleFullName?.trim() || `ID ${record.peopleId}`,
      institutionId: record.institutionId,
      institutionName: record.institutionName?.trim() || `ID ${record.institutionId}`,
      classNumber: record.classNumber ?? 0,
      admissionDate: this.formatDateTime(record.admissionDate),
      admissionDateRaw: this.normalizeDateTimeInput(record.admissionDate),
      graduationDate: this.formatDateTime(record.graduationDate),
      graduationDateRaw: this.normalizeDateTimeInput(record.graduationDate),
      expulsionDate: this.formatDateTime(record.expulsionDate),
      expulsionDateRaw: this.normalizeDateTimeInput(record.expulsionDate),
      isStudying: record.isStudying ? 'Да' : 'Нет',
      userId: record.userId,
      userName: record.userName?.trim() || `ID ${record.userId}`,
      comment: record.comment?.trim() || '-',
    };
  }

  private buildPayload(): CreateSchoolRecordRequest | null {
    const peopleId = Number(this.formData.peopleId);
    const institutionId = Number(this.formData.institutionId);
    const classNumber = Number(this.formData.classNumber);
    const userId = Number(this.formData.userId);

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.formErrorMessage = 'Укажите корректный peopleId.';
      return null;
    }

    if (!Number.isInteger(institutionId) || institutionId <= 0) {
      this.formErrorMessage = 'Укажите корректный institutionId.';
      return null;
    }

    if (!Number.isInteger(classNumber) || classNumber <= 0) {
      this.formErrorMessage = 'Укажите корректный номер класса.';
      return null;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      this.formErrorMessage = 'Укажите корректный userId.';
      return null;
    }

    if (!this.formData.admissionDate) {
      this.formErrorMessage = 'Укажите дату поступления.';
      return null;
    }

    return {
      peopleId,
      institutionId,
      classNumber,
      admissionDate: this.toIsoDateTime(this.formData.admissionDate),
      graduationDate: this.formData.graduationDate ? this.toIsoDateTime(this.formData.graduationDate) : null,
      expulsionDate: this.formData.expulsionDate ? this.toIsoDateTime(this.formData.expulsionDate) : null,
      userId,
      comment: this.formData.comment.trim(),
    };
  }

  private createDefaultForm(): SchoolRecordForm {
    return {
      peopleId: '',
      institutionId: this.inferredInstitutionId ? this.inferredInstitutionId.toString() : '',
      classNumber: '',
      admissionDate: '',
      graduationDate: '',
      expulsionDate: '',
      userId: this.currentUserId ? this.currentUserId.toString() : '',
      comment: '',
    };
  }

  private readUserIdFromToken(): number | null {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const payload = JSON.parse(this.base64UrlDecode(parts[1])) as Record<string, unknown>;
      const claim = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      const userId = Number(claim);
      return Number.isInteger(userId) && userId > 0 ? userId : null;
    } catch {
      return null;
    }
  }

  private base64UrlDecode(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return atob(padded);
  }

  private normalizeDateTimeInput(value: string | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private toIsoDateTime(value: string): string {
    return new Date(value).toISOString();
  }

  private formatDateTime(value: string | null): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('ru-RU');
  }
}
