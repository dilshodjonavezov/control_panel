import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, TableComponent, TableColumn, ButtonComponent } from '../../../shared/components';

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'needs_work';

interface IncomingRequest {
  id: string;
  student: string;
  type: string;
  date: string;
  status: RequestStatus;
}

@Component({
  selector: 'teacher-requests',
  standalone: true,
  imports: [CommonModule, CardComponent, TableComponent, ButtonComponent],
  templateUrl: './teacher-requests.component.html',
  styleUrl: './teacher-requests.component.css'
})
export class TeacherRequestsComponent {
  columns: TableColumn[] = [
    { key: 'student', label: 'Студент', sortable: true },
    { key: 'type', label: 'Тип заявки', sortable: true },
    { key: 'date', label: 'Дата', sortable: true },
    { key: 'status', label: 'Статус', sortable: true }
  ];

  statusLabels: Record<RequestStatus, string> = {
    pending: 'На проверке',
    approved: 'Принято',
    rejected: 'Отклонено',
    needs_work: 'На доработке'
  };

  requests: IncomingRequest[] = [
    { id: 'r1', student: 'Иванов Иван', type: 'Подтвердить обучение', date: '11.01.2026', status: 'pending' },
    { id: 'r2', student: 'Петров Петр', type: 'Обновить справку', date: '09.01.2026', status: 'needs_work' }
  ];

  updateStatus(request: IncomingRequest, status: RequestStatus): void {
    this.requests = this.requests.map(item =>
      item.id === request.id ? { ...item, status } : item
    );
  }

  getStatusLabel(status: RequestStatus): string {
    return this.statusLabels[status] || status;
  }
}
