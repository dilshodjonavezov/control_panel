import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  ApiEducationInstitution,
  CreateEducationInstitutionRequest,
  EducationInstitutionsService,
} from '../../../services/education-institutions.service';
import { AuthService } from '../../../services/auth.service';
import { ApiEducationRecord, EducationRecordsService } from '../../../services/education-records.service';
import { OrganizationsService } from '../../../services/organizations.service';

interface EducationInstitutionForm {
  name: string;
  type: string;
  address: string;
  description: string;
}

interface InstitutionRow extends ApiEducationInstitution {
  peopleCount: number;
  peopleNames: string;
  studentDetails: string;
  studentFormSummary: string;
}

@Component({
  selector: 'app-university-study-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardComponent,
    TableComponent,
    InputComponent,
    ButtonComponent,
    ModalComponent,
    SelectComponent,
  ],
  templateUrl: './university-study-list.component.html',
  styleUrl: './university-study-list.component.css',
})
export class UniversityStudyListComponent implements OnInit {
  isRedirectingToInstitution = false;
  institutionTypeOptions: SelectOption[] = [
    { value: 'UNIVERSITY', label: 'Университет' },
    { value: 'COLLEGE', label: 'Колледж' },
    { value: 'SCHOOL', label: 'Школа' },
  ];

  filters = {
    name: '',
    type: '',
    people: '',
  };

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Название', sortable: true },
    { key: 'type', label: 'Тип', sortable: true },
    { key: 'address', label: 'Адрес', sortable: true },
    { key: 'peopleNames', label: 'ФИО людей', sortable: false },
    { key: 'studentDetails', label: 'Кандидаты', sortable: false },
    { key: 'studentFormSummary', label: 'Форма', sortable: false },
    { key: 'peopleCount', label: 'Кол-во', sortable: true },
    { key: 'description', label: 'Описание', sortable: false },
    { key: 'details', label: 'Подробнее', sortable: false },
  ];

  records: InstitutionRow[] = [];
  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formData: EducationInstitutionForm = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: InstitutionRow | null = null;
  isDeleting = false;
  deleteErrorMessage = '';
  private linkedInstitutionId: number | null = null;

  constructor(
    private readonly educationInstitutionsService: EducationInstitutionsService,
    private readonly educationRecordsService: EducationRecordsService,
    private readonly authService: AuthService,
    private readonly organizationsService: OrganizationsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadRecords();
    this.route.queryParamMap.subscribe((params) => {
      const action = params.get('action');
      if (!action) {
        return;
      }

      if (action === 'create') {
        this.openCreateModal();
        return;
      }

      this.filters.name = '';
      this.filters.people = '';
      this.filters.type = action === 'expulsions' ? 'college' : 'university';
    });
  }

  get filteredRecords(): InstitutionRow[] {
    const byName = this.filters.name.trim().toLowerCase();
    const byType = this.filters.type.trim().toLowerCase();
    const byPeople = this.filters.people.trim().toLowerCase();

    return this.records.filter((record) => {
      const matchesName = !byName || (record.name ?? '').toLowerCase().includes(byName);
      const matchesType = !byType || (record.type ?? '').toLowerCase().includes(byType);
      const matchesPeople = !byPeople || (record.peopleNames ?? '').toLowerCase().includes(byPeople);
      return matchesName && matchesType && matchesPeople;
    });
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Редактировать учебное заведение' : 'Добавить учебное заведение';
  }

  loadRecords(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      institutions: this.educationInstitutionsService.getAll(),
      educationRecords: this.educationRecordsService.getAll(),
      organizations: this.organizationsService.getOrganizations(),
    })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: ({ institutions, educationRecords, organizations }) => {
          const currentOrganizationId = this.authService.getCurrentUser()?.organizationId ?? null;
          const currentOrganization = organizations.find((item) => item.id === currentOrganizationId) ?? null;
          this.linkedInstitutionId = currentOrganization?.educationInstitutionId ?? null;
          if (this.linkedInstitutionId) {
            this.isRedirectingToInstitution = true;
            void this.router.navigate(['/university/studies', this.linkedInstitutionId], {
              queryParams: this.route.snapshot.queryParams,
              replaceUrl: true,
            });
            return;
          }
          const visibleInstitutions = this.linkedInstitutionId
            ? institutions.filter((institution) => institution.id === this.linkedInstitutionId)
            : institutions;
          this.records = this.mergeRecords(visibleInstitutions, educationRecords);
        },
        error: (error: unknown) => {
          this.records = [];
          this.errorMessage =
            error instanceof TimeoutError
              ? 'Превышено время ожидания ответа API.'
              : 'Не удалось загрузить реестр учебных заведений.';
        },
      });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.formData = this.createDefaultForm();
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  openEditModal(record: InstitutionRow): void {
    this.isEditMode = true;
    this.editingId = record.id;
    this.formData = {
      name: record.name ?? '',
      type: record.type ?? '',
      address: record.address ?? '',
      description: record.description ?? '',
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
      this.isEditMode && this.editingId
        ? this.educationInstitutionsService.update(this.editingId, payload)
        : this.educationInstitutionsService.create(payload);

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
          this.loadRecords();
        },
        error: () => {
          this.formErrorMessage = this.isEditMode ? 'Не удалось изменить запись.' : 'Не удалось создать запись.';
        },
      });
  }

  openDeleteModal(record: InstitutionRow): void {
    this.deletingRecord = record;
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

    this.educationInstitutionsService
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

  getInstitutionTypeLabel(type: string | null | undefined): string {
    const normalized = (type ?? '').trim().toUpperCase();
    if (normalized === 'UNIVERSITY') {
      return 'Университет';
    }
    if (normalized === 'COLLEGE') {
      return 'Колледж';
    }
    if (normalized === 'SCHOOL') {
      return 'Школа';
    }
    return '';
  }

  get pageTitle(): string {
    return 'Учебные заведения';
  }

  get pageDescription(): string {
    return 'Этот экран нужен только как общий список заведений. Кабинет колледжа или вуза должен работать внутри своего учреждения.';
  }

  private mergeRecords(
    institutions: ApiEducationInstitution[],
    educationRecords: ApiEducationRecord[],
  ): InstitutionRow[] {
    return institutions.map((institution) => {
      const relatedRecords = educationRecords.filter((record) => record.institutionId === institution.id);
      const peopleNames = relatedRecords
        .map((record) => record.peopleFullName?.trim() || `ID ${record.peopleId}`)
        .filter((value, index, array) => array.indexOf(value) === index)
        .join(', ');
      const studentDetails = relatedRecords
        .map((record) => `${record.peopleFullName?.trim() || `ID ${record.peopleId}`} (${record.studyForm?.trim() || '-'})`)
        .filter((value, index, array) => array.indexOf(value) === index)
        .join(' | ');
      const studentFormSummary = relatedRecords
        .map((record) => record.studyForm?.trim() || '-')
        .filter((value, index, array) => array.indexOf(value) === index)
        .join(', ');

      return {
        ...institution,
        peopleCount: relatedRecords.length,
        peopleNames: peopleNames || '—',
        studentDetails: studentDetails || '—',
        studentFormSummary: studentFormSummary || '—',
      };
    });
  }

  private buildPayload(): CreateEducationInstitutionRequest | null {
    const payload: CreateEducationInstitutionRequest = {
      name: this.formData.name.trim(),
      type: this.formData.type.trim(),
      address: this.formData.address.trim(),
      description: this.formData.description.trim(),
    };

    if (!payload.name) {
      this.formErrorMessage = 'Укажите название.';
      return null;
    }

    if (!payload.type) {
      this.formErrorMessage = 'Укажите тип.';
      return null;
    }

    return payload;
  }

  private createDefaultForm(): EducationInstitutionForm {
    return {
      name: '',
      type: '',
      address: '',
      description: '',
    };
  }
}
