import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, TimeoutError, timeout } from 'rxjs';
import { CardComponent, TableComponent, TableColumn, InputComponent, ButtonComponent, ModalComponent } from '../../../shared/components';
import { CreateEducationInstitutionRequest, EducationInstitutionsService } from '../../../services/education-institutions.service';

interface UniversityStudyItem {
  id: number;
  name: string;
  type: string;
  address: string;
  description: string;
}

@Component({
  selector: 'app-university-study-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CardComponent, TableComponent, InputComponent, ButtonComponent, ModalComponent],
  templateUrl: './university-study-list.component.html',
  styleUrl: './university-study-list.component.css'
})
export class UniversityStudyListComponent implements OnInit {
  filters = {
    name: '',
    type: ''
  };

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Название', sortable: true },
    { key: 'type', label: 'Тип', sortable: true },
    { key: 'address', label: 'Адрес', sortable: true },
    { key: 'description', label: 'Описание', sortable: false },
    { key: 'details', label: 'Подробнее', sortable: false }
  ];

  records: UniversityStudyItem[] = [];
  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingId: number | null = null;
  isFormLoading = false;
  isFormSubmitting = false;
  formErrorMessage = '';
  formData: CreateEducationInstitutionRequest = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: UniversityStudyItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(
    private readonly educationInstitutionsService: EducationInstitutionsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  get filteredRecords(): UniversityStudyItem[] {
    const byName = this.filters.name.trim().toLowerCase();
    const byType = this.filters.type.trim().toLowerCase();

    return this.records.filter((record) => {
      const matchesName = !byName || record.name.toLowerCase().includes(byName);
      const matchesType = !byType || record.type.toLowerCase().includes(byType);
      return matchesName && matchesType;
    });
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Редактировать учебное заведение' : 'Добавить учебное заведение';
  }

  loadRecords(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.educationInstitutionsService.getAll().pipe(timeout(15000)).subscribe({
      next: (source) => {
        this.records = source.map((item) => ({
          id: item.id,
          name: item.name?.trim() || '-',
          type: item.type?.trim() || '-',
          address: item.address?.trim() || '-',
          description: item.description?.trim() || '-',
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.records = [];
        if (error instanceof TimeoutError) {
          this.errorMessage = 'Превышено время ожидания ответа API.';
        } else {
          this.errorMessage = 'Не удалось загрузить список учебных заведений.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.formData = this.createDefaultForm();
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  openEditModal(record: UniversityStudyItem): void {
    this.isEditMode = true;
    this.editingId = record.id;
    this.formData = this.createDefaultForm();
    this.formErrorMessage = '';
    this.showFormModal = true;
    this.loadRecordById(record.id);
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

    const request$ = this.isEditMode && this.editingId
      ? this.educationInstitutionsService.update(this.editingId, payload)
      : this.educationInstitutionsService.create(payload);

    request$.pipe(
      finalize(() => {
        this.isFormSubmitting = false;
      })
    ).subscribe({
      next: (ok) => {
        if (!ok) {
          this.formErrorMessage = this.isEditMode
            ? 'Не удалось обновить учебное заведение.'
            : 'Не удалось создать учебное заведение.';
          return;
        }
        this.showFormModal = false;
        this.loadRecords();
      },
      error: () => {
        this.formErrorMessage = this.isEditMode
          ? 'Не удалось обновить учебное заведение.'
          : 'Не удалось создать учебное заведение.';
      }
    });
  }

  openDeleteModal(record: UniversityStudyItem): void {
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
    if (!this.deletingRecord) {
      return;
    }

    this.isDeleting = true;
    this.deleteErrorMessage = '';

    this.educationInstitutionsService.delete(this.deletingRecord.id).pipe(
      finalize(() => {
        this.isDeleting = false;
      })
    ).subscribe({
      next: (ok) => {
        if (!ok) {
          this.deleteErrorMessage = 'Не удалось удалить учебное заведение.';
          return;
        }
        this.showDeleteModal = false;
        this.deletingRecord = null;
        this.loadRecords();
      },
      error: () => {
        this.deleteErrorMessage = 'Не удалось удалить учебное заведение.';
      }
    });
  }

  private loadRecordById(id: number): void {
    this.isFormLoading = true;

    this.educationInstitutionsService.getById(id).pipe(
      finalize(() => {
        this.isFormLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (item) => {
        if (!item) {
          this.formErrorMessage = 'Запись не найдена.';
          this.cdr.detectChanges();
          return;
        }

        this.formData = {
          name: item.name?.trim() || '',
          type: item.type?.trim() || '',
          address: item.address?.trim() || '',
          description: item.description?.trim() || ''
        };
        this.cdr.detectChanges();
      },
      error: () => {
        this.formErrorMessage = 'Не удалось загрузить данные для редактирования.';
        this.cdr.detectChanges();
      }
    });
  }

  private buildPayload(): CreateEducationInstitutionRequest | null {
    const payload: CreateEducationInstitutionRequest = {
      name: this.formData.name.trim(),
      type: this.formData.type.trim(),
      address: this.formData.address.trim(),
      description: this.formData.description.trim()
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

  private createDefaultForm(): CreateEducationInstitutionRequest {
    return {
      name: '',
      type: '',
      address: '',
      description: ''
    };
  }
}
