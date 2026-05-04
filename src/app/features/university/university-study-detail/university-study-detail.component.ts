import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, TimeoutError, timeout } from 'rxjs';
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
import { AuthService } from '../../../services/auth.service';
import {
  ApiEducationRecord,
  CreateEducationRecordRequest,
  EducationRecordsService,
} from '../../../services/education-records.service';
import {
  ApiEducationInstitution,
  EducationInstitutionsService,
} from '../../../services/education-institutions.service';
import { ApiSchoolRecord, SchoolRecordsService } from '../../../services/school-records.service';
import { ApiMedicalRecord, MedicalRecordsService } from '../../../services/medical-records.service';
import { AddressesService, ApiAddress, ApiCitizen } from '../../../services/addresses.service';
import { PassportRecordsService, ApiPassportRecord } from '../../../services/passport-records.service';

interface EducationRecordRow {
  id: number;
  peopleId: number;
  peopleFullName: string;
  schoolRecordId: number | null;
  schoolGraduationDate: string;
  medicalRecordId: number | null;
  medicalDecision: string;
  fatherFullName: string;
  motherFullName: string;
  studyForm: string;
  faculty: string;
  specialty: string;
  admissionDate: string;
  admissionDateRaw: string;
  graduationDate: string;
  graduationDateRaw: string;
  expulsionDate: string;
  expulsionDateRaw: string;
  isDeferralActive: 'Да' | 'Нет';
  isDeferralActiveValue: boolean;
  userName: string;
}

interface StudyFormData {
  peopleId: string;
  studyForm: string;
  faculty: string;
  specialty: string;
  admissionDate: string;
  graduationDate: string;
  expulsionDate: string;
  isDeferralActive: boolean;
}

@Component({
  selector: 'app-university-study-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    TableComponent,
    ModalComponent,
    SelectComponent,
    InputComponent,
  ],
  templateUrl: './university-study-detail.component.html',
  styleUrl: './university-study-detail.component.css',
})
export class UniversityStudyDetailComponent implements OnInit {
  institutionId: number | null = null;
  institution: ApiEducationInstitution | null = null;
  records: EducationRecordRow[] = [];
  peopleOptions: SelectOption[] = [];
  private graduates: ApiSchoolRecord[] = [];
  private medicalRecords: ApiMedicalRecord[] = [];
  private citizens: ApiCitizen[] = [];
  private addresses: ApiAddress[] = [];
  private passports: ApiPassportRecord[] = [];

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formData: StudyFormData = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: EducationRecordRow | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  educationColumns: TableColumn[] = [
    { key: 'id', label: 'ID записи', sortable: true },
    { key: 'peopleFullName', label: 'ФИО', sortable: true },
    { key: 'fatherFullName', label: 'ФИО отца', sortable: true },
    { key: 'motherFullName', label: 'ФИО матери', sortable: true },
    { key: 'schoolGraduationDate', label: 'Выпуск школы', sortable: true },
    { key: 'medicalDecision', label: 'Медосмотр', sortable: true },
    { key: 'studyForm', label: 'Форма обучения', sortable: true },
    { key: 'faculty', label: 'Факультет', sortable: true },
    { key: 'specialty', label: 'Специальность', sortable: true },
    { key: 'admissionDate', label: 'Поступление', sortable: true },
    { key: 'graduationDate', label: 'Выпуск', sortable: true },
    { key: 'expulsionDate', label: 'Отчисление', sortable: true },
    { key: 'isDeferralActive', label: 'Отсрочка', sortable: true },
    { key: 'userName', label: 'Пользователь', sortable: true },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly educationRecordsService: EducationRecordsService,
    private readonly educationInstitutionsService: EducationInstitutionsService,
    private readonly schoolRecordsService: SchoolRecordsService,
    private readonly medicalRecordsService: MedicalRecordsService,
    private readonly addressesService: AddressesService,
    private readonly passportRecordsService: PassportRecordsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Некорректный идентификатор учебного заведения.';
      return;
    }

    this.institutionId = id;
    this.loadData(id);
    this.route.queryParamMap.subscribe((params) => {
      const action = params.get('action');
      if (action === 'create') {
        this.openCreateModal();
      }
    });
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Изменение записи об обучении' : 'Добавление записи об обучении';
  }

  get pageTitle(): string {
    const institutionName = this.institution?.name?.trim();
    const institutionType = this.getInstitutionTypeLabel(this.institution?.type ?? null);
    if (institutionName) {
      return `Реестр студентов: ${institutionName}${institutionType ? ` (${institutionType})` : ''}`;
    }
    return institutionType ? `Реестр студентов (${institutionType})` : 'Реестр студентов';
  }

  get pageDescription(): string {
    return 'Кабинет показывает студентов и учебные записи только этого колледжа или вуза.';
  }

  get currentSelectedFather(): string {
    const graduate = this.findSelectedGraduate();
    return graduate?.fatherFullName?.trim() || '';
  }

  get currentSelectedMother(): string {
    const graduate = this.findSelectedGraduate();
    return graduate?.motherFullName?.trim() || '';
  }

  get currentSelectedPersonName(): string {
    const peopleId = Number(this.formData.peopleId);
    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      return '';
    }
    const citizen = this.citizens.find((item) => item.id === peopleId) ?? null;
    const graduate = this.findSelectedGraduate();
    return citizen?.fullName?.trim() || graduate?.peopleFullName?.trim() || '';
  }

  get currentSelectedGraduationDate(): string {
    const graduate = this.findSelectedGraduate();
    return graduate?.graduationDate ? this.formatDate(graduate.graduationDate) : '';
  }

  get currentSelectedSchoolRecordId(): number | null {
    const graduate = this.findSelectedGraduate();
    return graduate?.id ?? null;
  }

  get currentSelectedMedicalRecordId(): number | null {
    const record = this.findSelectedMedicalRecord();
    return record?.id ?? null;
  }

  get currentSelectedMedicalDecision(): string {
    const record = this.findSelectedMedicalRecord();
    if (!record?.decision) {
      return '';
    }
    return record.decision.toUpperCase() === 'FIT' ? 'Годен' : record.decision;
  }

  get currentSelectedAddress(): string {
    const address = this.findSelectedAddress();
    return address?.fullAddress?.trim() || '';
  }

  get currentSelectedPassport(): string {
    const passport = this.findSelectedPassport();
    return passport?.passportNumber?.trim() || '';
  }

  goBack(): void {
    this.router.navigate(['/university/studies']);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingRecordId = null;
    this.formData = this.createDefaultForm();
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  openEditModal(row: EducationRecordRow): void {
    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.formErrorMessage = '';
    this.formData = {
      peopleId: row.peopleId.toString(),
      studyForm: row.studyForm === '-' ? '' : row.studyForm,
      faculty: row.faculty === '-' ? '' : row.faculty,
      specialty: row.specialty === '-' ? '' : row.specialty,
      admissionDate: row.admissionDateRaw,
      graduationDate: row.graduationDateRaw,
      expulsionDate: row.expulsionDateRaw,
      isDeferralActive: row.isDeferralActiveValue,
    };
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (this.isFormSubmitting) {
      return;
    }
    this.showFormModal = false;
  }

  saveForm(): void {
    if (!this.institutionId) {
      this.formErrorMessage = 'Не удалось определить учебное заведение.';
      return;
    }

    const payload = this.buildPayload(this.institutionId);
    if (!payload) {
      return;
    }

    this.isFormSubmitting = true;
    this.formErrorMessage = '';

    const request$ =
      this.isEditMode && this.editingRecordId
        ? this.educationRecordsService.update(this.editingRecordId, payload)
        : this.educationRecordsService.create(payload);

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
          this.loadData(this.institutionId!);
        },
        error: () => {
          this.formErrorMessage = this.isEditMode
            ? 'Не удалось изменить запись.'
            : 'Не удалось создать запись.';
        },
      });
  }

  openDeleteModal(row: EducationRecordRow): void {
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

    this.educationRecordsService
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
          this.loadData(this.institutionId!);
        },
        error: () => {
          this.deleteErrorMessage = 'Не удалось удалить запись.';
        },
      });
  }

  private loadData(institutionId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      institution: this.educationInstitutionsService.getById(institutionId),
      records: this.educationRecordsService.getAll(),
      graduates: this.schoolRecordsService.getAll().pipe(catchError(() => of([]))),
      medicalRecords: this.medicalRecordsService.getAll().pipe(catchError(() => of([]))),
      citizens: this.schoolRecordsService.getCitizens(),
      addresses: this.addressesService.getAll().pipe(catchError(() => of([]))),
      passports: this.passportRecordsService.getAll().pipe(catchError(() => of([]))),
    })
      .pipe(timeout(15000))
      .subscribe({
        next: ({ institution, records, graduates, medicalRecords, citizens, addresses, passports }) => {
          this.institution = institution;
          this.graduates = graduates;
          this.medicalRecords = medicalRecords;
          this.citizens = citizens;
          this.addresses = addresses;
          this.passports = passports;
          this.peopleOptions = this.buildPeopleOptions(
            citizens,
            graduates,
            medicalRecords,
            records,
            institutionId,
          );
          this.records = records
            .filter((item) => item.institutionId === institutionId)
            .map((item) => this.mapRecord(item));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.institution = null;
          this.records = [];
          this.peopleOptions = [];
          this.errorMessage =
            error instanceof TimeoutError
              ? 'Превышено время ожидания ответа API.'
              : 'Не удалось загрузить записи обучения.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private buildPeopleOptions(
    citizens: ApiCitizen[],
    graduates: ApiSchoolRecord[],
    medicalRecords: ApiMedicalRecord[],
    educationRecords: ApiEducationRecord[],
    institutionId: number,
  ): SelectOption[] {
    const medicalByPeopleId = new Map<number, ApiMedicalRecord>();
    medicalRecords.forEach((record) => {
      medicalByPeopleId.set(record.peopleId, record);
    });

    const alreadyEnrolledPeopleIds = new Set(
      educationRecords
        .filter((record) => record.institutionId === institutionId)
        .map((record) => record.peopleId),
    );

    const graduatesByPeopleId = new Map(graduates.map((graduate) => [graduate.peopleId, graduate]));

    return citizens
      .map((citizen) => ({
        citizen,
        graduate: graduatesByPeopleId.get(citizen.id) ?? null,
        medical: medicalByPeopleId.get(citizen.id) ?? null,
      }))
      .filter(({ citizen }) => !alreadyEnrolledPeopleIds.has(citizen.id))
      .map(({ citizen, graduate, medical }) => ({
        value: citizen.id.toString(),
        label: this.formatGraduateLabelFromCitizen(citizen, graduate, medical),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  }

  getInstitutionTypeLabel(type: string | null | undefined): string {
    const normalized = (type ?? '').trim().toUpperCase();
    if (normalized === 'UNIVERSITY') {
      return 'ВУЗ';
    }
    if (normalized === 'COLLEGE') {
      return 'Колледж';
    }
    return '';
  }

  private formatGraduateLabel(
    record: ApiSchoolRecord,
    medicalRecord: ApiMedicalRecord | null = null,
  ): string {
    const name = record.peopleFullName?.trim() || `ID ${record.peopleId}`;
    const parents: string[] = [];
    if (record.fatherFullName?.trim()) {
      parents.push(`отец: ${record.fatherFullName.trim()}`);
    }
    if (record.motherFullName?.trim()) {
      parents.push(`мать: ${record.motherFullName.trim()}`);
    }
    const details: string[] = [];
    if (record.graduationDate) {
      details.push(`выпуск: ${this.formatDate(record.graduationDate)}`);
    }
    if (medicalRecord?.decision) {
      details.push(
        `медосмотр: ${medicalRecord.decision.toUpperCase() === 'FIT' ? 'годен' : medicalRecord.decision}`,
      );
    }
    const segments = [...parents, ...details];
    return segments.length > 0 ? `${name} (${segments.join(', ')})` : name;
  }

  private formatGraduateLabelFromCitizen(
    citizen: ApiCitizen,
    graduate: ApiSchoolRecord | null,
    medicalRecord: ApiMedicalRecord | null = null,
  ): string {
    const name = citizen.fullName?.trim() || graduate?.peopleFullName?.trim() || `ID ${citizen.id}`;
    const parents: string[] = [];
    if (citizen.fatherFullName?.trim()) {
      parents.push(`отец: ${citizen.fatherFullName.trim()}`);
    }
    if (citizen.motherFullName?.trim()) {
      parents.push(`мать: ${citizen.motherFullName.trim()}`);
    }
    const details: string[] = [];
    if (graduate?.graduationDate) {
      details.push(`выпуск: ${this.formatDate(graduate.graduationDate)}`);
    }
    if (medicalRecord?.decision) {
      details.push(`медосмотр: ${medicalRecord.decision.toUpperCase() === 'FIT' ? 'годен' : medicalRecord.decision}`);
    }
    return [...parents, ...details].length > 0 ? `${name} (${[...parents, ...details].join(', ')})` : name;
  }

  private mapRecord(record: ApiEducationRecord): EducationRecordRow {
    const graduate = this.findGraduateByPeopleId(record.peopleId);
    const medical = this.findMedicalRecordByPeopleId(record.peopleId);
    const schoolGraduationSource = record.schoolGraduationDate ?? graduate?.graduationDate ?? null;
    return {
      id: record.id,
      peopleId: record.peopleId,
      peopleFullName: record.peopleFullName?.trim() || `ID ${record.peopleId}`,
      schoolRecordId: record.schoolRecordId ?? graduate?.id ?? null,
      schoolGraduationDate: schoolGraduationSource ? this.formatDate(schoolGraduationSource) : '-',
      medicalRecordId: record.medicalRecordId ?? medical?.id ?? null,
      medicalDecision: record.medicalDecision ?? medical?.decision ?? '-',
      fatherFullName: graduate?.fatherFullName?.trim() || '-',
      motherFullName: graduate?.motherFullName?.trim() || '-',
      studyForm: record.studyForm?.trim() || '-',
      faculty: record.faculty?.trim() || '-',
      specialty: record.specialty?.trim() || '-',
      admissionDate: this.formatDate(record.admissionDate),
      admissionDateRaw: this.normalizeDateInput(record.admissionDate),
      graduationDate: this.formatDate(record.graduationDate),
      graduationDateRaw: this.normalizeDateInput(record.graduationDate),
      expulsionDate: this.formatDate(record.expulsionDate),
      expulsionDateRaw: this.normalizeDateInput(record.expulsionDate),
      isDeferralActive: record.isDeferralActive ? 'Да' : 'Нет',
      isDeferralActiveValue: record.isDeferralActive,
      userName: record.userName?.trim() || '-',
    };
  }

  private buildPayload(institutionId: number): CreateEducationRecordRequest | null {
    const peopleId = Number(this.formData.peopleId);
    const userId = this.authService.resolveCurrentUserId();

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.formErrorMessage = 'Выберите гражданина.';
      return null;
    }

    const selectedGraduate = this.findSelectedGraduate();
    const selectedMedicalRecord = this.findSelectedMedicalRecord();

    if (!userId) {
      this.formErrorMessage = 'Не удалось определить текущего пользователя.';
      return null;
    }

    if (!this.formData.studyForm.trim()) {
      this.formErrorMessage = 'Укажите форму обучения.';
      return null;
    }

    if (!this.formData.faculty.trim()) {
      this.formErrorMessage = 'Укажите факультет.';
      return null;
    }

    if (!this.formData.specialty.trim()) {
      this.formErrorMessage = 'Укажите специальность.';
      return null;
    }

    if (!this.formData.admissionDate.trim()) {
      this.formErrorMessage = 'Укажите дату поступления.';
      return null;
    }

    const graduationDate = this.formData.graduationDate.trim()
      ? this.toIsoDate(this.formData.graduationDate)
      : null;
    const expulsionDate = this.formData.expulsionDate.trim()
      ? this.toIsoDate(this.formData.expulsionDate)
      : null;
    const isDeferralActive =
      graduationDate || expulsionDate ? false : this.formData.isDeferralActive;

    return {
      peopleId,
      schoolRecordId: selectedGraduate?.id ?? null,
      medicalRecordId: selectedMedicalRecord?.id ?? null,
      institutionId,
      studyForm: this.formData.studyForm.trim(),
      faculty: this.formData.faculty.trim(),
      specialty: this.formData.specialty.trim(),
      admissionDate: this.toIsoDate(this.formData.admissionDate),
      expulsionDate,
      graduationDate,
      isDeferralActive,
      userId,
    };
  }

  private findSelectedGraduate(): ApiSchoolRecord | null {
    const peopleId = Number(this.formData.peopleId);
    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      return null;
    }

    return this.findGraduateByPeopleId(peopleId);
  }

  private findSelectedMedicalRecord(): ApiMedicalRecord | null {
    const peopleId = Number(this.formData.peopleId);
    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      return null;
    }
    return this.findMedicalRecordByPeopleId(peopleId);
  }

  private findGraduateByPeopleId(peopleId: number): ApiSchoolRecord | null {
    return (
      this.graduates.find(
        (graduate) => graduate.peopleId === peopleId && Boolean(graduate.graduationDate),
      ) ?? null
    );
  }

  private findMedicalRecordByPeopleId(peopleId: number): ApiMedicalRecord | null {
    return (
      this.medicalRecords.find(
        (record) => record.peopleId === peopleId && (record.decision ?? '').toUpperCase() === 'FIT',
      ) ?? null
    );
  }

  private findSelectedAddress(): ApiAddress | null {
    const peopleId = Number(this.formData.peopleId);
    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      return null;
    }

    return this.addresses.find((address) => address.citizenId === peopleId && address.isActive) ?? null;
  }

  private findSelectedPassport(): ApiPassportRecord | null {
    const peopleId = Number(this.formData.peopleId);
    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      return null;
    }

    return this.passports.find((passport) => passport.peopleId === peopleId) ?? null;
  }

  private createDefaultForm(): StudyFormData {
    return {
      peopleId: '',
      studyForm: 'Очная',
      faculty: '',
      specialty: '',
      admissionDate: '',
      graduationDate: '',
      expulsionDate: '',
      isDeferralActive: true,
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
