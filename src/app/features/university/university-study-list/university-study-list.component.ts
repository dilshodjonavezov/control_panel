import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CardComponent, TableComponent, TableColumn, InputComponent, ButtonComponent, ModalComponent } from '../../../shared/components';

interface UniversityStudyItem {
  id: number;
  name: string;
  type: string;
  address: string;
  description: string;
}

interface UniversityForm {
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
  styleUrl: './university-study-list.component.css',
})
export class UniversityStudyListComponent implements OnInit {
  private readonly storageKey = 'local_university_institutions_v1';

  filters = {
    name: '',
    type: '',
  };

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Название', sortable: true },
    { key: 'type', label: 'Тип', sortable: true },
    { key: 'address', label: 'Адрес', sortable: true },
    { key: 'description', label: 'Описание', sortable: false },
    { key: 'details', label: 'Подробнее', sortable: false },
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
  formData: UniversityForm = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: UniversityStudyItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(private readonly cdr: ChangeDetectorRef) {}

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

    this.records = this.readRecords();

    this.isLoading = false;
    this.cdr.detectChanges();
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
    this.formData = {
      name: record.name,
      type: record.type,
      address: record.address,
      description: record.description,
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

    const records = this.readRecords();

    if (this.isEditMode && this.editingId) {
      const index = records.findIndex((item) => item.id === this.editingId);
      if (index < 0) {
        this.formErrorMessage = 'Запись не найдена.';
        this.isFormSubmitting = false;
        return;
      }
      records[index] = { ...records[index], ...payload };
    } else {
      const nextId = records.length > 0 ? Math.max(...records.map((item) => item.id)) + 1 : 1;
      records.unshift({
        id: nextId,
        ...payload,
      });
    }

    this.writeRecords(records);
    this.records = records;
    this.showFormModal = false;
    this.isFormSubmitting = false;
    this.cdr.detectChanges();
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

    const records = this.readRecords().filter((item) => item.id !== this.deletingRecord!.id);
    this.writeRecords(records);
    this.records = records;

    this.isDeleting = false;
    this.showDeleteModal = false;
    this.deletingRecord = null;
    this.cdr.detectChanges();
  }

  private buildPayload(): UniversityForm | null {
    const payload: UniversityForm = {
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

  private createDefaultForm(): UniversityForm {
    return {
      name: '',
      type: '',
      address: '',
      description: '',
    };
  }

  private readRecords(): UniversityStudyItem[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      const seeded: UniversityStudyItem[] = [
        { id: 1, name: 'Таджикский национальный университет', type: 'Университет', address: 'г. Душанбе', description: 'Государственный вуз' },
        { id: 2, name: 'Технический университет Таджикистана', type: 'Университет', address: 'г. Душанбе', description: 'Инженерные направления' },
        { id: 3, name: 'Медицинский колледж г. Худжанд', type: 'Колледж', address: 'г. Худжанд', description: 'Среднее специальное образование' },
      ];
      this.writeRecords(seeded);
      return seeded;
    }

    try {
      const parsed = JSON.parse(raw) as UniversityStudyItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeRecords(records: UniversityStudyItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(records));
  }
}
