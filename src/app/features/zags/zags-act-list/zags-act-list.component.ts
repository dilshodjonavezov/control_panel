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
  ApiZagsBirthRecord,
  CreateZagsBirthRecordRequest,
  ZagsBirthRecordsService,
} from '../../../services/zags-birth-records.service';
import { ApiMaternityRecord, MaternityRecordsService, type MaternityGender, type MaternityStatus } from '../../../services/maternity-records.service';
import { AuthService } from '../../../services/auth.service';

interface ZagsChildItem {
  id: number;
  childFullName: string;
  birthDate: string;
  placeOfBirth: string;
  gender: MaternityGender;
  status: MaternityStatus;
  birthWeight: string;
}

interface ZagsActItem {
  id: number;
  fatherPersonId: number | null;
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
  childrenInfo: string;
  childrenCount: number;
  parentsChildrenCount: number;
  childrenRecords: ZagsChildItem[];
  status: string;
}

interface ZagsActForm {
  actType: ZagsActType;
  actNumber: string;
  registrationDate: string;
  placeOfRegistration: string;
  status: string;
  birthDate: string;
  birthPlace: string;
  childFullName: string;
  fatherFullName: string;
  motherFullName: string;
  marriageDate: string;
  marriagePlace: string;
  spouseOneFullName: string;
  spouseTwoFullName: string;
  deathDate: string;
  deceasedFullName: string;
  deathPlace: string;
  deathReason: string;
}

type ZagsActType = 'BirthCertificate' | 'Marriage' | 'Death';

@Component({
  selector: 'app-zags-act-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, InputComponent, SelectComponent, ModalComponent],
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
    { key: 'fatherPersonId', label: 'fatherPersonId', sortable: true },
    { key: 'fatherFullName', label: 'Отец', sortable: true },
    { key: 'motherFullName', label: 'Мать', sortable: true },
    { key: 'childrenInfo', label: 'Детей у отца', sortable: false },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'userName', label: 'Пользователь', sortable: true },
  ];

  childrenColumns: TableColumn[] = [
    { key: 'id', label: 'ID записи', sortable: true },
    { key: 'childFullName', label: 'ФИО ребенка', sortable: true },
    { key: 'birthDate', label: 'Дата рождения', sortable: true },
    { key: 'placeOfBirth', label: 'Место рождения', sortable: true },
    { key: 'gender', label: 'Пол', sortable: true },
    { key: 'birthWeight', label: 'Вес', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
  ];

  records: ZagsActItem[] = [];
  private maternityRecords: ApiMaternityRecord[] = [];
  private resolvedUserId: number | null = null;
  isLoading = false;
  errorMessage = '';

  showChildrenModal = false;
  childrenModalTitle = '';
  selectedChildren: ZagsChildItem[] = [];

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formData: ZagsActForm = this.createDefaultForm();
  typeOptions: SelectOption[] = [
    { value: 'Marriage', label: 'Брак' },
    { value: 'BirthCertificate', label: 'Рождение' },
    { value: 'Death', label: 'Смерть' },
  ];

  showDeleteModal = false;
  deletingRecord: ZagsActItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(
    private readonly zagsBirthRecordsService: ZagsBirthRecordsService,
    private readonly maternityRecordsService: MaternityRecordsService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.resolveCurrentUserId();
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

    forkJoin({
      zagsRecords: this.zagsBirthRecordsService.getAll(),
      maternityRecords: this.maternityRecordsService.getAll(),
    })
      .pipe(timeout(15000))
      .subscribe({
        next: ({ zagsRecords, maternityRecords }) => {
          this.maternityRecords = maternityRecords;
          this.records = zagsRecords.map((record) => this.mapRecord(record, maternityRecords));
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

  openChildren(row: ZagsActItem): void {
    if (row.childrenCount === 0) {
      return;
    }

    this.childrenModalTitle = row.fatherPersonId
      ? `Дети по fatherPersonId=${row.fatherPersonId}`
      : `Дети по акту №${row.actNumber}`;
    this.selectedChildren = row.childrenRecords;
    this.showChildrenModal = true;
  }

  closeChildrenModal(): void {
    this.showChildrenModal = false;
    this.selectedChildren = [];
    this.childrenModalTitle = '';
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
      actType: 'BirthCertificate',
      actNumber: row.actNumber,
      registrationDate: row.registrationDateRaw,
      placeOfRegistration: row.placeOfRegistration === '-' ? '' : row.placeOfRegistration,
      status: row.status === '-' ? '' : row.status,
      birthDate: row.birthDateRaw,
      birthPlace: row.birthPlace === '-' ? '' : row.birthPlace,
      childFullName: row.childrenRecords[0]?.childFullName || '',
      fatherFullName: row.fatherFullName === '-' ? '' : row.fatherFullName,
      motherFullName: row.motherFullName === '-' ? '' : row.motherFullName,
      marriageDate: '',
      marriagePlace: '',
      spouseOneFullName: '',
      spouseTwoFullName: '',
      deathDate: '',
      deceasedFullName: '',
      deathPlace: '',
      deathReason: '',
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

  getGenderLabel(gender: MaternityGender): string {
    return gender === 'F' || gender === 'Женский' ? 'Женский' : 'Мужской';
  }

  getStatusLabel(status: MaternityStatus): string {
    if (status === 'Registered' || status === 'Зарегистрирован') {
      return 'Зарегистрирован';
    }
    if (status === 'Transferred' || status === 'Передан') {
      return 'Передан';
    }
    if (status === 'Archived' || status === 'Архив') {
      return 'Архив';
    }
    return 'В ожидании';
  }

  isBirthType(): boolean {
    return this.formData.actType === 'BirthCertificate';
  }

  isMarriageType(): boolean {
    return this.formData.actType === 'Marriage';
  }

  isDeathType(): boolean {
    return this.formData.actType === 'Death';
  }

  private mapRecord(record: ApiZagsBirthRecord, maternityRecords: ApiMaternityRecord[]): ZagsActItem {
    const { fatherPersonId, childrenRecords } = this.buildChildrenRecords(record, maternityRecords);
    const parentsChildrenCount = childrenRecords.length;

    return {
      id: record.id,
      fatherPersonId,
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
      childrenInfo: parentsChildrenCount > 0 ? `${parentsChildrenCount} детей` : '0',
      childrenCount: parentsChildrenCount,
      parentsChildrenCount,
      childrenRecords,
      status: record.status?.trim() || '-',
    };
  }

  private buildChildrenRecords(
    record: ApiZagsBirthRecord,
    maternityRecords: ApiMaternityRecord[],
  ): { fatherPersonId: number | null; childrenRecords: ZagsChildItem[] } {
    let fatherPersonId = record.fatherPersonId && record.fatherPersonId > 0 ? record.fatherPersonId : null;
    const father = this.normalizeName(record.fatherFullName);
    const mother = this.normalizeName(record.motherFullName);

    let linked: ApiMaternityRecord[] = [];

    if (fatherPersonId) {
      linked = maternityRecords.filter((item) => item.fatherPersonId === fatherPersonId);
    }

    if (linked.length === 0) {
      linked = maternityRecords.filter((item) => this.extractZagsId(item.comment) === record.id);
    }

    if (linked.length === 0 && father && mother) {
      linked = maternityRecords.filter(
        (item) =>
          this.normalizeName(item.fatherFullName) === father &&
          this.normalizeName(item.motherFullName) === mother,
      );
    }

    if (!fatherPersonId) {
      const firstWithFatherId = linked.find((item) => !!item.fatherPersonId && item.fatherPersonId > 0);
      fatherPersonId = firstWithFatherId?.fatherPersonId ?? null;
      if (fatherPersonId) {
        linked = maternityRecords.filter((item) => item.fatherPersonId === fatherPersonId);
      }
    }

    const childrenRecords = linked
      .sort((a, b) => b.id - a.id)
      .map((item) => ({
        id: item.id,
        childFullName: item.childFullName?.trim() || '-',
        birthDate: this.formatDate(item.birthDateTime),
        placeOfBirth: item.placeOfBirth?.trim() || '-',
        gender: this.normalizeGender(item.gender),
        status: this.normalizeStatus(item.status),
        birthWeight: item.birthWeight !== null ? `${item.birthWeight}` : '-',
      }));

    return { fatherPersonId, childrenRecords };
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

  private normalizeName(value: string | null): string {
    return (value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,]/g, '')
      .trim();
  }

  private buildPayload(): CreateZagsBirthRecordRequest | null {
    if (this.resolvedUserId === null) {
      this.formErrorMessage = 'Не удалось определить текущего пользователя.';
      return null;
    }

    const actNumber = this.formData.actNumber.trim() || this.generateActNumber();
    const payloadFields = this.buildPayloadFieldsByType();
    if (!payloadFields) {
      return null;
    }

    const linkage = this.resolveActLinkage(payloadFields);
    if (!linkage) {
      return null;
    }

    if (!this.formData.registrationDate) {
      this.formErrorMessage = 'Укажите дату регистрации.';
      return null;
    }

    if (!this.formData.placeOfRegistration.trim()) {
      this.formErrorMessage = 'Укажите место регистрации.';
      return null;
    }

    return {
      maternityRecordId: linkage.maternityRecordId,
      peopleId: linkage.peopleId,
      peopleFullName: linkage.peopleFullName,
      userId: this.resolvedUserId,
      actNumber,
      childFullName: linkage.childFullName,
      registrationDate: this.formData.registrationDate,
      birthDate: payloadFields.eventDate,
      placeOfRegistration: this.formData.placeOfRegistration.trim(),
      birthPlace: payloadFields.place,
      fatherFullName: payloadFields.primaryPerson,
      motherFullName: payloadFields.secondaryPerson,
      fatherPersonId: linkage.fatherPersonId,
      status: this.formData.status.trim(),
    };
  }

  private createDefaultForm(): ZagsActForm {
    return {
      actType: 'BirthCertificate',
      actNumber: this.generateActNumber(),
      registrationDate: '',
      placeOfRegistration: '',
      status: '',
      birthDate: '',
      birthPlace: '',
      childFullName: '',
      fatherFullName: '',
      motherFullName: '',
      marriageDate: '',
      marriagePlace: '',
      spouseOneFullName: '',
      spouseTwoFullName: '',
      deathDate: '',
      deceasedFullName: '',
      deathPlace: '',
      deathReason: '',
    };
  }

  private resolveActLinkage(payloadFields: {
    eventDate: string;
    place: string;
    primaryPerson: string;
    secondaryPerson: string;
  }):
    | {
        maternityRecordId: number;
        peopleId: number;
        peopleFullName: string;
        fatherPersonId: number;
        childFullName: string;
      }
    | null {
    const childName = this.formData.childFullName.trim();
    const father = this.formData.fatherFullName.trim();
    const mother = this.formData.motherFullName.trim();
    const birthDate = this.formData.birthDate;

    if (this.formData.actType === 'BirthCertificate') {
      const match = this.maternityRecords.find((item) => {
        const childMatches = this.normalizeName(item.childFullName) === this.normalizeName(childName);
        const fatherMatches = this.normalizeName(item.fatherFullName) === this.normalizeName(father);
        const motherMatches = this.normalizeName(item.motherFullName) === this.normalizeName(mother);
        const birthMatches = this.isSameDate(item.birthDateTime, birthDate);
        return childMatches && fatherMatches && motherMatches && birthMatches;
      });

      if (match && match.fatherPersonId && match.fatherPersonId > 0) {
        return {
          maternityRecordId: match.id,
          peopleId: match.fatherPersonId,
          peopleFullName: match.childFullName?.trim() || childName || father,
          fatherPersonId: match.fatherPersonId,
          childFullName: match.childFullName?.trim() || childName,
        };
      }
    }

    const seed = [
      this.formData.actType,
      payloadFields.primaryPerson,
      payloadFields.secondaryPerson,
      payloadFields.eventDate,
      childName,
    ]
      .join('|')
      .trim();
    const syntheticId = this.buildSyntheticId(seed);
    const displayName =
      this.formData.actType === 'BirthCertificate'
        ? childName || payloadFields.primaryPerson
        : payloadFields.primaryPerson;

    return {
      maternityRecordId: this.formData.actType === 'BirthCertificate' ? syntheticId : 0,
      peopleId: syntheticId,
      peopleFullName: displayName,
      fatherPersonId: syntheticId,
      childFullName: childName || displayName,
    };
  }

  private resolveCurrentUserId(): void {
    const username = this.authService.getCurrentUsername();
    if (!username) {
      this.resolvedUserId = null;
      return;
    }

    this.authService.getUsers().subscribe({
      next: (users) => {
        const matched = users.find((user) => user.username.trim().toLowerCase() === username.toLowerCase());
        this.resolvedUserId = matched?.id ?? this.resolveLocalUserId(username);
      },
      error: () => {
        this.resolvedUserId = this.resolveLocalUserId(username);
      },
    });
  }

  private isSameDate(value: string | null, dateInput: string): boolean {
    if (!value || !dateInput) {
      return false;
    }
    return this.normalizeDateInput(value) === this.normalizeDateInput(dateInput);
  }

  private buildPayloadFieldsByType(): { eventDate: string; place: string; primaryPerson: string; secondaryPerson: string } | null {
    if (this.formData.actType === 'BirthCertificate') {
      if (!this.formData.birthDate) {
        this.formErrorMessage = 'Укажите дату рождения.';
        return null;
      }
      if (!this.formData.birthPlace.trim()) {
        this.formErrorMessage = 'Укажите место рождения.';
        return null;
      }
      if (!this.formData.fatherFullName.trim() || !this.formData.motherFullName.trim()) {
        this.formErrorMessage = 'Укажите ФИО отца и матери.';
        return null;
      }

      return {
        eventDate: this.formData.birthDate,
        place: this.formData.birthPlace.trim(),
        primaryPerson: this.formData.fatherFullName.trim(),
        secondaryPerson: this.formData.motherFullName.trim(),
      };
    }

    if (this.formData.actType === 'Marriage') {
      if (!this.formData.marriageDate) {
        this.formErrorMessage = 'Укажите дату регистрации брака.';
        return null;
      }
      if (!this.formData.marriagePlace.trim()) {
        this.formErrorMessage = 'Укажите место заключения брака.';
        return null;
      }
      if (!this.formData.spouseOneFullName.trim() || !this.formData.spouseTwoFullName.trim()) {
        this.formErrorMessage = 'Укажите ФИО обоих супругов.';
        return null;
      }

      return {
        eventDate: this.formData.marriageDate,
        place: this.formData.marriagePlace.trim(),
        primaryPerson: this.formData.spouseOneFullName.trim(),
        secondaryPerson: this.formData.spouseTwoFullName.trim(),
      };
    }

    if (!this.formData.deathDate) {
      this.formErrorMessage = 'Укажите дату смерти.';
      return null;
    }
    if (!this.formData.deathPlace.trim()) {
      this.formErrorMessage = 'Укажите место смерти.';
      return null;
    }
    if (!this.formData.deceasedFullName.trim()) {
      this.formErrorMessage = 'Укажите ФИО умершего.';
      return null;
    }

    return {
      eventDate: this.formData.deathDate,
      place: this.formData.deathPlace.trim(),
      primaryPerson: this.formData.deceasedFullName.trim(),
      secondaryPerson: this.formData.deathReason.trim() || 'Причина не указана',
    };
  }

  private generateActNumber(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const rand = Math.floor(100 + Math.random() * 900);
    return `${yyyy}${mm}${dd}-${hh}${min}-${rand}`;
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

  private normalizeStatus(status: string | null): MaternityStatus {
    if (status === 'Registered' || status === 'Pending' || status === 'Transferred' || status === 'Archived') {
      return status;
    }
    if (status === 'Зарегистрирован') {
      return 'Registered';
    }
    if (status === 'Ожидает' || status === 'В ожидании' || status === 'Ожидание') {
      return 'Pending';
    }
    if (status === 'Передан') {
      return 'Transferred';
    }
    if (status === 'Архив' || status === 'Архивирован') {
      return 'Archived';
    }
    return 'Pending';
  }

  private normalizeGender(gender: string | null): MaternityGender {
    if (gender === 'F' || gender === 'Женский') {
      return 'F';
    }
    return 'M';
  }

  private buildSyntheticId(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) + 500000;
  }

  private resolveLocalUserId(username: string): number | null {
    const normalized = username.trim().toLowerCase();
    if (normalized === 'admin') {
      return 1;
    }
    if (normalized === 'maternity' || normalized === 'maternity@example.com') {
      return 2;
    }
    if (normalized === 'zags' || normalized === 'zags@example.com') {
      return 3;
    }
    return null;
  }
}
