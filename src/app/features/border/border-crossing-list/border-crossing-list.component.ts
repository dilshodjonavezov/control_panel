import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { BorderCrossingCreateEditComponent } from '../border-crossing-create-edit/border-crossing-create-edit.component';

interface BorderCrossingItem {
  id: number;
  peopleId: number;
  peopleName: string;
  userId: number;
  userName: string;
  departureDate: string;
  returnDate: string;
  outsideBorder: 'Да' | 'Нет';
  country: string;
  description: string;
}

interface LocalCrossingRecord {
  id: number;
  peopleId: number;
  peopleName: string;
  userId: number;
  userName: string;
  departureDate: string;
  returnDate: string | null;
  outsideBorder: boolean;
  country: string;
  description: string;
}

@Component({
  selector: 'app-border-crossing-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    TableComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    ModalComponent,
    BorderCrossingCreateEditComponent,
  ],
  templateUrl: './border-crossing-list.component.html',
  styleUrl: './border-crossing-list.component.css',
})
export class BorderCrossingListComponent implements OnInit {
  private readonly crossingsStorageKey = 'local_border_crossings_v1';

  filters = {
    id: '',
    outsideBorder: 'all',
  };

  outsideBorderOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'yes', label: 'Да' },
    { value: 'no', label: 'Нет' },
  ];

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'peopleName', label: 'Гражданин', sortable: true },
    { key: 'userName', label: 'Пользователь', sortable: true },
    { key: 'departureDate', label: 'Выезд', sortable: true },
    { key: 'returnDate', label: 'Возврат', sortable: true },
    { key: 'outsideBorder', label: 'Вне границы', sortable: true },
    { key: 'country', label: 'Страна', sortable: true },
    { key: 'description', label: 'Описание', sortable: false },
  ];

  crossings: BorderCrossingItem[] = [];
  isLoading = false;
  isDeleting = false;
  errorMessage = '';

  showModal = false;
  showDeleteModal = false;
  selectedRecordId: string | null = null;
  deletingRecord: BorderCrossingItem | null = null;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCrossings();
  }

  get filteredCrossings(): BorderCrossingItem[] {
    const idFilter = this.filters.id.trim();
    const outsideBorderFilter = this.filters.outsideBorder || 'all';

    return this.crossings.filter((item) => {
      const matchesId = !idFilter || item.id.toString().includes(idFilter);
      const matchesOutsideBorder =
        outsideBorderFilter === 'all' ||
        (outsideBorderFilter === 'yes' && item.outsideBorder === 'Да') ||
        (outsideBorderFilter === 'no' && item.outsideBorder === 'Нет');

      return matchesId && matchesOutsideBorder;
    });
  }

  loadCrossings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const records = this.readCrossings();
    this.crossings = records.map((item) => ({
      id: item.id,
      peopleId: item.peopleId,
      peopleName: item.peopleName || `ID ${item.peopleId}`,
      userId: item.userId,
      userName: item.userName || `ID ${item.userId}`,
      departureDate: this.formatDateTime(item.departureDate),
      returnDate: item.returnDate ? this.formatDateTime(item.returnDate) : '-',
      outsideBorder: item.outsideBorder ? 'Да' : 'Нет',
      country: item.country || '-',
      description: item.description || '-',
    }));

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  openCreate(): void {
    this.selectedRecordId = null;
    this.showModal = true;
  }

  openEdit(item: BorderCrossingItem): void {
    this.selectedRecordId = item.id.toString();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedRecordId = null;
  }

  openDelete(item: BorderCrossingItem): void {
    this.deletingRecord = item;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingRecord = null;
  }

  confirmDelete(): void {
    if (!this.deletingRecord || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    const updated = this.readCrossings().filter((item) => item.id !== this.deletingRecord!.id);
    this.writeCrossings(updated);

    this.isDeleting = false;
    this.closeDeleteModal();
    this.loadCrossings();
  }

  onRecordSaved(): void {
    this.closeModal();
    this.loadCrossings();
  }

  private readCrossings(): LocalCrossingRecord[] {
    const raw = localStorage.getItem(this.crossingsStorageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as LocalCrossingRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeCrossings(records: LocalCrossingRecord[]): void {
    localStorage.setItem(this.crossingsStorageKey, JSON.stringify(records));
  }

  private formatDateTime(dateValue: string | null | undefined): string {
    if (!dateValue) {
      return '-';
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleString('ru-RU');
  }
}
