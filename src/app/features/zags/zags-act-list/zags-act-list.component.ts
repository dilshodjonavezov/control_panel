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
  ApiZagsActRecord,
  CreateZagsActRequest,
  ZagsActsService,
  type ZagsActType,
} from '../../../services/zags-acts.service';
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
  actType: ZagsActType;
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
  source: ApiZagsActRecord;
}

interface MaternityPickerItem {
  id: number;
  childFullName: string;
  motherFullName: string;
  fatherFullName: string;
  birthDate: string;
  birthPlace: string;
  status: string;
  gender: string;
  isAlreadyInZags: boolean;
  linkedZagsActId: number | null;
  searchText: string;
}

interface ZagsActForm {
  actType: ZagsFormActType;
  actNumber: string;
  registrationDate: string;
  placeOfRegistration: string;
  status: string;
  birthScenario: BirthScenario;
  maternityRecordId: string;
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

type ZagsFormActType = 'BirthCertificate' | 'Marriage' | 'Death';
type BirthScenario = 'standard' | 'outside_marriage' | 'unregistered_marriage' | 'relative_without_zags' | 'guardianship';
type ZagsActStatus = 'DRAFT' | 'REGISTERED' | 'UPDATED' | 'CANCELLED' | 'ARCHIVED';

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
    { key: 'actType', label: 'Тип', sortable: true },
    { key: 'registrationDate', label: 'Дата регистрации', sortable: true },
    { key: 'birthDate', label: 'Дата рождения', sortable: true },
    { key: 'placeOfRegistration', label: 'Место регистрации', sortable: true },
    { key: 'birthPlace', label: 'Место рождения', sortable: true },
    { key: 'fatherPersonId', label: 'ID отца', sortable: true },
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
  showMaternityPickerModal = false;
  maternityPickerFilter = '';
  pendingMaternityRecordId = '';
  formData: ZagsActForm = this.createDefaultForm();
  typeOptions: SelectOption[] = [
    { value: 'Marriage', label: 'Брак' },
    { value: 'BirthCertificate', label: 'Рождение' },
    { value: 'Death', label: 'Смерть' },
  ];
  statusOptions: SelectOption[] = [
    { value: 'DRAFT', label: 'Черновик' },
    { value: 'REGISTERED', label: 'Зарегистрирован' },
    { value: 'UPDATED', label: 'Обновлен' },
    { value: 'CANCELLED', label: 'Отменен' },
    { value: 'ARCHIVED', label: 'Архив' },
  ];

  showDeleteModal = false;
  deletingRecord: ZagsActItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(
    private readonly zagsActsService: ZagsActsService,
    private readonly maternityRecordsService: MaternityRecordsService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.resolveCurrentUserId();
    this.loadRecords();
    this.route.queryParamMap.subscribe((params) => {
      const action = params.get('action');
      if (!action) {
        return;
      }

      if (action === 'birth') {
        this.openCreate();
        this.formData.actType = 'BirthCertificate';
        return;
      }

      if (action === 'marriage') {
        this.openCreate();
        this.formData.actType = 'Marriage';
        return;
      }

      this.filters = { actNumber: '', fullName: '', status: '' };
    });
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

  openChildren(row: ZagsActItem): void {
    if (row.childrenCount === 0) {
      return;
    }

    this.childrenModalTitle = row.fatherPersonId
      ? `Дети по ID отца ${row.fatherPersonId}`
      : `Дети по акту №${row.actNumber}`;
    this.selectedChildren = row.childrenRecords;
    this.showChildrenModal = true;
  }

  closeChildrenModal(): void {
    this.showChildrenModal = false;
    this.selectedChildren = [];
    this.childrenModalTitle = '';
  }

  loadRecords(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      zagsRecords: this.zagsActsService.getAll(),
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
    const source = row.source;
    this.formData = {
      actType: this.toFormActType(source.actType),
      actNumber: row.actNumber === '-' ? this.generateActNumber() : row.actNumber,
      registrationDate: row.registrationDateRaw,
      placeOfRegistration: row.placeOfRegistration === '-' ? '' : row.placeOfRegistration,
      status: this.normalizeActStatus(row.status),
      maternityRecordId: source.maternityRecordId?.toString() ?? '',
      birthDate: source.birthDetails?.birthDate?.slice(0, 10) ?? row.birthDateRaw,
      birthPlace: source.birthDetails?.birthPlace?.trim() ?? (row.birthPlace === '-' ? '' : row.birthPlace),
      childFullName: source.birthDetails?.childFullName?.trim() ?? row.childrenRecords[0]?.childFullName ?? '',
      fatherFullName: source.birthDetails?.fatherFullName?.trim() ?? (row.fatherFullName === '-' ? '' : row.fatherFullName),
      motherFullName: source.birthDetails?.motherFullName?.trim() ?? (row.motherFullName === '-' ? '' : row.motherFullName),
      birthScenario: this.inferBirthScenario(source),
      marriageDate: source.marriageDetails?.marriageDate?.slice(0, 10) ?? '',
      marriagePlace: source.marriageDetails?.marriagePlace?.trim() ?? '',
      spouseOneFullName: source.marriageDetails?.spouseOneFullName?.trim() ?? '',
      spouseTwoFullName: source.marriageDetails?.spouseTwoFullName?.trim() ?? '',
      deathDate: source.deathDetails?.deathDate?.slice(0, 10) ?? '',
      deceasedFullName: source.deathDetails?.deceasedFullName?.trim() ?? '',
      deathPlace: source.deathDetails?.deathPlace?.trim() ?? '',
      deathReason: source.deathDetails?.deathReason?.trim() ?? '',
    };
    const matchedMaternityRecord = this.findMaternityRecordForSource(source);
    if (matchedMaternityRecord && !this.formData.maternityRecordId) {
      this.formData.maternityRecordId = matchedMaternityRecord.id.toString();
    }
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (this.isFormSubmitting) {
      return;
    }
    this.showFormModal = false;
  }

  openMaternityPicker(): void {
    this.pendingMaternityRecordId = this.formData.maternityRecordId;
    this.maternityPickerFilter = '';
    this.showMaternityPickerModal = true;
  }

  closeMaternityPicker(): void {
    this.showMaternityPickerModal = false;
    this.pendingMaternityRecordId = '';
    this.maternityPickerFilter = '';
  }

  selectPendingMaternityRecord(recordId: number): void {
    this.pendingMaternityRecordId = recordId.toString();
  }

  confirmMaternityPicker(): void {
    if (!this.pendingMaternityRecordId) {
      this.formErrorMessage = 'Выберите запись роддома.';
      return;
    }

    this.onMaternityRecordSelected(this.pendingMaternityRecordId);
    this.showMaternityPickerModal = false;
    this.pendingMaternityRecordId = '';
    this.maternityPickerFilter = '';
  }

  clearMaternityRecordSelection(): void {
    this.onMaternityRecordSelected(null);
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
        ? this.zagsActsService.update(this.editingRecordId, payload)
        : this.zagsActsService.create(payload);

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

    this.zagsActsService
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

  getGenderLabel(gender: string | null): string {
    return gender === 'FEMALE' || gender === 'F' ? 'Женский' : 'Мужской';
  }

  getStatusLabel(status: string | null): string {
    const normalized = (status || '').trim().toUpperCase();
    const labels: Record<string, string> = {
      DRAFT: 'Черновик',
      REGISTERED: 'Зарегистрирован',
      UPDATED: 'Исправлен',
      CANCELLED: 'Отменен',
      ARCHIVED: 'Архив',
      REGISTERED_BY_ZAGS: 'Зарегистрирован',
      SUBMITTED_TO_ZAGS: 'Передан',
    };

    if (labels[normalized]) {
      return labels[normalized];
    }

    if (status === 'Registered') {
      return 'Зарегистрирован';
    }
    if (status === 'Transferred') {
      return 'Передан';
    }
    if (status === 'Archived') {
      return 'Архив';
    }

    return 'Черновик';
  }

  getTypeLabel(type: ZagsActType): string {
    const labels: Record<ZagsActType, string> = {
      BIRTH: 'Рождение',
      MARRIAGE: 'Брак',
      DEATH: 'Смерть',
    };
    return labels[type];
  }

  private toFormActType(type: ZagsActType): ZagsActForm['actType'] {
    const mapping: Record<ZagsActType, ZagsActForm['actType']> = {
      BIRTH: 'BirthCertificate',
      MARRIAGE: 'Marriage',
      DEATH: 'Death',
    };
    return mapping[type];
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

  get selectedMaternityRecord(): ApiMaternityRecord | null {
    return this.getSelectedMaternityRecord();
  }

  get selectedMaternityRecordSummary(): string {
    const record = this.selectedMaternityRecord;
    if (!record) {
      return 'Запись роддома не выбрана';
    }

    const childName = record.childFullName?.trim() || 'ФИО ребёнка не указано';
    const birthDate = this.formatDate(record.birthDateTime);
    const birthPlace = record.placeOfBirth?.trim() || 'место не указано';
    return `${childName}, ${birthDate}, ${birthPlace}`;
  }

  get maternityPickerRecords(): MaternityPickerItem[] {
    return this.maternityRecords
      .slice()
      .sort((a, b) => b.id - a.id)
      .map((record) => {
        const linkedAct = this.findZagsActForMaternityRecord(record);
        const childFullName = record.childFullName?.trim() || 'ФИО ребёнка не указано';
        const motherFullName = record.motherFullName?.trim() || 'не указана';
        const fatherFullName = record.fatherFullName?.trim() || 'не указан';
        const birthDate = this.formatDate(record.birthDateTime);
        const birthPlace = record.placeOfBirth?.trim() || 'не указано';
        const status = this.getStatusLabel(this.normalizeStatus(record.status));
        const gender = this.getGenderLabel(this.normalizeGender(record.gender));
        const searchText = [
          record.id,
          childFullName,
          motherFullName,
          fatherFullName,
          birthPlace,
          birthDate,
        ]
          .join(' ')
          .toLowerCase();

        return {
          id: record.id,
          childFullName,
          motherFullName,
          fatherFullName,
          birthDate,
          birthPlace,
          status,
          gender,
          isAlreadyInZags: !!linkedAct,
          linkedZagsActId: linkedAct?.id ?? null,
          searchText,
        };
      });
  }

  get filteredMaternityPickerRecords(): MaternityPickerItem[] {
    const query = this.maternityPickerFilter.trim().toLowerCase();
    if (!query) {
      return this.maternityPickerRecords;
    }

    return this.maternityPickerRecords.filter((record) => record.searchText.includes(query));
  }

  isPendingMaternityRecordSelected(recordId: number): boolean {
    return this.pendingMaternityRecordId === recordId.toString();
  }

  private mapRecord(record: ApiZagsActRecord, maternityRecords: ApiMaternityRecord[]): ZagsActItem {
    const birthDetails = record.birthDetails ?? null;
    const marriageDetails = record.marriageDetails ?? null;
    const deathDetails = record.deathDetails ?? null;
    const { fatherPersonId, childrenRecords } = this.buildChildrenRecords(record, maternityRecords);
    const parentsChildrenCount = childrenRecords.length;
    const primaryDisplay =
      birthDetails?.childFullName?.trim() ||
      marriageDetails?.spouseOneFullName?.trim() ||
      deathDetails?.deceasedFullName?.trim() ||
      (record.actType === 'BIRTH' ? 'Новорожденный' : `ID ${record.id}`);

    return {
      id: record.id,
      actType: record.actType,
      fatherPersonId,
      peopleId: record.citizenId ?? record.id,
      peopleFullName: primaryDisplay,
      userId: record.userId,
      userName: record.userName?.trim() || `ID ${record.userId}`,
      actNumber: record.actNumber?.trim() || '-',
      birthDate: this.formatDate(
        birthDetails?.birthDate ??
          marriageDetails?.marriageDate ??
          deathDetails?.deathDate ??
          record.registrationDate,
      ),
      birthDateRaw:
        this.normalizeDateInput(
          birthDetails?.birthDate ??
            marriageDetails?.marriageDate ??
            deathDetails?.deathDate ??
            record.registrationDate,
        ),
      registrationDate: this.formatDate(record.registrationDate),
      registrationDateRaw: this.normalizeDateInput(record.registrationDate),
      placeOfRegistration: record.placeOfRegistration?.trim() || '-',
      birthPlace:
        birthDetails?.birthPlace?.trim() ||
        marriageDetails?.marriagePlace?.trim() ||
        deathDetails?.deathPlace?.trim() ||
        '-',
      fatherFullName:
        birthDetails?.fatherFullName?.trim() ||
        marriageDetails?.spouseOneFullName?.trim() ||
        deathDetails?.deceasedFullName?.trim() ||
        '-',
      motherFullName:
        birthDetails?.motherFullName?.trim() ||
        marriageDetails?.spouseTwoFullName?.trim() ||
        deathDetails?.deathReason?.trim() ||
        '-',
      childrenInfo: record.actType === 'BIRTH' && parentsChildrenCount > 0 ? `${parentsChildrenCount} детей` : '0',
      childrenCount: record.actType === 'BIRTH' ? parentsChildrenCount : 0,
      parentsChildrenCount: record.actType === 'BIRTH' ? parentsChildrenCount : 0,
      childrenRecords: record.actType === 'BIRTH' ? childrenRecords : [],
      status: record.status?.trim() || '-',
      source: record,
    };
  }

  private buildChildrenRecords(
    record: ApiZagsActRecord,
    maternityRecords: ApiMaternityRecord[],
  ): { fatherPersonId: number | null; childrenRecords: ZagsChildItem[] } {
    if (record.actType !== 'BIRTH') {
      return { fatherPersonId: null, childrenRecords: [] };
    }

    let fatherPersonId = record.birthDetails?.fatherCitizenId && record.birthDetails.fatherCitizenId > 0
      ? record.birthDetails.fatherCitizenId
      : record.citizenId && record.citizenId > 0
        ? record.citizenId
        : null;
    const father = this.normalizeName(record.birthDetails?.fatherFullName ?? null);
    const mother = this.normalizeName(record.birthDetails?.motherFullName ?? null);

    let linked: ApiMaternityRecord[] = [];

    if (fatherPersonId) {
      linked = maternityRecords.filter((item) => item.fatherPersonId === fatherPersonId);
    }

    if (linked.length === 0 && record.maternityRecordId) {
      linked = maternityRecords.filter((item) => item.id === record.maternityRecordId);
    }

    if (linked.length === 0 && record.birthDetails?.childFullName) {
      linked = maternityRecords.filter(
        (item) =>
          this.normalizeName(item.childFullName) === this.normalizeName(record.birthDetails?.childFullName ?? '') &&
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

  private buildPayload(): CreateZagsActRequest | null {
    if (this.resolvedUserId === null) {
      this.formErrorMessage = 'Не удалось определить текущего пользователя.';
      return null;
    }

    const actNumber = this.formData.actNumber.trim() || this.generateActNumber();
    if (!this.formData.registrationDate) {
      this.formErrorMessage = 'Укажите дату регистрации.';
      return null;
    }

    if (!this.formData.placeOfRegistration.trim()) {
      this.formErrorMessage = 'Укажите место регистрации.';
      return null;
    }

    if (this.formData.actType === 'BirthCertificate') {
      const payloadFields = this.buildBirthPayloadFields();
      if (!payloadFields) {
        return null;
      }
      const maternityRecord = this.getSelectedMaternityRecord();
      if (!maternityRecord) {
        this.formErrorMessage = 'Выберите запись роддома.';
        return null;
      }

      return {
        actNumber,
        actType: 'BIRTH',
        status: this.normalizeActStatus(this.formData.status),
        registrationDate: this.formData.registrationDate,
        placeOfRegistration: this.formData.placeOfRegistration.trim(),
        userId: this.resolvedUserId,
        citizenId: maternityRecord.childCitizenId ?? null,
        maternityRecordId: maternityRecord.id,
        birthDetails: {
          childCitizenId: maternityRecord.childCitizenId ?? null,
          birthCaseType: this.mapBirthScenarioToCaseType(this.formData.birthScenario as BirthScenario),
          childFullName: this.formData.childFullName.trim(),
          birthDate: payloadFields.eventDate,
          birthPlace: payloadFields.place,
          motherFullName: payloadFields.secondaryPerson,
          fatherFullName: payloadFields.primaryPerson,
          fatherCitizenId: maternityRecord.fatherPersonId ?? null,
        },
      };
    }

    if (this.formData.actType === 'Marriage') {
      const payloadFields = this.buildMarriagePayloadFields();
      if (!payloadFields) {
        return null;
      }

      return {
        actNumber,
        actType: 'MARRIAGE',
        status: this.normalizeActStatus(this.formData.status),
        registrationDate: this.formData.registrationDate,
        placeOfRegistration: this.formData.placeOfRegistration.trim(),
        userId: this.resolvedUserId,
        marriageDetails: {
          spouseOneFullName: payloadFields.primaryPerson,
          spouseTwoFullName: payloadFields.secondaryPerson,
          marriageDate: payloadFields.eventDate,
          marriagePlace: payloadFields.place,
        },
      };
    }

    const payloadFields = this.buildDeathPayloadFields();
    if (!payloadFields) {
      return null;
    }

    return {
      actNumber,
      actType: 'DEATH',
      status: this.normalizeActStatus(this.formData.status),
      registrationDate: this.formData.registrationDate,
      placeOfRegistration: this.formData.placeOfRegistration.trim(),
      userId: this.resolvedUserId,
      deathDetails: {
        deceasedFullName: payloadFields.primaryPerson,
        deathDate: payloadFields.eventDate,
        deathPlace: payloadFields.place,
        deathReason: payloadFields.secondaryPerson,
      },
    };
  }

  private createDefaultForm(): ZagsActForm {
    return {
      actType: 'BirthCertificate',
      actNumber: this.generateActNumber(),
      registrationDate: '',
      placeOfRegistration: '',
      status: 'DRAFT',
      birthScenario: 'standard',
      maternityRecordId: '',
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

  onMaternityRecordSelected(value: string | number | null): void {
    const selected = this.getSelectedMaternityRecord(value);
    if (!selected) {
      this.formData.maternityRecordId = '';
      this.formData.birthDate = '';
      this.formData.birthPlace = '';
      this.formData.childFullName = '';
      this.formData.fatherFullName = '';
      this.formData.motherFullName = '';
      return;
    }

    this.formData.maternityRecordId = selected.id.toString();
    this.formData.birthDate = this.normalizeDateInput(selected.birthDateTime);
    this.formData.birthPlace = selected.placeOfBirth?.trim() ?? '';
    this.formData.childFullName = selected.childFullName?.trim() ?? '';
    this.formData.fatherFullName = selected.fatherFullName?.trim() ?? '';
    this.formData.motherFullName = selected.motherFullName?.trim() ?? '';
    this.formData.birthScenario = this.inferBirthScenario(selected);
  }

  private resolveCurrentUserId(): void {
    this.resolvedUserId = this.authService.resolveCurrentUserId();
  }

  private buildBirthPayloadFields(): { eventDate: string; place: string; primaryPerson: string; secondaryPerson: string } | null {
    if (this.formData.actType === 'BirthCertificate') {
      const selected = this.getSelectedMaternityRecord();
      if (!selected) {
        this.formErrorMessage = 'Выберите запись роддома.';
        return null;
      }

      if (!this.formData.childFullName.trim()) {
        this.formErrorMessage = 'Укажите ФИО ребенка.';
        return null;
      }

      const birthDate = this.formData.birthDate || this.normalizeDateInput(selected.birthDateTime);
      const birthPlace = this.formData.birthPlace.trim() || selected.placeOfBirth?.trim() || '';
      const fatherFullName = this.formData.fatherFullName.trim() || selected.fatherFullName?.trim() || '';
      const motherFullName = this.formData.motherFullName.trim() || selected.motherFullName?.trim() || '';

      if (!birthDate) {
        this.formErrorMessage = 'Укажите дату рождения.';
        return null;
      }
      if (!birthPlace) {
        this.formErrorMessage = 'Укажите место рождения.';
        return null;
      }
      if (!fatherFullName || !motherFullName) {
        this.formErrorMessage = 'Укажите ФИО отца и матери.';
        return null;
      }

      return {
        eventDate: birthDate,
        place: birthPlace,
        primaryPerson: fatherFullName,
        secondaryPerson: motherFullName,
      };
    }

    return null;
  }

  private buildMarriagePayloadFields(): { eventDate: string; place: string; primaryPerson: string; secondaryPerson: string } | null {
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

  private buildDeathPayloadFields(): { eventDate: string; place: string; primaryPerson: string; secondaryPerson: string } | null {
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

  private getSelectedMaternityRecord(value?: string | number | null): ApiMaternityRecord | null {
    const rawValue = value ?? this.formData.maternityRecordId;
    const maternityRecordId = Number(rawValue);
    if (!Number.isInteger(maternityRecordId) || maternityRecordId <= 0) {
      return null;
    }

    return this.maternityRecords.find((record) => record.id === maternityRecordId) ?? null;
  }

  private findMaternityRecordForSource(source: ApiZagsActRecord): ApiMaternityRecord | null {
    if (source.maternityRecordId && source.maternityRecordId > 0) {
      const byId = this.maternityRecords.find((record) => record.id === source.maternityRecordId);
      if (byId) {
        return byId;
      }
    }

    if (source.actType !== 'BIRTH') {
      return null;
    }

    const childName = this.normalizeName(source.birthDetails?.childFullName ?? null);
    const fatherName = this.normalizeName(source.birthDetails?.fatherFullName ?? null);
    const motherName = this.normalizeName(source.birthDetails?.motherFullName ?? null);
    const birthDate = this.normalizeDateInput(source.birthDetails?.birthDate ?? null);

    return (
      this.maternityRecords.find((record) => {
        const recordChild = this.normalizeName(record.childFullName ?? null);
        const recordFather = this.normalizeName(record.fatherFullName ?? null);
        const recordMother = this.normalizeName(record.motherFullName ?? null);
        const recordBirthDate = this.normalizeDateInput(record.birthDateTime);

        const childMatches = !childName || recordChild === childName || !recordChild;
        const fatherMatches = !fatherName || recordFather === fatherName;
        const motherMatches = !motherName || recordMother === motherName;
        const birthMatches = !birthDate || recordBirthDate === birthDate;

        return childMatches && fatherMatches && motherMatches && birthMatches;
      }) ?? null
    );
  }

  private findZagsActForMaternityRecord(record: ApiMaternityRecord): ZagsActItem | null {
    const matchedById = this.records.find(
      (item) =>
        item.actType === 'BIRTH' &&
        item.source.maternityRecordId === record.id &&
        (!this.isEditMode || item.id !== this.editingRecordId),
    );

    if (matchedById) {
      return matchedById;
    }

    const recordChild = this.normalizeName(record.childFullName ?? null);
    const recordFather = this.normalizeName(record.fatherFullName ?? null);
    const recordMother = this.normalizeName(record.motherFullName ?? null);
    const recordBirthDate = this.normalizeDateInput(record.birthDateTime);

    return (
      this.records.find((item) => {
        if (item.actType !== 'BIRTH' || (this.isEditMode && item.id === this.editingRecordId)) {
          return false;
        }

        const source = item.source.birthDetails;
        return (
          this.normalizeName(source?.childFullName ?? null) === recordChild &&
          this.normalizeName(source?.fatherFullName ?? null) === recordFather &&
          this.normalizeName(source?.motherFullName ?? null) === recordMother &&
          this.normalizeDateInput(source?.birthDate ?? null) === recordBirthDate
        );
      }) ?? null
    );
  }

  private inferBirthScenario(record: { birthDetails?: { birthCaseType?: string | null } | null; birthCaseType?: string | null }): BirthScenario {
    const birthCaseType = record.birthDetails?.birthCaseType ?? record.birthCaseType ?? null;
    if (birthCaseType === 'OUT_OF_WEDLOCK') {
      return 'outside_marriage';
    }
    if (birthCaseType === 'UNREGISTERED_MARRIAGE') {
      return 'unregistered_marriage';
    }
    if (birthCaseType === 'RELATIVE_WITHOUT_ZAGS') {
      return 'relative_without_zags';
    }
    if (birthCaseType === 'GUARDIANSHIP') {
      return 'guardianship';
    }
    return 'standard';
  }

  private mapBirthScenarioToCaseType(scenario: BirthScenario): string {
    const mapped: Record<BirthScenario, string> = {
      standard: 'STANDARD_MARRIAGE',
      outside_marriage: 'OUT_OF_WEDLOCK',
      unregistered_marriage: 'UNREGISTERED_MARRIAGE',
      relative_without_zags: 'RELATIVE_WITHOUT_ZAGS',
      guardianship: 'GUARDIANSHIP',
    };

    return mapped[scenario];
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
    if (status === 'REGISTERED_BY_ZAGS' || status === 'DRAFT' || status === 'SUBMITTED_TO_ZAGS' || status === 'ARCHIVED') {
      return status;
    }
    if (status === 'Registered') {
      return 'REGISTERED_BY_ZAGS';
    }
    if (status === 'Transferred') {
      return 'SUBMITTED_TO_ZAGS';
    }
    if (status === 'Pending') {
      return 'DRAFT';
    }
    return 'DRAFT';
  }

  private normalizeActStatus(status: string | null): ZagsActStatus {
    const normalized = (status || '').trim().toUpperCase();
    if (
      normalized === 'DRAFT' ||
      normalized === 'REGISTERED' ||
      normalized === 'UPDATED' ||
      normalized === 'CANCELLED' ||
      normalized === 'ARCHIVED'
    ) {
      return normalized;
    }

    if (normalized === 'REGISTERED_BY_ZAGS' || normalized === 'REGISTERED' || normalized === 'REGISTERED ') {
      return 'REGISTERED';
    }

    if (normalized === 'PENDING' || normalized === 'DRAFT ') {
      return 'DRAFT';
    }

    return 'DRAFT';
  }

  private normalizeGender(gender: string | null): MaternityGender {
    if (gender === 'FEMALE' || gender === 'F') {
      return 'FEMALE';
    }
    return 'MALE';
  }

  private buildSyntheticId(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) + 500000;
  }

}
