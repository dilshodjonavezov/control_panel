import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, TableComponent, TableColumn, InputComponent, SelectComponent, SelectOption, ButtonComponent, ModalComponent } from '../../../shared/components';
import { CitizenReadCardComponent, CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';
import { MedicalVisitAddEditComponent, type MedicalVisitRecord } from '../medical-visit-add-edit/medical-visit-add-edit.component';
import { AttachmentsUploadComponent } from '../attachments-upload/attachments-upload.component';
import { MedicalRecordCreateEditComponent } from '../medical-record-create-edit/medical-record-create-edit.component';

interface MedicalVisitItem {
  id: string;
  patientFullName: string;
  date: string;
  doctor: string;
  diagnosis: string;
  status: 'DRAFT' | 'FINAL';
}

@Component({
  selector: 'app-medical-record-read',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, SelectComponent, ButtonComponent, ModalComponent, MedicalVisitAddEditComponent, AttachmentsUploadComponent, MedicalRecordCreateEditComponent],
  templateUrl: './medical-record-read.component.html',
  styleUrl: './medical-record-read.component.css'
})
export class MedicalRecordReadComponent {
  showVisitModal = false;
  showAttachmentsModal = false;
  selectedVisitId: string | null = null;

  draftFilters = {
    doctor: '',
    diagnosis: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  };

  appliedFilters = { ...this.draftFilters };

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
    { key: 'patientFullName', label: 'Пациент', sortable: true },
    { key: 'date', label: 'Дата', sortable: true },
    { key: 'doctor', label: 'Врач', sortable: true },
    { key: 'diagnosis', label: 'Диагноз', sortable: true },
    { key: 'status', label: 'Статус', sortable: true }
  ];

  statusFilterOptions: SelectOption[] = [
    { value: 'all', label: 'Все статусы' },
    { value: 'FINAL', label: 'Закрыто' },
    { value: 'DRAFT', label: 'Черновик' }
  ];

  visits: MedicalVisitItem[] = [
    { id: 'v-101', patientFullName: 'Иванов Петр Павлович', date: '24.01.2026', doctor: 'Сидорова А.В.', diagnosis: 'ОРВИ', status: 'FINAL' },
    { id: 'v-099', patientFullName: 'Иванов Петр Павлович', date: '18.01.2026', doctor: 'Ким Д.А.', diagnosis: 'Плановый осмотр', status: 'FINAL' },
    { id: 'v-097', patientFullName: 'Иванов Петр Павлович', date: '12.01.2026', doctor: 'Рахимова Н.С.', diagnosis: 'Жалобы на боли', status: 'DRAFT' }
  ];

  constructor() {}

  get filteredVisits(): MedicalVisitItem[] {
    const byDoctor = this.appliedFilters.doctor.trim().toLowerCase();
    const byDiagnosis = this.appliedFilters.diagnosis.trim().toLowerCase();
    const byStatus = this.appliedFilters.status;
    const from = this.appliedFilters.dateFrom;
    const to = this.appliedFilters.dateTo;

    return this.visits.filter((visit) => {
      const visitDate = this.toIsoDate(visit.date);
      if (byDoctor && !visit.doctor.toLowerCase().includes(byDoctor)) return false;
      if (byDiagnosis && !visit.diagnosis.toLowerCase().includes(byDiagnosis)) return false;
      if (byStatus !== 'all' && visit.status !== byStatus) return false;
      if (from && visitDate < from) return false;
      if (to && visitDate > to) return false;
      return true;
    });
  }

  applyFilters(): void {
    this.appliedFilters = { ...this.draftFilters };
  }

  resetFilters(): void {
    this.draftFilters = {
      doctor: '',
      diagnosis: '',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    };
    this.applyFilters();
  }

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
      patientFullName: record.patientFullName || this.citizen()?.fullName || '—',
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

  private toIsoDate(value: string): string {
    const parts = value.split('.');
    if (parts.length !== 3) return value;
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }
}
