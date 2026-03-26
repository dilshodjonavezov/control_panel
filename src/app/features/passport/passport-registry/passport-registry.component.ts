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
  ApiPassportRecord,
  CreatePassportRecordRequest,
  PassportRecordsService,
} from '../../../services/passport-records.service';

interface PassportRecordItem {
  id: number;
  peopleId: number;
  peopleFullName: string;
  userId: number;
  userName: string;
  passportNumber: string;
  dateOfIssue: string;
  dateOfIssueRaw: string;
  placeOfIssue: string;
  dateBirth: string;
  dateBirthRaw: string;
}

interface PassportForm {
  peopleId: string;
  userId: string;
  passportNumber: string;
  dateOfIssue: string;
  placeOfIssue: string;
  dateBirth: string;
}

@Component({
  selector: 'app-passport-registry',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, TableComponent, ButtonComponent, ModalComponent],
  templateUrl: './passport-registry.component.html',
  styleUrl: './passport-registry.component.css',
})
export class PassportRegistryComponent implements OnInit {
  filters = {
    fullName: '',
    passportNumber: '',
  };

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'peopleFullName', label: 'ФИО', sortable: true },
    { key: 'passportNumber', label: 'Номер паспорта', sortable: true },
    { key: 'dateOfIssue', label: 'Дата выдачи', sortable: true },
    { key: 'placeOfIssue', label: 'Место выдачи', sortable: true },
    { key: 'dateBirth', label: 'Дата рождения', sortable: true },
    { key: 'userName', label: 'Пользователь', sortable: true },
  ];

  records: PassportRecordItem[] = [];
  peopleOptions: SelectOption[] = [];
  userOptions: SelectOption[] = [];

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formData: PassportForm = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: PassportRecordItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(
    private readonly passportRecordsService: PassportRecordsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  get filteredRecords(): PassportRecordItem[] {
    const byName = this.filters.fullName.trim().toLowerCase();
    const byPassport = this.filters.passportNumber.trim().toLowerCase();

    return this.records.filter((record) => {
      const matchesName = !byName || record.peopleFullName.toLowerCase().includes(byName);
      const matchesPassport = !byPassport || record.passportNumber.toLowerCase().includes(byPassport);
      return matchesName && matchesPassport;
    });
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Изменить паспортную запись' : 'Добавить паспортную запись';
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      records: this.passportRecordsService.getAll(),
      people: this.passportRecordsService.getPeople(),
      users: this.passportRecordsService.getUsers(),
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
            this.errorMessage = 'Не удалось загрузить паспортные записи.';
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

  openEdit(row: PassportRecordItem): void {
    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.formData = {
      peopleId: row.peopleId.toString(),
      userId: row.userId.toString(),
      passportNumber: row.passportNumber,
      dateOfIssue: row.dateOfIssueRaw,
      placeOfIssue: row.placeOfIssue === '-' ? '' : row.placeOfIssue,
      dateBirth: row.dateBirthRaw,
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
        ? this.passportRecordsService.update(this.editingRecordId, payload)
        : this.passportRecordsService.create(payload);

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

  openDelete(row: PassportRecordItem): void {
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

    this.passportRecordsService
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

  private mapRecord(record: ApiPassportRecord): PassportRecordItem {
    return {
      id: record.id,
      peopleId: record.peopleId,
      peopleFullName: record.peopleFullName?.trim() || `ID ${record.peopleId}`,
      userId: record.userId,
      userName: record.userName?.trim() || `ID ${record.userId}`,
      passportNumber: record.passportNumber?.trim() || '-',
      dateOfIssue: this.formatDate(record.dateOfIssue),
      dateOfIssueRaw: this.normalizeDateInput(record.dateOfIssue),
      placeOfIssue: record.placeOfIssue?.trim() || '-',
      dateBirth: this.formatDate(record.dateBirth),
      dateBirthRaw: this.normalizeDateInput(record.dateBirth),
    };
  }

  private buildPayload(): CreatePassportRecordRequest | null {
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

    if (!this.formData.passportNumber.trim()) {
      this.formErrorMessage = 'Укажите номер паспорта.';
      return null;
    }

    if (!this.formData.placeOfIssue.trim()) {
      this.formErrorMessage = 'Укажите место выдачи.';
      return null;
    }

    return {
      peopleId,
      userId,
      passportNumber: this.formData.passportNumber.trim(),
      dateOfIssue: this.formData.dateOfIssue || null,
      placeOfIssue: this.formData.placeOfIssue.trim(),
      dateBirth: this.formData.dateBirth || null,
    };
  }

  private createDefaultForm(): PassportForm {
    return {
      peopleId: '',
      userId: '',
      passportNumber: '',
      dateOfIssue: '',
      placeOfIssue: '',
      dateBirth: '',
    };
  }

  private normalizeDateInput(value: string | null): string {
    if (!value) {
      return '';
    }
    return value.length >= 10 ? value.slice(0, 10) : value;
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('ru-RU');
  }
}
