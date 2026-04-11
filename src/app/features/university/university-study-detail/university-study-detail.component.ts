import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
}

interface LocalSchoolRecord {
  peopleId: number;
  peopleFullName: string;
  status?: 'Учится' | 'Закончил' | 'Отчислен' | string;
}

interface LocalUniversityStudyRecord {
  id: number;
  peopleId: number;
  peopleFullName: string;
  institutionId: number;
  studyForm: string;
  faculty: string;
  specialty: string;
  admissionDate: string | null;
  expulsionDate: string | null;
  graduationDate: string | null;
  isDeferralActive: boolean;
  userId: number;
  userName: string;
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
  private readonly localSchoolRecordsKey = 'local_school_records_v1';
  private readonly localUniversityStudiesKey = 'local_university_studies_v1';

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

    const all = this.readAllStudies();

    if (this.isEditMode && this.editingRecordId) {
      const idx = all.findIndex((item) => item.id === this.editingRecordId);
      if (idx < 0) {
        this.formErrorMessage = 'Запись не найдена.';
        this.isFormSubmitting = false;
        return;
      }
      all[idx] = { ...all[idx], ...payload };
    } else {
      const nextId = all.length > 0 ? Math.max(...all.map((item) => item.id)) + 1 : 1;
      all.unshift({
        id: nextId,
        ...payload,
      });
    }

    this.writeAllStudies(all);
    this.showFormModal = false;
    this.isFormSubmitting = false;
    this.loadRecords(this.institutionId);
    this.cdr.detectChanges();
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

    const filtered = this.readAllStudies().filter((item) => item.id !== this.deletingRecord!.id);
    this.writeAllStudies(filtered);

    this.isDeleting = false;
    this.showDeleteModal = false;
    this.deletingRecord = null;
    this.loadRecords(this.institutionId!);
    this.cdr.detectChanges();
  }

  private loadData(institutionId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.peopleOptions = this.mapPeopleOptions(this.readPeopleFromLocalSchool());
    this.records = this.mapRecords(this.readAllStudies(), institutionId);
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private loadRecords(institutionId: number): void {
    this.isLoading = true;
    this.records = this.mapRecords(this.readAllStudies(), institutionId);
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private mapPeopleOptions(people: Array<{ id: number; fullName: string }>): SelectOption[] {
    return people
      .map((person) => ({
        value: person.id.toString(),
        label: person.fullName.trim() || `ID ${person.id}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  }

  private mapRecords(records: LocalUniversityStudyRecord[], institutionId: number): InstitutionEducationRecordRow[] {
    return records
      .filter((item) => item.institutionId === institutionId)
      .map((item) => ({
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

  private buildPayload(institutionId: number): Omit<LocalUniversityStudyRecord, 'id'> | null {
    const peopleId = Number(this.formData.peopleId);
    const userId = 1;

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.formErrorMessage = 'Выберите гражданина.';
      return null;
    }

    const selectedPerson = this.peopleOptions.find((option) => Number(option.value) === peopleId);
    const peopleFullName = selectedPerson?.label?.trim() || `ID ${peopleId}`;

    return {
      peopleId,
      peopleFullName,
      institutionId,
      studyForm: this.formData.studyForm.trim(),
      faculty: this.formData.faculty.trim(),
      specialty: this.formData.specialty.trim(),
      admissionDate: this.formData.admissionDate || null,
      expulsionDate: this.formData.expulsionDate || null,
      graduationDate: this.formData.graduationDate || null,
      isDeferralActive: this.formData.isDeferralActive,
      userId,
      userName: 'universityemployee',
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
    };
  }

  private readAllStudies(): LocalUniversityStudyRecord[] {
    const raw = localStorage.getItem(this.localUniversityStudiesKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as LocalUniversityStudyRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAllStudies(records: LocalUniversityStudyRecord[]): void {
    localStorage.setItem(this.localUniversityStudiesKey, JSON.stringify(records));
  }

  private readPeopleFromLocalSchool(): Array<{ id: number; fullName: string }> {
    const raw = localStorage.getItem(this.localSchoolRecordsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as LocalSchoolRecord[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      const byId = new Map<number, string>();
      parsed.forEach((item) => {
        if ((item.status || '').trim() !== 'Закончил') {
          return;
        }
        const id = Number(item.peopleId);
        const name = (item.peopleFullName || '').trim();
        if (Number.isInteger(id) && id > 0 && name) {
          byId.set(id, name);
        }
      });

      return Array.from(byId.entries()).map(([id, fullName]) => ({ id, fullName }));
    } catch {
      return [];
    }
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
