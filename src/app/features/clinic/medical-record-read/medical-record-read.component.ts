import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, TableComponent, TableColumn, InputComponent, SelectComponent, SelectOption, ButtonComponent, ModalComponent } from '../../../shared/components';
import { CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';
import { LocalPersonWorkflowService } from '../../../services/local-person-workflow.service';

interface MedicalVisitItem {
  id: string;
  patientFullName: string;
  date: string;
  doctor: string;
  diagnosis: string;
  status: 'DRAFT' | 'FINAL';
}

interface LocalSchoolRecord {
  peopleId: number;
  peopleFullName: string;
  status?: 'Учится' | 'Закончил' | 'Отчислен' | string;
}

type FitnessDecision = 'FIT' | 'UNFIT';

@Component({
  selector: 'app-medical-record-read',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, SelectComponent, ButtonComponent, ModalComponent],
  templateUrl: './medical-record-read.component.html',
  styleUrl: './medical-record-read.component.css'
})
export class MedicalRecordReadComponent implements OnInit {
  private readonly localSchoolRecordsKey = 'local_school_records_v1';
  private readonly localClinicVisitsKey = 'local_clinic_visits_v1';

  showExamModal = false;
  isEditExamMode = false;
  editingVisitId: string | null = null;

  showDeleteModal = false;
  deletingVisit: MedicalVisitItem | null = null;

  draftFilters = {
    doctor: '',
    diagnosis: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  };

  appliedFilters = { ...this.draftFilters };

  citizen = signal<CitizenReadCardData | null>(null);

  candidateOptions: SelectOption[] = [];
  selectedCandidateId = '';
  decisionOptions: SelectOption[] = [
    { value: 'FIT', label: 'Годен к службе' },
    { value: 'UNFIT', label: 'Не годен к службе' },
  ];

  fitReasonOptions: SelectOption[] = [
    { value: 'Категория здоровья А (без ограничений)', label: 'Категория А (без ограничений)' },
    { value: 'Категория здоровья Б (с незначительными ограничениями)', label: 'Категория Б (незначительные ограничения)' },
    { value: 'Стабильное состояние по итогам осмотра', label: 'Стабильное состояние' },
  ];

  unfitReasonOptions: SelectOption[] = [
    { value: 'Хроническое заболевание сердечно-сосудистой системы', label: 'Хроническое заболевание (ССС)' },
    { value: 'Заболевание опорно-двигательного аппарата', label: 'Проблемы опорно-двигательного аппарата' },
    { value: 'Выраженные нарушения зрения', label: 'Выраженные нарушения зрения' },
    { value: 'Психоневрологические противопоказания', label: 'Психоневрологические противопоказания' },
  ];

  examForm: {
    examDate: string;
    doctor: string;
    decision: FitnessDecision | '';
    reason: string;
    note: string;
  } = {
    examDate: '',
    doctor: '',
    decision: '',
    reason: '',
    note: '',
  };

  examErrorMessage = '';
  examSuccessMessage = '';

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

  visits: MedicalVisitItem[] = [];

  constructor(private readonly workflowService: LocalPersonWorkflowService) {}

  ngOnInit(): void {
    this.loadVisits();
    this.loadGraduatedCandidates();
  }

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

  get reasonOptions(): SelectOption[] {
    if (this.examForm.decision === 'FIT') {
      return this.fitReasonOptions;
    }
    if (this.examForm.decision === 'UNFIT') {
      return this.unfitReasonOptions;
    }
    return [];
  }

  get examModalTitle(): string {
    return this.isEditExamMode ? 'Изменение осмотра' : 'Призывной осмотр';
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

  openCreateExamModal(): void {
    this.isEditExamMode = false;
    this.editingVisitId = null;
    this.resetExamForm();
    this.showExamModal = true;
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
  }

  openEditExamModal(visit: MedicalVisitItem): void {
    this.isEditExamMode = true;
    this.editingVisitId = visit.id;
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
    this.fillExamFormFromVisit(visit);
    this.showExamModal = true;
  }

  closeExamModal(): void {
    this.showExamModal = false;
  }

  onCandidateChanged(value: string | number | null): void {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    this.selectedCandidateId = id.toString();
    const option = this.candidateOptions.find((item) => Number(item.value) === id);
    if (!option) {
      return;
    }

    this.citizen.set({
      id: `CIT-${id}`,
      iin: '—',
      fullName: option.label,
      birthDate: '—',
      status: 'ACTIVE'
    });
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
  }

  onDecisionChanged(value: string | number | null): void {
    if (value !== 'FIT' && value !== 'UNFIT') {
      this.examForm.decision = '';
      this.examForm.reason = '';
      return;
    }

    this.examForm.decision = value;
    this.examForm.reason = '';
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
  }

  saveFitnessDecision(): void {
    this.examErrorMessage = '';
    this.examSuccessMessage = '';

    if (!this.selectedCandidateId) {
      this.examErrorMessage = 'Выберите кандидата из списка школы.';
      return;
    }

    if (!this.examForm.examDate) {
      this.examErrorMessage = 'Укажите дату осмотра.';
      return;
    }

    if (!this.examForm.doctor.trim()) {
      this.examErrorMessage = 'Укажите врача, который осмотрел.';
      return;
    }

    if (!this.examForm.decision) {
      this.examErrorMessage = 'Выберите итог осмотра.';
      return;
    }

    if (!this.examForm.reason.trim()) {
      this.examErrorMessage = 'Выберите причину.';
      return;
    }

    const candidate = this.candidateOptions.find((item) => item.value.toString() === this.selectedCandidateId);
    if (!candidate) {
      this.examErrorMessage = 'Кандидат не найден.';
      return;
    }

    const finalStatus = this.examForm.decision === 'FIT' ? 'Годен к службе' : 'Не годен к службе';
    const note = [this.examForm.reason.trim(), this.examForm.note.trim()].filter((item) => item.length > 0).join('. ');
    this.workflowService.setManualStatus(candidate.label, finalStatus, note || undefined);

    const item: MedicalVisitItem = {
      id: this.editingVisitId ?? `med-${Date.now()}`,
      patientFullName: candidate.label,
      date: this.formatVisitDate(this.examForm.examDate),
      doctor: this.examForm.doctor.trim(),
      diagnosis: `${finalStatus}. ${this.examForm.reason}`,
      status: 'FINAL'
    };

    this.visits = [item, ...this.visits.filter((visit) => visit.id !== item.id)];
    this.persistVisits();

    this.examSuccessMessage = this.isEditExamMode
      ? 'Осмотр обновлен.'
      : `Решение сохранено: ${finalStatus}.`;
    this.closeExamModal();
  }

  openDeleteModal(visit: MedicalVisitItem): void {
    this.deletingVisit = visit;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingVisit = null;
  }

  confirmDeleteVisit(): void {
    if (!this.deletingVisit) {
      return;
    }

    this.visits = this.visits.filter((item) => item.id !== this.deletingVisit!.id);
    this.persistVisits();
    this.closeDeleteModal();
  }

  getStatusLabel(status: MedicalVisitItem['status']): string {
    return status === 'FINAL' ? 'Закрыто' : 'Черновик';
  }

  private fillExamFormFromVisit(visit: MedicalVisitItem): void {
    const matched = this.candidateOptions.find((item) => item.label === visit.patientFullName);
    if (matched) {
      this.selectedCandidateId = matched.value.toString();
      this.onCandidateChanged(this.selectedCandidateId);
    } else {
      this.selectedCandidateId = '';
    }

    const parsed = this.parseDiagnosis(visit.diagnosis);
    this.examForm = {
      examDate: this.toInputDate(visit.date),
      doctor: visit.doctor === '—' ? '' : visit.doctor,
      decision: parsed.decision,
      reason: parsed.reason,
      note: '',
    };
  }

  private parseDiagnosis(diagnosis: string): { decision: FitnessDecision | ''; reason: string } {
    const value = (diagnosis || '').trim();
    if (value.startsWith('Годен к службе')) {
      return {
        decision: 'FIT',
        reason: value.replace('Годен к службе.', '').trim(),
      };
    }
    if (value.startsWith('Не годен к службе')) {
      return {
        decision: 'UNFIT',
        reason: value.replace('Не годен к службе.', '').trim(),
      };
    }
    return { decision: '', reason: '' };
  }

  private resetExamForm(): void {
    this.examForm = {
      examDate: new Date().toISOString().slice(0, 10),
      doctor: '',
      decision: '',
      reason: '',
      note: '',
    };

    if (this.candidateOptions.length > 0) {
      this.onCandidateChanged(this.candidateOptions[0].value);
    } else {
      this.selectedCandidateId = '';
      this.citizen.set(null);
    }
  }

  private loadGraduatedCandidates(): void {
    const raw = localStorage.getItem(this.localSchoolRecordsKey);
    if (!raw) {
      this.candidateOptions = [];
      this.selectedCandidateId = '';
      this.citizen.set(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as LocalSchoolRecord[];
      if (!Array.isArray(parsed)) {
        this.candidateOptions = [];
        return;
      }

      const byId = new Map<number, string>();
      parsed.forEach((item) => {
        if ((item.status || '').trim() !== 'Закончил') {
          return;
        }
        const id = Number(item.peopleId);
        const name = (item.peopleFullName || '').trim();
        if (!Number.isInteger(id) || id <= 0 || !name) {
          return;
        }
        byId.set(id, name);
      });

      this.candidateOptions = Array.from(byId.entries())
        .map(([id, label]) => ({ value: id.toString(), label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
    } catch {
      this.candidateOptions = [];
      this.selectedCandidateId = '';
      this.citizen.set(null);
    }
  }

  private loadVisits(): void {
    const raw = localStorage.getItem(this.localClinicVisitsKey);
    if (!raw) {
      this.visits = [];
      return;
    }

    try {
      const parsed = JSON.parse(raw) as MedicalVisitItem[];
      this.visits = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.visits = [];
    }
  }

  private persistVisits(): void {
    localStorage.setItem(this.localClinicVisitsKey, JSON.stringify(this.visits));
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

  private toInputDate(value: string): string {
    const parts = value.split('.');
    if (parts.length !== 3) {
      return '';
    }
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }
}
