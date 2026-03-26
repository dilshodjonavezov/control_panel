import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize, TimeoutError, timeout } from 'rxjs';
import { ButtonComponent, CardComponent, ModalComponent, TableComponent, TableColumn } from '../../../shared/components';
import { BirthRecordCreateComponent, type BirthRecordCreatePayload } from '../birth-record-create/birth-record-create.component';
import {
  ApiMaternityRecord,
  MaternityRecordsService,
  type MaternityGender,
  type MaternityStatus,
} from '../../../services/maternity-records.service';

interface BirthRecordItem {
  id: number;
  birthDateTime: string;
  motherFullName: string;
  fatherFullName: string;
  placeOfBirth: string;
  gender: MaternityGender;
  status: MaternityStatus;
  userName: string;
  birthWeight: string;
}

@Component({
  selector: 'app-birth-record-list',
  standalone: true,
  imports: [CommonModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, BirthRecordCreateComponent],
  templateUrl: './birth-record-list.component.html',
  styleUrl: './birth-record-list.component.css',
})
export class BirthRecordListComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'birthDateTime', label: 'Дата рождения', sortable: true },
    { key: 'motherFullName', label: 'ФИО матери', sortable: true },
    { key: 'fatherFullName', label: 'ФИО отца', sortable: true },
    { key: 'placeOfBirth', label: 'Место рождения', sortable: true },
    { key: 'gender', label: 'Пол', sortable: true },
    { key: 'birthWeight', label: 'Вес', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'userName', label: 'Пользователь', sortable: true },
  ];

  records: BirthRecordItem[] = [];
  private sourceRecordsById = new Map<number, ApiMaternityRecord>();

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formInitialData: BirthRecordCreatePayload | null = null;

  showDeleteModal = false;
  deletingRecord: BirthRecordItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(
    private readonly maternityRecordsService: MaternityRecordsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Изменение записи о рождении' : 'Новая запись о рождении';
  }

  get formSubmitLabel(): string {
    return this.isEditMode ? 'Сохранить изменения' : 'Сохранить';
  }

  loadRecords(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.maternityRecordsService
      .getAll()
      .pipe(timeout(15000))
      .subscribe({
        next: (records) => {
          this.sourceRecordsById.clear();
          records.forEach((record) => this.sourceRecordsById.set(record.id, record));

          this.records = records.map((item: ApiMaternityRecord) => ({
            id: item.id,
            birthDateTime: this.formatDateTime(item.birthDateTime),
            motherFullName: item.motherFullName?.trim() || '-',
            fatherFullName: item.fatherFullName?.trim() || '-',
            placeOfBirth: item.placeOfBirth?.trim() || '-',
            gender: this.normalizeGender(item.gender),
            birthWeight: item.birthWeight !== null ? `${item.birthWeight}` : '-',
            status: this.normalizeStatus(item.status),
            userName: item.userName?.trim() || `ID ${item.userId}`,
          }));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.records = [];
          this.sourceRecordsById.clear();
          if (error instanceof TimeoutError) {
            this.errorMessage = 'Превышено время ожидания ответа API.';
          } else {
            this.errorMessage = 'Не удалось загрузить записи роддома.';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingRecordId = null;
    this.formInitialData = null;
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  openEdit(row: BirthRecordItem): void {
    const source = this.sourceRecordsById.get(row.id);
    if (!source) {
      this.errorMessage = 'Не удалось загрузить исходные данные записи для изменения.';
      return;
    }

    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.formInitialData = {
      userId: source.userId,
      birthDateTime: source.birthDateTime,
      placeOfBirth: source.placeOfBirth || '',
      gender: this.normalizeGender(source.gender),
      fatherFullName: source.fatherFullName || '',
      motherFullName: source.motherFullName || '',
      birthWeight: source.birthWeight ?? 0,
      status: this.normalizeStatus(source.status),
      comment: source.comment || '',
    };
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (this.isFormSubmitting) {
      return;
    }
    this.showFormModal = false;
    this.formErrorMessage = '';
  }

  handleRecordSaved(payload: BirthRecordCreatePayload): void {
    this.isFormSubmitting = true;
    this.formErrorMessage = '';

    if (this.isEditMode && this.editingRecordId) {
      this.maternityRecordsService
        .update(this.editingRecordId, payload)
        .pipe(
          timeout(15000),
          finalize(() => {
            this.isFormSubmitting = false;
            this.cdr.detectChanges();
          }),
        )
        .subscribe({
          next: (ok) => {
            if (!ok) {
              this.formErrorMessage = 'Не удалось изменить запись.';
              return;
            }
            this.showFormModal = false;
            this.loadRecords();
          },
          error: (error: unknown) => {
            if (error instanceof TimeoutError) {
              this.formErrorMessage = 'Превышено время ожидания ответа API.';
            } else {
              this.formErrorMessage = 'Не удалось изменить запись.';
            }
          },
        });
      return;
    }

    this.maternityRecordsService
      .create(payload)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isFormSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (created) => {
          if (!created) {
            this.formErrorMessage = 'Не удалось создать запись.';
            return;
          }
          this.showFormModal = false;
          this.loadRecords();
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.formErrorMessage = 'Превышено время ожидания ответа API.';
          } else {
            this.formErrorMessage = 'Не удалось создать запись.';
          }
        },
      });
  }

  openDelete(row: BirthRecordItem): void {
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

    this.maternityRecordsService
      .delete(this.deletingRecord.id)
      .pipe(
        timeout(15000),
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
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.deleteErrorMessage = 'Превышено время ожидания ответа API.';
          } else {
            this.deleteErrorMessage = 'Не удалось удалить запись.';
          }
        },
      });
  }

  getGenderLabel(gender: MaternityGender): string {
    return gender;
  }

  getStatusLabel(status: MaternityStatus): string {
    return status;
  }

  private normalizeStatus(status: string | null): MaternityStatus {
    if (status === 'Registered' || status === 'Pending' || status === 'Transferred' || status === 'Archived') {
      return status;
    }
    return 'Pending';
  }

  private normalizeGender(gender: string | null): MaternityGender {
    return gender === 'F' ? 'F' : 'M';
  }

  private formatDateTime(value: string | null): string {
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
