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
  ApiZagsBirthRecord,
  CreateZagsBirthRecordRequest,
  ZagsBirthRecordsService,
} from '../../../services/zags-birth-records.service';

interface ZagsActItem {
  id: number;
  peopleId: number;
  peopleFullName: string;
  userId: number;
  userName: string;
  actNumber: string;
  birthDate: string;
  birthDateRaw: string;
  registrationDate: string;
  registrationDateRaw: string;
  placeOfRegistration: string;
  birthPlace: string;
  fatherFullName: string;
  motherFullName: string;
  status: string;
}

interface ZagsActForm {
  peopleId: string;
  userId: string;
  actNumber: string;
  registrationDate: string;
  birthDate: string;
  placeOfRegistration: string;
  birthPlace: string;
  fatherFullName: string;
  motherFullName: string;
  status: string;
}

@Component({
  selector: 'app-zags-act-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, InputComponent, ModalComponent],
  templateUrl: './zags-act-list.component.html',
  styleUrl: './zags-act-list.component.css',
})
export class ZagsActListComponent implements OnInit {
  filters = {
    actNumber: '',
    fullName: '',
    status: '',
  };

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'actNumber', label: 'Акт №', sortable: true },
    { key: 'registrationDate', label: 'Дата регистрации', sortable: true },
    { key: 'birthDate', label: 'Дата рождения', sortable: true },
    { key: 'peopleFullName', label: 'Гражданин', sortable: true },
    { key: 'placeOfRegistration', label: 'Место регистрации', sortable: true },
    { key: 'birthPlace', label: 'Место рождения', sortable: true },
    { key: 'fatherFullName', label: 'Отец', sortable: true },
    { key: 'motherFullName', label: 'Мать', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'userName', label: 'Пользователь', sortable: true },
  ];

  records: ZagsActItem[] = [];
  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formData: ZagsActForm = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: ZagsActItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(
    private readonly zagsBirthRecordsService: ZagsBirthRecordsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  get filteredRecords(): ZagsActItem[] {
    const byAct = this.filters.actNumber.trim().toLowerCase();
    const byName = this.filters.fullName.trim().toLowerCase();
    const byStatus = this.filters.status.trim().toLowerCase();

    return this.records.filter((record) => {
      const matchesAct = !byAct || record.actNumber.toLowerCase().includes(byAct);
      const matchesName = !byName || record.peopleFullName.toLowerCase().includes(byName);
      const matchesStatus = !byStatus || record.status.toLowerCase().includes(byStatus);
      return matchesAct && matchesName && matchesStatus;
    });
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Изменить запись ЗАГС' : 'Добавить запись ЗАГС';
  }

  loadRecords(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.zagsBirthRecordsService
      .getAll()
      .pipe(timeout(15000))
      .subscribe({
        next: (records) => {
          this.records = records.map((record) => this.mapRecord(record));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.records = [];
          if (error instanceof TimeoutError) {
            this.errorMessage = 'Превышено время ожидания ответа API.';
          } else {
            this.errorMessage = 'Не удалось загрузить записи ЗАГС.';
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

  openEdit(row: ZagsActItem): void {
    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.formData = {
      peopleId: row.peopleId.toString(),
      userId: row.userId.toString(),
      actNumber: row.actNumber,
      registrationDate: row.registrationDateRaw,
      birthDate: row.birthDateRaw,
      placeOfRegistration: row.placeOfRegistration === '-' ? '' : row.placeOfRegistration,
      birthPlace: row.birthPlace === '-' ? '' : row.birthPlace,
      fatherFullName: row.fatherFullName === '-' ? '' : row.fatherFullName,
      motherFullName: row.motherFullName === '-' ? '' : row.motherFullName,
      status: row.status === '-' ? '' : row.status,
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
        ? this.zagsBirthRecordsService.update(this.editingRecordId, payload)
        : this.zagsBirthRecordsService.create(payload);

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
          this.loadRecords();
        },
        error: () => {
          this.formErrorMessage = this.isEditMode
            ? 'Не удалось изменить запись.'
            : 'Не удалось создать запись.';
        },
      });
  }

  openDelete(row: ZagsActItem): void {
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

    this.zagsBirthRecordsService
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
          this.loadRecords();
        },
        error: () => {
          this.deleteErrorMessage = 'Не удалось удалить запись.';
        },
      });
  }

  private mapRecord(record: ApiZagsBirthRecord): ZagsActItem {
    return {
      id: record.id,
      peopleId: record.peopleId,
      peopleFullName: record.peopleFullName?.trim() || `ID ${record.peopleId}`,
      userId: record.userId,
      userName: record.userName?.trim() || `ID ${record.userId}`,
      actNumber: record.actNumber?.trim() || '-',
      birthDate: this.formatDate(record.birthDate),
      birthDateRaw: this.normalizeDateInput(record.birthDate),
      registrationDate: this.formatDate(record.registrationDate),
      registrationDateRaw: this.normalizeDateInput(record.registrationDate),
      placeOfRegistration: record.placeOfRegistration?.trim() || '-',
      birthPlace: record.birthPlace?.trim() || '-',
      fatherFullName: record.fatherFullName?.trim() || '-',
      motherFullName: record.motherFullName?.trim() || '-',
      status: record.status?.trim() || '-',
    };
  }

  private buildPayload(): CreateZagsBirthRecordRequest | null {
    const peopleId = Number(this.formData.peopleId);
    const userId = Number(this.formData.userId);

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.formErrorMessage = 'Укажите корректный peopleId.';
      return null;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      this.formErrorMessage = 'Укажите корректный userId.';
      return null;
    }

    if (!this.formData.actNumber.trim()) {
      this.formErrorMessage = 'Укажите actNumber.';
      return null;
    }

    if (!this.formData.registrationDate) {
      this.formErrorMessage = 'Укажите registrationDate.';
      return null;
    }

    if (!this.formData.birthDate) {
      this.formErrorMessage = 'Укажите birthDate.';
      return null;
    }

    if (!this.formData.placeOfRegistration.trim()) {
      this.formErrorMessage = 'Укажите placeOfRegistration.';
      return null;
    }

    if (!this.formData.birthPlace.trim()) {
      this.formErrorMessage = 'Укажите birthPlace.';
      return null;
    }

    return {
      peopleId,
      userId,
      actNumber: this.formData.actNumber.trim(),
      registrationDate: this.formData.registrationDate,
      birthDate: this.formData.birthDate,
      placeOfRegistration: this.formData.placeOfRegistration.trim(),
      birthPlace: this.formData.birthPlace.trim(),
      fatherFullName: this.formData.fatherFullName.trim(),
      motherFullName: this.formData.motherFullName.trim(),
      status: this.formData.status.trim(),
    };
  }

  private createDefaultForm(): ZagsActForm {
    return {
      peopleId: '',
      userId: '',
      actNumber: '',
      registrationDate: '',
      birthDate: '',
      placeOfRegistration: '',
      birthPlace: '',
      fatherFullName: '',
      motherFullName: '',
      status: '',
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
