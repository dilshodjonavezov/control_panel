import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { catchError, finalize, forkJoin, of, TimeoutError, timeout } from 'rxjs';
import { ButtonComponent, CardComponent, ModalComponent, TableComponent, TableColumn } from '../../../shared/components';
import { BirthRecordCreateComponent, type BirthRecordCreatePayload } from '../birth-record-create/birth-record-create.component';
import {
  ApiMaternityRecord,
  MaternityRecordsService,
  type MaternityGender,
  type MaternityStatus,
} from '../../../services/maternity-records.service';
import { ApiZagsBirthRecord, ZagsBirthRecordsService } from '../../../services/zags-birth-records.service';

interface BirthRecordItem {
  id: number;
  birthDateTime: string;
  childFullName: string;
  motherFullName: string;
  fatherFullName: string;
  fatherPersonId: number | null;
  childrenCount: number;
  placeOfBirth: string;
  gender: MaternityGender;
  status: MaternityStatus;
  userName: string;
  birthWeight: string;
  zagsLink: string;
  zagsRecordId: number | null;
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
    { key: 'childFullName', label: 'ФИО ребенка', sortable: true },
    { key: 'motherFullName', label: 'ФИО матери', sortable: true },
    { key: 'fatherFullName', label: 'ФИО отца', sortable: true },
    { key: 'childrenCount', label: 'Детей у родителя', sortable: true },
    { key: 'placeOfBirth', label: 'Место рождения', sortable: true },
    { key: 'gender', label: 'Пол', sortable: true },
    { key: 'birthWeight', label: 'Вес', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'zagsLink', label: 'Связь ЗАГС', sortable: false },
    { key: 'userName', label: 'Пользователь', sortable: true },
  ];

  records: BirthRecordItem[] = [];
  private sourceRecordsById = new Map<number, ApiMaternityRecord>();
  private zagsRecordsById = new Map<number, ApiZagsBirthRecord>();
  private childrenCountByFatherId = new Map<number, number>();

  isLoading = false;
  errorMessage = '';
  zagsAccessDenied = false;

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formInfoMessage = '';
  formInitialData: BirthRecordCreatePayload | null = null;

  showDeleteModal = false;
  deletingRecord: BirthRecordItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  showZagsModal = false;
  selectedZagsRecord: ApiZagsBirthRecord | null = null;

  constructor(
    private readonly maternityRecordsService: MaternityRecordsService,
    private readonly zagsBirthRecordsService: ZagsBirthRecordsService,
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
    this.zagsAccessDenied = false;

    forkJoin({
      maternityRecords: this.maternityRecordsService.getAll(),
      zagsRecords: this.zagsBirthRecordsService.getAll().pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 403) {
            this.zagsAccessDenied = true;
            return of([] as ApiZagsBirthRecord[]);
          }
          throw error;
        }),
      ),
    })
      .pipe(timeout(15000))
      .subscribe({
        next: ({ maternityRecords, zagsRecords }) => {
          this.sourceRecordsById.clear();
          maternityRecords.forEach((record) => this.sourceRecordsById.set(record.id, record));

          this.zagsRecordsById.clear();
          zagsRecords.forEach((record) => this.zagsRecordsById.set(record.id, record));

          this.childrenCountByFatherId.clear();
          maternityRecords.forEach((record) => {
            if (record.fatherPersonId && record.fatherPersonId > 0) {
              const current = this.childrenCountByFatherId.get(record.fatherPersonId) ?? 0;
              this.childrenCountByFatherId.set(record.fatherPersonId, current + 1);
            }
          });

          this.records = maternityRecords.map((item: ApiMaternityRecord) => {
            const zagsRecordId = this.extractZagsId(item.comment) ?? this.findLinkedZagsIdByParents(item, zagsRecords);
            const childrenCount =
              item.fatherPersonId && item.fatherPersonId > 0
                ? (this.childrenCountByFatherId.get(item.fatherPersonId) ?? 1)
                : 1;

            return {
              id: item.id,
              birthDateTime: this.formatDateTime(item.birthDateTime),
              childFullName: item.childFullName?.trim() || '-',
              motherFullName: item.motherFullName?.trim() || '-',
              fatherFullName: item.fatherFullName?.trim() || '-',
              fatherPersonId: item.fatherPersonId ?? null,
              childrenCount,
              placeOfBirth: item.placeOfBirth?.trim() || '-',
              gender: this.normalizeGender(item.gender),
              birthWeight: item.birthWeight !== null ? `${item.birthWeight}` : '-',
              status: this.normalizeStatus(item.status),
              zagsLink: this.getZagsLinkLabel(zagsRecordId),
              zagsRecordId,
              userName: item.userName?.trim() || `ID ${item.userId}`,
            };
          });

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.records = [];
          this.sourceRecordsById.clear();
          this.zagsRecordsById.clear();
          this.childrenCountByFatherId.clear();

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

  openLinkedZags(row: BirthRecordItem): void {
    if (this.zagsAccessDenied) {
      this.errorMessage = 'Нет доступа к записям ЗАГС (403).';
      return;
    }

    if (!row.zagsRecordId) {
      return;
    }

    const record = this.zagsRecordsById.get(row.zagsRecordId);
    if (!record) {
      this.errorMessage = `Не найден акт ЗАГС #${row.zagsRecordId}.`;
      return;
    }

    this.selectedZagsRecord = record;
    this.showZagsModal = true;
  }

  closeZagsModal(): void {
    this.showZagsModal = false;
    this.selectedZagsRecord = null;
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingRecordId = null;
    this.formInitialData = null;
    this.formErrorMessage = '';
    this.formInfoMessage = '';
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
      childFullName: source.childFullName || '',
      fatherFullName: source.fatherFullName || '',
      motherFullName: source.motherFullName || '',
      fatherPersonId: source.fatherPersonId ?? undefined,
      birthWeight: source.birthWeight ?? 0,
      status: this.normalizeStatus(source.status),
      comment: source.comment || '',
    };

    this.formErrorMessage = '';
    if (source.fatherPersonId && source.fatherPersonId > 0) {
      const childrenCount = this.childrenCountByFatherId.get(source.fatherPersonId) ?? 1;
      this.formInfoMessage = `Родитель fatherPersonId: ${source.fatherPersonId}. Детей у родителя: ${childrenCount}.`;
    } else {
      this.formInfoMessage = 'Для этой записи fatherPersonId пока не определен.';
    }

    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (this.isFormSubmitting) {
      return;
    }
    this.showFormModal = false;
    this.formErrorMessage = '';
    this.formInfoMessage = '';
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
            this.formInfoMessage = '';
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
          this.formInfoMessage = '';
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
    return gender === 'F' || gender === 'Женский' ? 'Женский' : 'Мужской';
  }

  getStatusLabel(status: MaternityStatus): string {
    if (status === 'Зарегистрирован' || status === 'Registered') {
      return 'Зарегистрирован';
    }
    if (status === 'Отправлен в ЗАГС' || status === 'Transferred' || status === 'Передан') {
      return 'Отправлен в ЗАГС';
    }
    return 'Черновик';
  }

  private normalizeStatus(status: string | null): MaternityStatus {
    if (!status) {
      return 'Черновик';
    }

    if (status === 'Черновик' || status === 'Отправлен в ЗАГС' || status === 'Зарегистрирован') {
      return status;
    }

    if (status === 'Registered' || status === 'Архив' || status === 'Архивирован') {
      return 'Зарегистрирован';
    }

    if (status === 'Transferred' || status === 'Передан') {
      return 'Отправлен в ЗАГС';
    }

    return 'Черновик';
  }

  private normalizeGender(gender: string | null): MaternityGender {
    if (gender === 'F' || gender === 'Женский') {
      return 'F';
    }
    return 'M';
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

  private extractZagsId(comment: string | null): number | null {
    if (!comment) {
      return null;
    }
    const match = comment.match(/\[ZAGS_ID:(\d+)\]/i);
    if (!match) {
      return null;
    }
    const parsed = Number(match[1]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private findLinkedZagsIdByParents(item: ApiMaternityRecord, zagsRecords: ApiZagsBirthRecord[]): number | null {
    const father = this.normalizeName(item.fatherFullName);
    const mother = this.normalizeName(item.motherFullName);
    if (!father || !mother) {
      return null;
    }

    const matched = zagsRecords.find(
      (record) => this.normalizeName(record.fatherFullName) === father && this.normalizeName(record.motherFullName) === mother,
    );

    return matched?.id ?? null;
  }

  private normalizeName(value: string | null): string {
    return (value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,]/g, '')
      .trim();
  }

  private getZagsLinkLabel(zagsRecordId: number | null): string {
    if (this.zagsAccessDenied) {
      return zagsRecordId ? `Акт #${zagsRecordId} (нет доступа)` : 'Нет доступа';
    }
    return zagsRecordId ? `Акт ЗАГС #${zagsRecordId}` : '—';
  }
}
