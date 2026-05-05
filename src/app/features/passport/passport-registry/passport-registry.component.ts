import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  ApiCitizen,
  ApiPassportRecord,
  CreatePassportRecordRequest,
  PassportRecordsService,
} from '../../../services/passport-records.service';
import { AuthService } from '../../../services/auth.service';

interface PassportRecordItem {
  id: number;
  peopleId: number;
  peopleFullName: string;
  userId: number;
  userName: string;
  passportNumber: string;
  dateOfIssue: string;
  dateOfIssueRaw: string;
  expireDate: string;
  expireDateRaw: string;
  placeOfIssue: string;
  dateBirth: string;
  dateBirthRaw: string;
}

interface PassportForm {
  peopleId: string;
  passportNumber: string;
  dateOfIssue: string;
  expireDate: string;
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
    { key: 'expireDate', label: 'Действует до', sortable: true },
    { key: 'placeOfIssue', label: 'Место выдачи', sortable: true },
    { key: 'dateBirth', label: 'Дата рождения', sortable: true },
  ];

  records: PassportRecordItem[] = [];
  peopleOptions: SelectOption[] = [];

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  infoMessage = '';
  formData: PassportForm = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: PassportRecordItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  private citizens: ApiCitizen[] = [];
  private currentEditingPeopleId: number | null = null;
  private currentUserId: number | null = null;

  constructor(
    private readonly passportRecordsService: PassportRecordsService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.resolveCurrentUserId();
    this.loadData();
    this.route.queryParamMap.subscribe((params) => {
      const action = params.get('action');
      if (!action) {
        return;
      }

      if (action === 'create') {
        this.openCreate();
        return;
      }

      if (action === 'birth-check') {
        this.infoMessage = 'Проверьте совпадение даты рождения гражданина и паспортной записи.';
        return;
      }

      this.infoMessage = 'Реестр синхронизирован с общим контуром граждан.';
      this.loadData();
    });
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
      citizens: this.passportRecordsService.getCitizens(),
    })
      .pipe(timeout(15000))
      .subscribe({
        next: ({ records, citizens }) => {
          this.citizens = citizens;
          this.records = records.map((record) => this.mapRecord(record));
          this.peopleOptions = this.buildPeopleOptions(citizens, records, this.currentEditingPeopleId);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.records = [];
          this.peopleOptions = [];
          this.citizens = [];
          this.currentEditingPeopleId = null;
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
    this.currentEditingPeopleId = null;
    this.formData = this.createDefaultForm();
    this.formErrorMessage = '';
    this.infoMessage = '';
    this.rebuildPeopleOptions();
    this.showFormModal = true;
  }

  openEdit(row: PassportRecordItem): void {
    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.currentEditingPeopleId = row.peopleId;
    this.formData = {
      peopleId: row.peopleId.toString(),
      passportNumber: row.passportNumber,
      dateOfIssue: row.dateOfIssueRaw,
      expireDate: row.expireDateRaw,
      placeOfIssue: row.placeOfIssue === '-' ? '' : row.placeOfIssue,
      dateBirth: row.dateBirthRaw,
    };
    this.formErrorMessage = '';
    this.rebuildPeopleOptions();
    this.showFormModal = true;
    this.applyCitizenBirthDate(this.formData.peopleId);
  }

  closeFormModal(): void {
    if (this.isFormSubmitting) {
      return;
    }
    this.showFormModal = false;
  }

  onIssueDateChanged(value: string | number | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.formData.dateOfIssue = value;
    if (!this.formData.expireDate.trim()) {
      this.formData.expireDate = this.defaultExpireDate(value);
    }
  }

  onCitizenChanged(value: string | number | null): void {
    if (typeof value !== 'string') {
      return;
    }

    this.formData.peopleId = value;
    this.applyCitizenBirthDate(value);
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
      expireDate: this.formatDate(record.expireDate),
      expireDateRaw: this.normalizeDateInput(record.expireDate),
      placeOfIssue: record.placeOfIssue?.trim() || '-',
      dateBirth: this.formatDate(record.dateBirth),
      dateBirthRaw: this.normalizeDateInput(record.dateBirth),
    };
  }

  private buildPayload(): CreatePassportRecordRequest | null {
    const peopleId = Number(this.formData.peopleId);
    const userId = this.currentUserId ?? 0;

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.formErrorMessage = 'Выберите гражданина.';
      return null;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      this.formErrorMessage = 'Не удалось определить текущего пользователя.';
      return null;
    }

    const existingPassport = this.records.find(
      (record) => record.peopleId === peopleId && (!this.isEditMode || record.id !== this.editingRecordId),
    );
    if (existingPassport) {
      this.formErrorMessage = 'У этого гражданина уже есть паспортная запись.';
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

    const dateOfIssue = this.formData.dateOfIssue.trim() || null;
    const expireDate = this.formData.expireDate.trim() || this.defaultExpireDate(dateOfIssue);

    return {
      peopleId,
      userId,
      passportNumber: this.formData.passportNumber.trim(),
      dateOfIssue,
      expireDate,
      placeOfIssue: this.formData.placeOfIssue.trim(),
      dateBirth: this.formData.dateBirth.trim() || null,
    };
  }

  private buildPeopleOptions(
    citizens: ApiCitizen[],
    passports: ApiPassportRecord[],
    currentPeopleId: number | null,
  ): SelectOption[] {
    const passportByCitizenId = new Map<number, ApiPassportRecord>();
    for (const passport of passports) {
      if (!passportByCitizenId.has(passport.peopleId)) {
        passportByCitizenId.set(passport.peopleId, passport);
      }
    }

    return citizens
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
      .map((citizen) => ({
        value: citizen.id.toString(),
        label: this.buildCitizenOptionLabel(citizen, passportByCitizenId.get(citizen.id), currentPeopleId),
      }));
  }

  private rebuildPeopleOptions(): void {
    const records = this.records.map((item) => ({
      id: item.id,
      peopleId: item.peopleId,
      peopleFullName: item.peopleFullName,
      userId: item.userId,
      userName: item.userName,
      passportNumber: item.passportNumber,
      dateOfIssue: item.dateOfIssueRaw,
      expireDate: item.expireDateRaw,
      placeOfIssue: item.placeOfIssue,
      dateBirth: item.dateBirthRaw,
    }));
    this.peopleOptions = this.buildPeopleOptions(this.citizens, records, this.currentEditingPeopleId);
  }

  private createDefaultForm(): PassportForm {
    const dateOfIssue = new Date().toISOString().split('T')[0];
    return {
      peopleId: '',
      passportNumber: '',
      dateOfIssue,
      expireDate: this.defaultExpireDate(dateOfIssue),
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

  private defaultExpireDate(issueDate: string | null): string {
    if (!issueDate) {
      return '';
    }
    const date = new Date(issueDate);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    date.setFullYear(date.getFullYear() + 10);
    return date.toISOString().split('T')[0];
  }

  private applyCitizenBirthDate(peopleIdValue: string): void {
    const peopleId = Number(peopleIdValue);
    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      return;
    }

    const citizen = this.citizens.find((item) => item.id === peopleId);
    if (!citizen?.birthDate) {
      return;
    }

    this.formData.dateBirth = this.normalizeDateInput(citizen.birthDate);
  }

  private buildCitizenOptionLabel(
    citizen: ApiCitizen,
    passport: ApiPassportRecord | undefined,
    currentPeopleId: number | null,
  ): string {
    const fullName = citizen.fullName?.trim() || `ID ${citizen.id}`;
    if (!passport) {
      return fullName;
    }

    if (citizen.id === currentPeopleId) {
      return `${fullName} - текущая запись`;
    }

    const passportNumber = passport.passportNumber?.trim() || 'паспорт уже создан';
    return `${fullName} - уже есть паспорт (${passportNumber})`;
  }
}
