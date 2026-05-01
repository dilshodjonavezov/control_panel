import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'Нет данных';
  @Input() rowTemplate?: TemplateRef<any>;
  @Input() actionsTemplate?: TemplateRef<any>;
  @Input() pageSize = 20;
  @Output() sortChanged = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageSize']) {
      this.ensureCurrentPageInRange();
    }
  }

  get totalItems(): number {
    return this.data.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.data.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    if (this.totalItems === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  onSort(column: TableColumn): void {
    if (!column.sortable) {
      return;
    }

    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.currentPage = 1;
    this.sortChanged.emit({ key: this.sortColumn, direction: this.sortDirection });
  }

  getSortIcon(column: TableColumn): string {
    if (this.sortColumn !== column.key) {
      return '↕';
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  getStatusClasses(value: unknown): string {
    const normalized = String(value ?? '').trim().toLowerCase();

    if (!normalized) {
      return 'bg-slate-100 text-slate-700 ring-slate-200';
    }

    const positive = ['active', 'approved', 'registered', 'submitted', 'done', 'fit', 'учится', 'активен', 'подтверждено', 'зарегистрирован', 'годен', 'в стране'];
    const negative = ['blocked', 'rejected', 'error', 'unfit', 'expelled', 'cancelled', 'removed', 'не годен', 'отказано', 'заблокирован', 'ошибка', 'отчислен'];
    const warning = ['pending', 'draft', 'needs_work', 'temporarily', 'ожидает', 'черновик', 'на проверке', 'доработка', 'временно'];
    const info = ['transferred', 'abroad', 'student', 'призывники', 'учебная отсрочка', 'отправлен', 'за границей', 'студент'];

    if (positive.some((item) => normalized.includes(item))) {
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
    }
    if (negative.some((item) => normalized.includes(item))) {
      return 'bg-rose-100 text-rose-800 ring-rose-200';
    }
    if (warning.some((item) => normalized.includes(item))) {
      return 'bg-amber-100 text-amber-800 ring-amber-200';
    }
    if (info.some((item) => normalized.includes(item))) {
      return 'bg-sky-100 text-sky-800 ring-sky-200';
    }

    return 'bg-slate-100 text-slate-700 ring-slate-200';
  }

  isStatusColumn(column: TableColumn): boolean {
    const key = column.key.toLowerCase();
    return key.includes('status') || key.includes('review') || key.includes('active');
  }

  private ensureCurrentPageInRange(): void {
    const totalPages = this.totalPages;
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }
}
