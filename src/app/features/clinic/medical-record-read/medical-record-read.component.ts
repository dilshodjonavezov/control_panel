import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, TableComponent, TableColumn, InputComponent, ButtonComponent, ModalComponent } from '../../../shared/components';
import { CitizenReadCardComponent, CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';
import { MedicalVisitAddEditComponent, type MedicalVisitRecord } from '../medical-visit-add-edit/medical-visit-add-edit.component';
import { AttachmentsUploadComponent } from '../attachments-upload/attachments-upload.component';
import { MedicalRecordCreateEditComponent } from '../medical-record-create-edit/medical-record-create-edit.component';

interface MedicalVisitItem {
  id: string;
  date: string;
  doctor: string;
  diagnosis: string;
  status: 'DRAFT' | 'FINAL';
}

@Component({
  selector: 'app-medical-record-read',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, ButtonComponent, ModalComponent, MedicalVisitAddEditComponent, AttachmentsUploadComponent, MedicalRecordCreateEditComponent],
  templateUrl: './medical-record-read.component.html',
  styleUrl: './medical-record-read.component.css'
})
export class MedicalRecordReadComponent {
  showVisitModal = false;
  showAttachmentsModal = false;
  selectedVisitId: string | null = null;
  search = {
    citizenId: '',
    iin: ''
  };

  citizen = signal<CitizenReadCardData | null>({
    id: 'CIT-771102',
    iin: '800101300123',
    fullName: 'Иванов Петр Павлович',
    birthDate: '01.01.1980',
    status: 'ACTIVE'
  });

  recordStatus = signal<'EXISTS' | 'MISSING'>('EXISTS');
  showRecordModal = false;

  columns: TableColumn[] = [
    { key: 'date', label: 'Дата', sortable: true },
    { key: 'doctor', label: 'Врач', sortable: true },
    { key: 'diagnosis', label: 'Диагноз', sortable: true },
    { key: 'status', label: 'Статус', sortable: true }
  ];

  visits: MedicalVisitItem[] = [
    { id: 'v-101', date: '24.01.2026', doctor: 'Сидорова А.В.', diagnosis: 'ОРВИ', status: 'FINAL' },
    { id: 'v-099', date: '18.01.2026', doctor: 'Ким Д.А.', diagnosis: 'Плановый осмотр', status: 'FINAL' },
    { id: 'v-097', date: '12.01.2026', doctor: 'Рахимова Н.С.', diagnosis: 'Жалобы на боли', status: 'DRAFT' }
  ];

  constructor() {}

  createRecord(): void {
    this.recordStatus.set('EXISTS');
    this.showRecordModal = true;
  }

  editRecord(): void {
    this.showRecordModal = true;
  }

  closeRecordModal(): void {
    this.showRecordModal = false;
  }

  openVisit(visit: MedicalVisitItem): void {
    this.selectedVisitId = visit.id;
    this.showVisitModal = true;
  }

  addVisit(): void {
    this.selectedVisitId = null;
    this.showVisitModal = true;
  }

  closeVisitModal(): void {
    this.showVisitModal = false;
    this.selectedVisitId = null;
  }

  handleVisitSaved(record: MedicalVisitRecord): void {
    const id = record.id && record.id !== 'new' ? record.id : `v-${Date.now()}`;
    const item: MedicalVisitItem = {
      id,
      date: this.formatVisitDate(record.visitDate),
      doctor: record.doctor || '—',
      diagnosis: record.diagnosis || '—',
      status: record.status
    };

    this.visits = [item, ...this.visits.filter((visit) => visit.id !== id)];
    this.closeVisitModal();
  }

  openAttachments(): void {
    this.showAttachmentsModal = true;
  }

  closeAttachments(): void {
    this.showAttachmentsModal = false;
  }

  getStatusLabel(status: MedicalVisitItem['status']): string {
    return status === 'FINAL' ? 'Закрыто' : 'Черновик';
  }

  private formatVisitDate(value: string): string {
    if (!value) {
      return '—';
    }
    const parts = value.split('-');
    if (parts.length !== 3) {
      return value;
    }
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
  }
}
