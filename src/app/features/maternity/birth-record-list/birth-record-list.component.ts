import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardComponent, TableComponent, TableColumn, ButtonComponent, ModalComponent, SelectComponent, SelectOption } from '../../../shared/components';
import { BirthRecordCreateComponent, type BirthRecordPayload } from '../birth-record-create/birth-record-create.component';

interface BirthRecordItem {
  id: string;
  birthDateTime: string;
  motherFullName: string;
  fatherFullName: string;
  sex: 'male' | 'female';
  status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED' | 'VOID';
  certificateStatus: 'NOT_ISSUED' | 'ISSUED' | 'REJECTED';
}

@Component({
  selector: 'app-birth-record-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, SelectComponent, BirthRecordCreateComponent],
  templateUrl: './birth-record-list.component.html',
  styleUrl: './birth-record-list.component.css'
})
export class BirthRecordListComponent {
  showCreateModal = false;
  filters = {
    certificateStatus: 'all'
  };

  certificateStatusOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'NOT_ISSUED', label: 'Не выдано' },
    { value: 'ISSUED', label: 'Выдано' },
    { value: 'REJECTED', label: 'Отказано' }
  ];

  columns: TableColumn[] = [
    { key: 'birthDateTime', label: 'Дата и время', sortable: true },
    { key: 'motherFullName', label: 'ФИО матери', sortable: true },
    { key: 'fatherFullName', label: 'ФИО отца', sortable: true },
    { key: 'sex', label: 'Пол', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'certificateStatus', label: 'Свидетельство', sortable: true }
  ];

  records: BirthRecordItem[] = [
    {
      id: 'br-1024',
      birthDateTime: '25.01.2026 04:18',
      motherFullName: 'Семенова Ирина Викторовна',
      fatherFullName: 'Семенов Андрей Юрьевич',
      sex: 'male',
      status: 'SUBMITTED',
      certificateStatus: 'ISSUED'
    },
    {
      id: 'br-1023',
      birthDateTime: '24.01.2026 21:05',
      motherFullName: 'Кузнецова Анна Сергеевна',
      fatherFullName: 'Кузнецов Дмитрий Олегович',
      sex: 'female',
      status: 'DRAFT',
      certificateStatus: 'NOT_ISSUED'
    },
    {
      id: 'br-1019',
      birthDateTime: '21.01.2026 12:40',
      motherFullName: 'Лазарева Марина Игоревна',
      fatherFullName: 'Лазарев Павел Ильич',
      sex: 'male',
      status: 'CANCELLED',
      certificateStatus: 'REJECTED'
    }
  ];

  constructor(private router: Router) {}

  openCreate(): void {
    this.showCreateModal = true;
  }

  closeCreate(): void {
    this.showCreateModal = false;
  }

  handleRecordSaved(payload: BirthRecordPayload): void {
    const id = `br-${Date.now()}`;
    const item: BirthRecordItem = {
      id,
      birthDateTime: this.formatBirthDateTime(payload.birthDateTime),
      motherFullName: payload.motherFullName || '—',
      fatherFullName: payload.fatherFullName || '—',
      sex: payload.sex,
      status: payload.status,
      certificateStatus: 'NOT_ISSUED'
    };

    this.records = [item, ...this.records];
    this.closeCreate();
  }

  get filteredRecords(): BirthRecordItem[] {
    return this.records.filter(record => {
      if (this.filters.certificateStatus === 'all') {
        return true;
      }
      return record.certificateStatus === this.filters.certificateStatus;
    });
  }

  openRecord(record: BirthRecordItem): void {
    this.router.navigate(['/maternity/birth-records', record.id]);
  }

  getSexLabel(sex: BirthRecordItem['sex']): string {
    return sex === 'male' ? 'Мальчик' : 'Девочка';
  }

  getStatusLabel(status: BirthRecordItem['status']): string {
    const labels: Record<BirthRecordItem['status'], string> = {
      DRAFT: 'Черновик',
      SUBMITTED: 'Отправлено',
      CANCELLED: 'Отменено',
      VOID: 'Аннулировано'
    };
    return labels[status];
  }

  getCertificateStatusLabel(status: BirthRecordItem['certificateStatus']): string {
    const labels: Record<BirthRecordItem['certificateStatus'], string> = {
      NOT_ISSUED: 'Не выдано',
      ISSUED: 'Выдано',
      REJECTED: 'Отказано'
    };
    return labels[status];
  }

  private formatBirthDateTime(value: string): string {
    if (!value) {
      return '—';
    }
    const parts = value.split('T');
    if (parts.length !== 2) {
      return value;
    }
    const [date, time] = parts;
    const dateParts = date.split('-');
    if (dateParts.length !== 3) {
      return value.replace('T', ' ');
    }
    const [year, month, day] = dateParts;
    const formattedTime = time.slice(0, 5);
    return `${day}.${month}.${year} ${formattedTime}`;
  }
}

