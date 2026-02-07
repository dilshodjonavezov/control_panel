import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, TableComponent, TableColumn, ButtonComponent, InputComponent, SelectComponent, SelectOption, ModalComponent } from '../../../shared/components';
import { Router } from '@angular/router';
import { ZagsActCreateComponent } from '../zags-act-create/zags-act-create.component';

interface ZagsActItem {
  id: string;
  actNumber: string;
  actDate: string;
  type: 'BirthCertificate' | 'Marriage' | 'Children' | 'Death';
  subject: string;
  status: 'DRAFT' | 'REGISTERED' | 'UPDATED';
  certificateStatus?: 'NOT_ISSUED' | 'ISSUED' | 'REJECTED';
}

@Component({
  selector: 'app-zags-act-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, InputComponent, SelectComponent, ModalComponent, ZagsActCreateComponent],
  templateUrl: './zags-act-list.component.html',
  styleUrl: './zags-act-list.component.css'
})
export class ZagsActListComponent {
  showCreateModal = false;
  filters = {
    type: 'all',
    date: '',
    actNumber: '',
    certificateStatus: 'all'
  };

  typeOptions: SelectOption[] = [
    { value: 'all', label: 'Все типы' },
    { value: 'BirthCertificate', label: 'Рождение' },
    { value: 'Marriage', label: 'Брак' },
    { value: 'Children', label: 'Дети' },
    { value: 'Death', label: 'Смерть' }
  ];

  certificateStatusOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'NOT_ISSUED', label: 'Не выдано' },
    { value: 'ISSUED', label: 'Выдано' },
    { value: 'REJECTED', label: 'Отказано' }
  ];

  columns: TableColumn[] = [
    { key: 'actDate', label: 'Дата', sortable: true },
    { key: 'actNumber', label: 'Акт №', sortable: true },
    { key: 'type', label: 'Тип', sortable: true },
    { key: 'subject', label: 'Гражданин', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'certificateStatus', label: 'Свидетельство', sortable: true }
  ];

  records: ZagsActItem[] = [
    {
      id: 'z-1101',
      actNumber: 'А-2026-001',
      actDate: '25.01.2026',
      type: 'BirthCertificate',
      subject: 'Семенова И.В.',
      status: 'REGISTERED',
      certificateStatus: 'ISSUED'
    },
    { id: 'z-1098', actNumber: 'А-2026-002', actDate: '24.01.2026', type: 'Marriage', subject: 'Кузнецов Д.О. / Кузнецова А.С.', status: 'REGISTERED' },
    { id: 'z-1092', actNumber: 'А-2026-003', actDate: '23.01.2026', type: 'Death', subject: 'Иванов П.П.', status: 'UPDATED' }
  ];

  constructor(private router: Router) {}

  openCreate(): void {
    this.showCreateModal = true;
  }

  closeCreate(): void {
    this.showCreateModal = false;
  }

  get filteredRecords(): ZagsActItem[] {
    const filterDate = this.filters.date ? this.formatDate(this.filters.date) : '';
    return this.records.filter(record => {
      const typeMatches = this.filters.type === 'all' || record.type === this.filters.type;
      const dateMatches = !filterDate || record.actDate === filterDate;
      const numberMatches = !this.filters.actNumber || record.actNumber.toLowerCase().includes(this.filters.actNumber.toLowerCase());
      const certificateMatches =
        this.filters.certificateStatus === 'all'
          ? true
          : record.type === 'BirthCertificate' && record.certificateStatus === this.filters.certificateStatus;
      return typeMatches && dateMatches && numberMatches && certificateMatches;
    });
  }

  openRecord(record: ZagsActItem): void {
    this.router.navigate(['/zags/acts', record.id]);
  }

  getTypeLabel(type: ZagsActItem['type']): string {
    const labels: Record<ZagsActItem['type'], string> = {
      BirthCertificate: 'Рождение',
      Marriage: 'Брак',
      Children: 'Дети',
      Death: 'Смерть'
    };
    return labels[type];
  }

  getStatusLabel(status: ZagsActItem['status']): string {
    const labels: Record<ZagsActItem['status'], string> = {
      DRAFT: 'Черновик',
      REGISTERED: 'Зарегистрировано',
      UPDATED: 'Исправлено'
    };
    return labels[status];
  }

  getCertificateStatusLabel(status?: ZagsActItem['certificateStatus']): string {
    if (!status) {
      return '—';
    }
    const labels: Record<NonNullable<ZagsActItem['certificateStatus']>, string> = {
      NOT_ISSUED: 'Не выдано',
      ISSUED: 'Выдано',
      REJECTED: 'Отказано'
    };
    return labels[status];
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}.${month}.${year}`;
  }
}
