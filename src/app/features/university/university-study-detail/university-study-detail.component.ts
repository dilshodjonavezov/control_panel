import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, TimeoutError, timeout } from 'rxjs';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  ModalComponent,
  SelectComponent,
  SelectOption,
  TableComponent,
  type TableColumn,
} from '../../../shared/components';
import {
  type ApiEducationRecord,
  type ApiPerson,
  type CreateEducationRecordRequest,
  EducationRecordsService,
} from '../../../services/education-records.service';

interface InstitutionEducationRecordRow {
  id: number;
  peopleId: number;
  peopleFullName: string;
  studyForm: string;
  faculty: string;
  specialty: string;
  admissionDate: string;
  expulsionDate: string;
  graduationDate: string;
  admissionDateRaw: string;
  expulsionDateRaw: string;
  graduationDateRaw: string;
  isDeferralActive: 'Активна' | 'Не активна';
  isDeferralActiveValue: boolean;
  userId: number;
  userName: string;
}

interface RecordForm {
  peopleId: string;
  studyForm: string;
  faculty: string;
  specialty: string;
  admissionDate: string;
  expulsionDate: string;
  graduationDate: string;
  isDeferralActive: boolean;
  userId: string;
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
  records: InstitutionEducationRecordRow[] = [];
  peopleOptions: SelectOption[] = [];

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formData: RecordForm = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: InstitutionEducationRecordRow | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  educationColumns: TableColumn[] = [
    { key: 'id', label: 'ID записи', sortable: true },
    { key: 'peopleFullName', label: 'ФИО', sortable: true },
    { key: 'studyForm', label: 'Форма обучения', sortable: true },
    { key: 'faculty', label: 'Факультет', sortable: true },
    { key: 'specialty', label: 'Специальность', sortable: true },
    { key: 'admissionDate', label: 'Поступление', sortable: true },
    { key: 'expulsionDate', label: 'Отчисление', sortable: true },
    { key: 'graduationDate', label: 'Окончание', sortable: true },
    { key: 'isDeferralActive', label: 'Отсрочка', sortable: true },
    { key: 'userName', label: 'Пользователь', sortable: true },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly educationRecordsService: EducationRecordsService,
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
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Изменение записи об образовании' : 'Добавление записи об образовании';
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

  openEditModal(row: InstitutionEducationRecordRow): void {
    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.formErrorMessage = '';
    this.formData = {
      peopleId: row.peopleId.toString(),
      studyForm: row.studyForm === '-' ? '' : row.studyForm,
      faculty: row.faculty === '-' ? '' : row.faculty,
      specialty: row.specialty === '-' ? '' : row.specialty,
      admissionDate: row.admissionDateRaw,
      expulsionDate: row.expulsionDateRaw,
      graduationDate: row.graduationDateRaw,
      isDeferralActive: row.isDeferralActiveValue,
      userId: row.userId.toString(),
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
              ? 'Не удалось изменить запись об образовании.'
              : 'Не удалось создать запись об образовании.';
            return;
          }

          this.showFormModal = false;
          this.loadRecords(this.institutionId!);
        },
        error: () => {
          this.formErrorMessage = this.isEditMode
            ? 'Не удалось изменить запись об образовании.'
            : 'Не удалось создать запись об образовании.';
        },
      });
  }

  openDeleteModal(row: InstitutionEducationRecordRow): void {
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
          this.loadRecords(this.institutionId!);
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
      people: this.educationRecordsService.getPeople(),
      records: this.educationRecordsService.getAll(),
    })
      .pipe(timeout(15000))
      .subscribe({
        next: ({ people, records }) => {
          this.peopleOptions = this.mapPeopleOptions(people);
          this.records = this.mapRecords(records, institutionId);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.errorMessage = 'Превышено время ожидания ответа API.';
          } else {
            this.errorMessage = 'Не удалось загрузить данные реестра обучения.';
          }
          this.peopleOptions = [];
          this.records = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private loadRecords(institutionId: number): void {
    this.isLoading = true;
    this.educationRecordsService
      .getAll()
      .pipe(timeout(15000))
      .subscribe({
        next: (records) => {
          this.records = this.mapRecords(records, institutionId);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.errorMessage = 'Превышено время ожидания ответа API.';
          } else {
            this.errorMessage = 'Не удалось обновить список записей.';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private mapPeopleOptions(people: ApiPerson[]): SelectOption[] {
    return people.map((person) => ({
      value: person.id.toString(),
      label: person.fullName?.trim() || `ID ${person.id}`,
    }));
  }

  private mapRecords(records: ApiEducationRecord[], institutionId: number): InstitutionEducationRecordRow[] {
    return records
      .filter((item: ApiEducationRecord) => item.institutionId === institutionId)
      .map((item: ApiEducationRecord) => ({
        id: item.id,
        peopleId: item.peopleId,
        peopleFullName: item.peopleFullName?.trim() || `ID ${item.peopleId}`,
        studyForm: item.studyForm?.trim() || '-',
        faculty: item.faculty?.trim() || '-',
        specialty: item.specialty?.trim() || '-',
        admissionDate: this.formatDate(item.admissionDate),
        expulsionDate: this.formatDate(item.expulsionDate),
        graduationDate: this.formatDate(item.graduationDate),
        admissionDateRaw: this.normalizeDateInput(item.admissionDate),
        expulsionDateRaw: this.normalizeDateInput(item.expulsionDate),
        graduationDateRaw: this.normalizeDateInput(item.graduationDate),
        isDeferralActive: item.isDeferralActive ? 'Активна' : 'Не активна',
        isDeferralActiveValue: item.isDeferralActive,
        userId: item.userId,
        userName: item.userName?.trim() || `ID ${item.userId}`,
      }));
  }

  private buildPayload(institutionId: number): CreateEducationRecordRequest | null {
    const peopleId = Number(this.formData.peopleId);
    const userId = Number(this.formData.userId);

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.formErrorMessage = 'Выберите гражданина (peopleId).';
      return null;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      this.formErrorMessage = 'Укажите корректный userId.';
      return null;
    }

    return {
      peopleId,
      institutionId,
      studyForm: this.formData.studyForm.trim(),
      faculty: this.formData.faculty.trim(),
      specialty: this.formData.specialty.trim(),
      admissionDate: this.formData.admissionDate || null,
      expulsionDate: this.formData.expulsionDate || null,
      graduationDate: this.formData.graduationDate || null,
      isDeferralActive: this.formData.isDeferralActive,
      userId,
    };
  }

  private createDefaultForm(): RecordForm {
    return {
      peopleId: '',
      studyForm: '',
      faculty: '',
      specialty: '',
      admissionDate: '',
      expulsionDate: '',
      graduationDate: '',
      isDeferralActive: true,
      userId: '',
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
