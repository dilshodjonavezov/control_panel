import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, timeout, TimeoutError } from 'rxjs';
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
import { ApiBorderCrossing, BorderCrossingService } from '../../../services/border-crossing.service';

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
  documentNumber: string;
  status: string;
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
    { key: 'departureDate', label: 'Выезд', sortable: true },
    { key: 'returnDate', label: 'Возврат', sortable: true },
    { key: 'outsideBorder', label: 'Вне границы', sortable: true },
    { key: 'country', label: 'Страна', sortable: true },
    { key: 'documentNumber', label: 'Документ', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
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

  constructor(
    private readonly borderCrossingService: BorderCrossingService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCrossings();
    this.route.queryParamMap.subscribe((params) => {
      const action = params.get('action');
      if (!action) {
        return;
      }

      if (action === 'create') {
        this.openCreate();
        return;
      }

      this.filters = {
        id: '',
        outsideBorder: action === 'departures' ? 'yes' : 'no',
      };
    });
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

    this.borderCrossingService
      .getAll()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (records) => {
          this.crossings = records.map((item) => this.mapCrossing(item));
        },
        error: (error: unknown) => {
          this.crossings = [];
          this.errorMessage =
            error instanceof TimeoutError
              ? 'Превышено время ожидания ответа API.'
              : 'Не удалось загрузить записи погранслужбы.';
        },
      });
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
    if (this.isDeleting) {
      return;
    }
    this.showDeleteModal = false;
    this.deletingRecord = null;
  }

  confirmDelete(): void {
    if (!this.deletingRecord || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    this.borderCrossingService
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
            this.errorMessage = 'Не удалось удалить запись.';
            return;
          }
          this.closeDeleteModal();
          this.loadCrossings();
        },
        error: () => {
          this.errorMessage = 'Не удалось удалить запись.';
        },
      });
  }

  onRecordSaved(): void {
    this.closeModal();
    this.loadCrossings();
  }

  private mapCrossing(item: ApiBorderCrossing): BorderCrossingItem {
    return {
      id: item.id,
      peopleId: item.peopleId,
      peopleName: item.peopleName?.trim() || `ID ${item.peopleId}`,
      userId: item.userId,
      userName: item.userName?.trim() || `ID ${item.userId}`,
      departureDate: this.formatDateTime(item.departureDate),
      returnDate: item.returnDate ? this.formatDateTime(item.returnDate) : '-',
      outsideBorder: item.outsideBorder ? 'Да' : 'Нет',
      country: item.country?.trim() || '-',
      documentNumber: item.documentNumber?.trim() || '-',
      status: this.formatStatus(item.status),
      description: item.description?.trim() || '-',
    };
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

  private formatStatus(status: string | null | undefined): string {
    const normalized = (status ?? '').trim().toUpperCase();
    if (normalized === 'CLOSED') {
      return 'Закрыт';
    }
    if (normalized === 'CANCELLED') {
      return 'Отменен';
    }
    return 'Открыт';
  }
}
