import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap, TimeoutError, timeout } from 'rxjs';
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
  ApiEducationInstitution,
  ApiSchoolRecord,
  CreateSchoolRecordRequest,
  SchoolRecordsService,
} from '../../../services/school-records.service';
import { AuthService } from '../../../services/auth.service';
import {
  CitizenLinksService,
  CitizenLinksSnapshot,
  LinkedCitizenProfile,
} from '../../../services/citizen-links.service';
import {
  CreateEducationInstitutionRequest,
  EducationInstitutionsService,
} from '../../../services/education-institutions.service';

type SchoolStatus = 'Учится' | 'Закончил' | 'Отчислен';

interface SchoolRecordItem {
  id: number;
  citizenId: number;
  peopleId: number;
  peopleFullName: string;
  birthDate: string;
  fatherFullName: string;
  motherFullName: string;
  familyLabel: string;
  addressLabel: string;
  passportNumber: string;
  institutionId: number;
  institutionName: string;
  classNumber: number;
  status: SchoolStatus;
  admissionDate: string;
  admissionDateRaw: string;
  graduationDate: string;
  graduationDateRaw: string;
  expulsionDate: string;
  expulsionDateRaw: string;
  isStudying: 'Да' | 'Нет';
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
  status: SchoolStatus;
  comment: string;
}

@Component({
  selector: 'app-school-study-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, SelectComponent, ButtonComponent, ModalComponent],
  templateUrl: './school-study-list.component.html',
  styleUrl: './school-study-list.component.css',
})
export class SchoolStudyListComponent implements OnInit {
  filters = {
    fullName: '',
    classNumber: '',
    institutionId: 'all',
  };

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'peopleFullName', label: 'Гражданин', sortable: true },
    { key: 'birthDate', label: 'Дата рождения', sortable: true },
    { key: 'fatherFullName', label: 'Отец', sortable: true },
    { key: 'motherFullName', label: 'Мать', sortable: true },
    { key: 'familyLabel', label: 'Семья', sortable: true },
    { key: 'addressLabel', label: 'Адрес', sortable: true },
    { key: 'passportNumber', label: 'Паспорт', sortable: true },
    { key: 'institutionName', label: 'Учреждение', sortable: true },
    { key: 'classNumber', label: 'Класс', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'admissionDate', label: 'Поступление', sortable: true },
    { key: 'graduationDate', label: 'Выпуск', sortable: true },
    { key: 'expulsionDate', label: 'Отчисление', sortable: true },
    { key: 'isStudying', label: 'Обучается', sortable: true },
    { key: 'userName', label: 'Кто создал', sortable: true },
    { key: 'comment', label: 'Комментарий', sortable: false },
  ];

  records: SchoolRecordItem[] = [];
  peopleOptions: SelectOption[] = [];
  institutionOptions: SelectOption[] = [{ value: 'all', label: 'Все учреждения' }];
  statusOptions: SelectOption[] = [
    { value: 'Учится', label: 'Учится' },
    { value: 'Закончил', label: 'Закончил' },
    { value: 'Отчислен', label: 'Отчислен' },
  ];

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

  private citizens: ApiCitizen[] = [];
  private linksSnapshot: CitizenLinksSnapshot | null = null;
  linkedInstitutionId: number | null = null;

  constructor(
    private readonly schoolRecordsService: SchoolRecordsService,
    private readonly citizenLinksService: CitizenLinksService,
    private readonly authService: AuthService,
    private readonly educationInstitutionsService: EducationInstitutionsService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
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

      this.filters.fullName = '';
      this.filters.institutionId = 'all';
      this.filters.classNumber = '11';
    });
  }

  get filteredRecords(): SchoolRecordItem[] {
    const byName = this.filters.fullName.trim().toLowerCase();
    const byClass = this.filters.classNumber.trim().toLowerCase();
    const institutionFilter = this.filters.institutionId;

    return this.records.filter((record) => {
      const matchesName = !byName || record.peopleFullName.toLowerCase().includes(byName);
      const matchesClass = !byClass || record.classNumber.toString().toLowerCase().includes(byClass);
      const matchesInstitution = institutionFilter === 'all' || record.institutionId.toString() === institutionFilter;
      return matchesName && matchesClass && matchesInstitution;
    });
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Изменить запись обучения' : 'Добавить запись обучения';
  }

  get currentSelectedFather(): string {
    const profile = this.findSelectedCitizenProfile();
    return profile?.father?.fullName?.trim() || profile?.citizen.fatherFullName?.trim() || '';
  }

  get currentSelectedMother(): string {
    const profile = this.findSelectedCitizenProfile();
    return profile?.mother?.fullName?.trim() || profile?.citizen.motherFullName?.trim() || '';
  }

  get currentSelectedBirthDate(): string {
    const profile = this.findSelectedCitizenProfile();
    return profile?.citizen.birthDate ? this.formatDate(profile.citizen.birthDate) : '';
  }

  get currentSelectedAddress(): string {
    const profile = this.findSelectedCitizenProfile();
    return profile?.address?.fullAddress?.trim() || '';
  }

  get currentSelectedPassport(): string {
    const profile = this.findSelectedCitizenProfile();
    return profile?.passport?.passportNumber?.trim() || '';
  }

  get currentSelectedFamily(): string {
    const profile = this.findSelectedCitizenProfile();
    return profile?.family ? this.formatFamilyLabel(profile) : '';
  }

  get selectedSchoolName(): string {
    const selectedId = Number(this.formData.institutionId || this.linkedInstitutionId);
    const selectedOption = this.institutionOptions.find((option) => Number(option.value) === selectedId);
    return selectedOption?.label || this.authService.getCurrentUser()?.organizationName?.trim() || 'Школа';
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      records: this.schoolRecordsService.getAll(),
      citizens: this.schoolRecordsService.getCitizens(),
      institutions: this.schoolRecordsService.getInstitutions(),
      links: this.citizenLinksService.getSnapshot().pipe(catchError(() => of(this.createEmptyLinksSnapshot()))),
    })
      .pipe(
        timeout(15000),
        switchMap(({ records, citizens, institutions, links }) =>
          this.resolveSchoolInstitution(institutions).pipe(
            map(({ institutions: resolvedInstitutions, linkedInstitutionId }) => ({
              records,
              citizens,
              institutions: resolvedInstitutions,
              links,
              linkedInstitutionId,
            })),
          ),
        ),
      )
      .subscribe({
        next: ({ records, citizens, institutions, links, linkedInstitutionId }) => {
          this.citizens = citizens;
          this.linksSnapshot = links;
          this.linkedInstitutionId = linkedInstitutionId;

          const visibleInstitutions = this.linkedInstitutionId
            ? institutions.filter((institution) => institution.id === this.linkedInstitutionId)
            : institutions.filter((institution) => this.isSchoolInstitution(institution));
          const visibleRecords = this.linkedInstitutionId
            ? records.filter((record) => record.institutionId === this.linkedInstitutionId)
            : records.filter((record) => visibleInstitutions.some((institution) => institution.id === record.institutionId));

          this.peopleOptions = this.buildPeopleOptions(citizens);
          this.institutionOptions = [
            { value: 'all', label: 'Все учреждения' },
            ...visibleInstitutions.map((institution) => ({
              value: institution.id.toString(),
              label: this.formatInstitutionLabel(institution),
            })),
          ];
          this.records = visibleRecords.map((record) => this.mapRecord(record));

          if (this.linkedInstitutionId) {
            this.filters.institutionId = this.linkedInstitutionId.toString();
          }

          if (!this.institutionOptions[1]) {
            this.errorMessage = 'Для этой школы ещё не создано учебное учреждение. Оно будет создано автоматически при следующем обновлении или через админа.';
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.records = [];
          this.peopleOptions = [];
          this.institutionOptions = [{ value: 'all', label: 'Все учреждения' }];
          this.citizens = [];
          this.linksSnapshot = null;
          this.linkedInstitutionId = null;
          this.errorMessage = error instanceof TimeoutError
            ? 'Превышено время ожидания ответа API.'
            : 'Не удалось загрузить реестр обучения.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingRecordId = null;
    this.formData = this.createDefaultForm();
    if (this.linkedInstitutionId) {
      this.formData.institutionId = this.linkedInstitutionId.toString();
    } else if (!this.formData.institutionId && this.institutionOptions[1]) {
      this.formData.institutionId = this.institutionOptions[1].value.toString();
    }
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  openEdit(row: SchoolRecordItem): void {
    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.formData = {
      peopleId: row.citizenId.toString(),
      institutionId: row.institutionId.toString(),
      classNumber: row.classNumber.toString(),
      admissionDate: row.admissionDateRaw,
      graduationDate: row.graduationDateRaw,
      expulsionDate: row.expulsionDateRaw,
      status: row.status,
      comment: row.comment === '-' ? '' : row.comment,
    };
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (!this.isFormSubmitting) {
      this.showFormModal = false;
    }
  }

  onStatusChanged(value: string | number | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.formData.status = value as SchoolStatus;
    if (value === 'Учится') {
      this.formData.graduationDate = '';
      this.formData.expulsionDate = '';
    } else if (value === 'Закончил') {
      this.formData.expulsionDate = '';
    } else {
      this.formData.graduationDate = '';
    }
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
            this.formErrorMessage = this.isEditMode ? 'Не удалось изменить запись.' : 'Не удалось создать запись.';
            return;
          }
          this.showFormModal = false;
          this.loadData();
        },
        error: () => {
          this.formErrorMessage = this.isEditMode ? 'Не удалось изменить запись.' : 'Не удалось создать запись.';
        },
      });
  }

  openDelete(row: SchoolRecordItem): void {
    this.deletingRecord = row;
    this.deleteErrorMessage = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (!this.isDeleting) {
      this.showDeleteModal = false;
      this.deletingRecord = null;
      this.deleteErrorMessage = '';
    }
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

  getStatusLabel(status: string): string {
    return status;
  }

  private mapRecord(record: ApiSchoolRecord): SchoolRecordItem {
    const status = this.deriveStatus(record);
    const profile = this.findCitizenProfileById(record.citizenId ?? record.peopleId);
    return {
      id: record.id,
      citizenId: record.citizenId ?? record.peopleId,
      peopleId: record.peopleId,
      peopleFullName: record.peopleFullName?.trim() || `ID ${record.peopleId}`,
      birthDate: profile?.citizen.birthDate ? this.formatDate(profile.citizen.birthDate) : '-',
      fatherFullName: record.fatherFullName?.trim() || '-',
      motherFullName: record.motherFullName?.trim() || '-',
      familyLabel: profile ? this.formatFamilyLabel(profile) : '-',
      addressLabel: profile?.address?.fullAddress?.trim() || '-',
      passportNumber: profile?.passport?.passportNumber?.trim() || 'Нет паспорта',
      institutionId: record.institutionId,
      institutionName: record.institutionName?.trim() || `ID ${record.institutionId}`,
      classNumber: record.classNumber ?? 0,
      status,
      admissionDate: this.formatDate(record.admissionDate),
      admissionDateRaw: this.normalizeDateInput(record.admissionDate),
      graduationDate: this.formatDate(record.graduationDate),
      graduationDateRaw: this.normalizeDateInput(record.graduationDate),
      expulsionDate: this.formatDate(record.expulsionDate),
      expulsionDateRaw: this.normalizeDateInput(record.expulsionDate),
      isStudying: record.isStudying ? 'Да' : 'Нет',
      userName: record.userName?.trim() || '-',
      comment: record.comment?.trim() || '-',
    };
  }

  private buildPayload(): CreateSchoolRecordRequest | null {
    const peopleId = Number(this.formData.peopleId);
    const institutionId = Number(this.formData.institutionId);
    const classNumber = Number(this.formData.classNumber);

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.formErrorMessage = 'Выберите гражданина.';
      return null;
    }
    if (!Number.isInteger(institutionId) || institutionId <= 0) {
      this.formErrorMessage = 'Выберите школу.';
      return null;
    }
    if (!Number.isInteger(classNumber) || classNumber <= 0) {
      this.formErrorMessage = 'Укажите корректный класс.';
      return null;
    }
    if (!this.formData.admissionDate.trim()) {
      this.formErrorMessage = 'Укажите дату зачисления.';
      return null;
    }

    let graduationDate = this.formData.graduationDate.trim() ? this.toIsoDate(this.formData.graduationDate) : null;
    let expulsionDate = this.formData.expulsionDate.trim() ? this.toIsoDate(this.formData.expulsionDate) : null;

    if (this.formData.status === 'Учится') {
      graduationDate = null;
      expulsionDate = null;
    } else if (this.formData.status === 'Закончил') {
      if (!graduationDate) {
        this.formErrorMessage = 'Укажите дату выпуска.';
        return null;
      }
      expulsionDate = null;
    } else if (this.formData.status === 'Отчислен') {
      if (!expulsionDate) {
        this.formErrorMessage = 'Укажите дату отчисления.';
        return null;
      }
      graduationDate = null;
    }

    return {
      peopleId,
      institutionId,
      classNumber,
      admissionDate: this.toIsoDate(this.formData.admissionDate),
      graduationDate,
      expulsionDate,
      comment: this.formData.comment.trim(),
    };
  }

  private findSelectedCitizenProfile(): LinkedCitizenProfile | null {
    return this.findCitizenProfileById(Number(this.formData.peopleId));
  }

  private findCitizenProfileById(citizenId: number): LinkedCitizenProfile | null {
    if (!this.linksSnapshot || !Number.isInteger(citizenId) || citizenId <= 0) {
      return null;
    }
    return this.citizenLinksService.buildCitizenProfile(this.linksSnapshot, citizenId);
  }

  private buildPeopleOptions(citizens: ApiCitizen[]): SelectOption[] {
    return citizens
      .slice()
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
      .map((citizen) => ({
        value: citizen.id.toString(),
        label: this.formatCitizenOption(citizen),
      }));
  }

  private formatCitizenOption(citizen: ApiCitizen): string {
    if (this.linksSnapshot) {
      const profile = this.citizenLinksService.buildCitizenProfile(this.linksSnapshot, citizen.id);
      if (profile) {
        const parts: string[] = [];
        if (profile.father?.fullName?.trim() || profile.citizen.fatherFullName?.trim()) {
          parts.push(`отец: ${profile.father?.fullName?.trim() || profile.citizen.fatherFullName?.trim()}`);
        }
        if (profile.mother?.fullName?.trim() || profile.citizen.motherFullName?.trim()) {
          parts.push(`мать: ${profile.mother?.fullName?.trim() || profile.citizen.motherFullName?.trim()}`);
        }
        return parts.length > 0 ? `${profile.citizen.fullName} (${parts.join(', ')})` : profile.citizen.fullName;
      }
    }

    return this.formatCitizenLabel(citizen);
  }

  private formatCitizenLabel(citizen: ApiCitizen): string {
    const parts: string[] = [];
    if (citizen.fatherFullName?.trim()) {
      parts.push(`отец: ${citizen.fatherFullName.trim()}`);
    }
    if (citizen.motherFullName?.trim()) {
      parts.push(`мать: ${citizen.motherFullName.trim()}`);
    }
    return parts.length > 0 ? `${citizen.fullName} (${parts.join(', ')})` : citizen.fullName;
  }

  private formatInstitutionLabel(institution: ApiEducationInstitution): string {
    return institution.name?.trim() || `Школа #${institution.id}`;
  }

  private resolveSchoolInstitution(institutions: ApiEducationInstitution[]) {
    const organizationName = this.authService.getCurrentUser()?.organizationName?.trim() || '';
    const linkedInstitution = this.findLinkedSchoolInstitution(institutions, organizationName);
    if (linkedInstitution) {
      return of({
        institutions,
        linkedInstitutionId: linkedInstitution.id,
      });
    }

    if (!organizationName) {
      return of({
        institutions,
        linkedInstitutionId: null,
      });
    }

    const payload: CreateEducationInstitutionRequest = {
      name: organizationName,
      type: 'SCHOOL',
      address: '',
      description: 'Автоматически создано из кабинета школы',
    };

    return this.educationInstitutionsService.createRecord(payload).pipe(
      map((created) => ({
        institutions: [...institutions, created],
        linkedInstitutionId: created.id,
      })),
      catchError(() =>
        of({
          institutions,
          linkedInstitutionId: null,
        }),
      ),
    );
  }

  private findLinkedSchoolInstitution(
    institutions: ApiEducationInstitution[],
    organizationName: string,
  ): ApiEducationInstitution | null {
    const schoolInstitutions = institutions.filter((institution) => this.isSchoolInstitution(institution));
    if (!schoolInstitutions.length) {
      return null;
    }

    const normalizedOrganizationName = this.normalizeText(organizationName);
    const exactMatch = schoolInstitutions.find(
      (institution) => this.normalizeText(institution.name) === normalizedOrganizationName,
    );
    if (exactMatch) {
      return exactMatch;
    }

    const partialMatch = schoolInstitutions.find((institution) => {
      const institutionName = this.normalizeText(institution.name);
      return !!normalizedOrganizationName && (
        institutionName.includes(normalizedOrganizationName) ||
        normalizedOrganizationName.includes(institutionName)
      );
    });
    if (partialMatch) {
      return partialMatch;
    }

    return schoolInstitutions.length === 1 ? schoolInstitutions[0] : null;
  }

  private isSchoolInstitution(institution: ApiEducationInstitution): boolean {
    return (institution.type?.trim().toUpperCase() || '') === 'SCHOOL';
  }

  private normalizeText(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }

  private formatFamilyLabel(profile: LinkedCitizenProfile): string {
    const family = profile.family;
    if (!family) {
      return '-';
    }
    const head = family.primaryCitizenFullName?.trim() || family.familyName?.trim() || `Семья #${family.id}`;
    return family.memberCount > 0 ? `${head} (${family.memberCount})` : head;
  }

  private deriveStatus(record: ApiSchoolRecord): SchoolStatus {
    if (record.expulsionDate) {
      return 'Отчислен';
    }
    if (record.graduationDate) {
      return 'Закончил';
    }
    return 'Учится';
  }

  private createDefaultForm(): SchoolRecordForm {
    return {
      peopleId: '',
      institutionId: this.institutionOptions[1]?.value?.toString() || '',
      classNumber: '',
      admissionDate: '',
      graduationDate: '',
      expulsionDate: '',
      status: 'Учится',
      comment: '',
    };
  }

  private createEmptyLinksSnapshot(): CitizenLinksSnapshot {
    return {
      citizens: [],
      families: [],
      addresses: [],
      passports: [],
      schoolRecords: [],
      educationRecords: [],
      medicalRecords: [],
      medicalVisits: [],
      vvkResults: [],
      militaryRecords: [],
      borderCrossings: [],
      zagsActs: [],
    };
  }

  private normalizeDateInput(value: string | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private toIsoDate(value: string): string {
    return new Date(value).toISOString();
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
