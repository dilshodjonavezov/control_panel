import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, TimeoutError, timeout } from 'rxjs';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  ModalComponent,
  SelectComponent,
  SelectOption,
  TableComponent,
  TableColumn,
} from '../../../shared/components';
import {
  ApiResidenceRecord,
  CreateResidenceRecordRequest,
  ResidenceRecordsService,
} from '../../../services/residence-records.service';

interface ResidenceRecordItem {
  id: number;
  peopleId: number;
  peopleFullName: string;
  address: string;
  registeredAt: string;
  registeredAtRaw: string;
  unregisteredAt: string;
  unregisteredAtRaw: string;
  isActive: 'Активна' | 'Не активна';
  userId: number;
  userName: string;
  comment: string;
}

interface ResidenceForm {
  peopleId: string;
  address: string;
  registeredAt: string;
  unregisteredAt: string;
  userId: string;
  comment: string;
}

@Component({
  selector: 'app-jek-registry',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, TableComponent, ButtonComponent, ModalComponent],
  templateUrl: './jek-registry.component.html',
  styleUrl: './jek-registry.component.css',
})
export class JekRegistryComponent implements OnInit {
  filters = {
    fullName: '',
    address: '',
    active: 'all',
  };

  activeOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активна' },
    { value: 'inactive', label: 'Не активна' },
  ];

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'peopleFullName', label: 'ФИО', sortable: true },
    { key: 'address', label: 'Адрес', sortable: true },
    { key: 'registeredAt', label: 'Дата регистрации', sortable: true },
    { key: 'unregisteredAt', label: 'Дата снятия', sortable: true },
    { key: 'isActive', label: 'Статус', sortable: true },
    { key: 'userName', label: 'Пользователь', sortable: true },
    { key: 'comment', label: 'Комментарий', sortable: false },
  ];

  records: ResidenceRecordItem[] = [];
  peopleOptions: SelectOption[] = [];
  userOptions: SelectOption[] = [];

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formData: ResidenceForm = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: ResidenceRecordItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(
    private readonly residenceRecordsService: ResidenceRecordsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  get filteredRecords(): ResidenceRecordItem[] {
    const byName = this.filters.fullName.trim().toLowerCase();
    const byAddress = this.filters.address.trim().toLowerCase();
    const byActive = this.filters.active;

    return this.records.filter((record) => {
      const matchesName = !byName || record.peopleFullName.toLowerCase().includes(byName);
      const matchesAddress = !byAddress || record.address.toLowerCase().includes(byAddress);
      const matchesActive =
        byActive === 'all' ||
        (byActive === 'active' && record.isActive === 'Активна') ||
        (byActive === 'inactive' && record.isActive === 'Не активна');

      return matchesName && matchesAddress && matchesActive;
    });
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Изменить запись регистрации' : 'Добавить запись регистрации';
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      records: this.residenceRecordsService.getAll(),
      people: this.residenceRecordsService.getPeople(),
      users: this.residenceRecordsService.getUsers(),
    })
      .pipe(timeout(15000))
      .subscribe({
        next: ({ records, people, users }) => {
          this.peopleOptions = people.map((person) => ({
            value: person.id.toString(),
            label: person.fullName?.trim() || `ID ${person.id}`,
          }));
          this.userOptions = users.map((user) => ({
            value: user.id.toString(),
            label: user.fullName?.trim() || `ID ${user.id}`,
          }));
          this.records = records.map((record) => this.mapRecord(record));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.records = [];
          this.peopleOptions = [];
          this.userOptions = [];
          if (error instanceof TimeoutError) {
            this.errorMessage = 'Превышено время ожидания ответа API.';
          } else {
            this.errorMessage = 'Не удалось загрузить реестр ЖЭК.';
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

  openEdit(row: ResidenceRecordItem): void {
    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.formData = {
      peopleId: row.peopleId.toString(),
      address: row.address === '-' ? '' : row.address,
      registeredAt: row.registeredAtRaw,
      unregisteredAt: row.unregisteredAtRaw,
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
        ? this.residenceRecordsService.update(this.editingRecordId, payload)
        : this.residenceRecordsService.create(payload);

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

  openDelete(row: ResidenceRecordItem): void {
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

    this.residenceRecordsService
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

  private mapRecord(record: ApiResidenceRecord): ResidenceRecordItem {
    return {
      id: record.id,
      peopleId: record.peopleId,
      peopleFullName: record.peopleFullName?.trim() || `ID ${record.peopleId}`,
      address: record.address?.trim() || '-',
      registeredAt: this.formatDateTime(record.registeredAt),
      registeredAtRaw: this.normalizeDateTimeInput(record.registeredAt),
      unregisteredAt: this.formatDateTime(record.unregisteredAt),
      unregisteredAtRaw: this.normalizeDateTimeInput(record.unregisteredAt),
      isActive: record.isActive ? 'Активна' : 'Не активна',
      userId: record.userId,
      userName: record.userName?.trim() || `ID ${record.userId}`,
      comment: record.comment?.trim() || '-',
    };
  }

  private buildPayload(): CreateResidenceRecordRequest | null {
    const peopleId = Number(this.formData.peopleId);
    const userId = Number(this.formData.userId);

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.formErrorMessage = 'Выберите корректный peopleId.';
      return null;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      this.formErrorMessage = 'Выберите корректный userId.';
      return null;
    }

    if (!this.formData.address.trim()) {
      this.formErrorMessage = 'Укажите адрес.';
      return null;
    }

    if (!this.formData.registeredAt) {
      this.formErrorMessage = 'Укажите дату регистрации.';
      return null;
    }

    return {
      peopleId,
      address: this.formData.address.trim(),
      registeredAt: this.toIsoDateTime(this.formData.registeredAt),
      unregisteredAt: this.formData.unregisteredAt ? this.toIsoDateTime(this.formData.unregisteredAt) : null,
      userId,
      comment: this.formData.comment.trim(),
    };
  }

  private createDefaultForm(): ResidenceForm {
    return {
      peopleId: '',
      address: '',
      registeredAt: '',
      unregisteredAt: '',
      userId: '',
      comment: '',
    };
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
