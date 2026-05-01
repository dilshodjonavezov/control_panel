import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin, TimeoutError, timeout } from 'rxjs';
import { CardComponent, TableComponent, TableColumn, InputComponent, SelectComponent, SelectOption, ButtonComponent, ModalComponent } from '../../../shared/components';
import { AuthService } from '../../../services/auth.service';
import { MedicalRecordsService, ApiMedicalRecord, ApiSchoolRecord, CreateMedicalRecordRequest } from '../../../services/medical-records.service';

type Decision = 'FIT' | 'UNFIT';

interface MedicalVisitItem {
  id: number;
  peopleId: number;
  patientFullName: string;
  fatherFullName: string;
  motherFullName: string;
  addressLabel: string;
  clinic: string;
  date: string;
  decision: Decision;
  reason: string;
  defermentReason: string;
  notes: string;
}

interface ExamForm {
  peopleId: string;
  clinic: string;
  examDate: string;
  decision: Decision | '';
  reason: string;
  defermentReason: string;
  notes: string;
}

@Component({
  selector: 'app-medical-record-read',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, SelectComponent, ButtonComponent, ModalComponent],
  templateUrl: './medical-record-read.component.html',
  styleUrl: './medical-record-read.component.css'
})
export class MedicalRecordReadComponent implements OnInit {
  filters = {
    fullName: '',
    address: '',
    decision: 'all',
  };

  columns: TableColumn[] = [
    { key: 'patientFullName', label: 'ФИО', sortable: true },
    { key: 'fatherFullName', label: 'ФИО отца', sortable: true },
    { key: 'motherFullName', label: 'ФИО матери', sortable: true },
    { key: 'addressLabel', label: 'Адрес', sortable: true },
    { key: 'clinic', label: 'Поликлиника', sortable: true },
    { key: 'decision', label: 'Годность', sortable: true },
    { key: 'reason', label: 'Причина', sortable: true },
    { key: 'defermentReason', label: 'Отсрочка', sortable: true },
    { key: 'date', label: 'Дата', sortable: true },
  ];

  records: MedicalVisitItem[] = [];
  candidateOptions: SelectOption[] = [];
  decisionOptions: SelectOption[] = [
    { value: 'FIT', label: 'Годен' },
    { value: 'UNFIT', label: 'Не годен' },
  ];

  isLoading = false;
  errorMessage = '';

  showExamModal = false;
  isEditExamMode = false;
  editingVisitId: number | null = null;
  isFormSubmitting = false;
  examErrorMessage = '';
  examSuccessMessage = '';

  examForm: ExamForm = this.resetExamFormData();

  private graduatedCandidates: ApiSchoolRecord[] = [];
  private citizensById = new Map<number, { fullName: string; fatherFullName: string; motherFullName: string }>();

  constructor(
    private readonly medicalRecordsService: MedicalRecordsService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.route.queryParamMap.subscribe((params) => {
      const action = params.get('action');
      if (!action) {
        return;
      }

      if (action === 'exam') {
        this.openCreateExamModal();
        return;
      }

      this.filters = { fullName: '', address: '', decision: 'all' };
    });
  }

  get filteredVisits(): MedicalVisitItem[] {
    const byName = this.filters.fullName.trim().toLowerCase();
    const byAddress = this.filters.address.trim().toLowerCase();
    const byDecision = this.filters.decision;

    return this.records.filter((record) => {
      const matchesName = !byName || record.patientFullName.toLowerCase().includes(byName);
      const matchesAddress = !byAddress || record.addressLabel.toLowerCase().includes(byAddress);
      const matchesDecision = byDecision === 'all' || record.decision === byDecision;
      return matchesName && matchesAddress && matchesDecision;
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      records: this.medicalRecordsService.getAll(),
      graduates: this.medicalRecordsService.getGraduatedSchoolRecords(),
      citizens: this.medicalRecordsService.getCitizens(),
    })
      .pipe(timeout(15000))
      .subscribe({
        next: ({ records, graduates, citizens }) => {
          this.graduatedCandidates = graduates;
          this.citizensById = new Map(
            citizens.map((citizen) => [citizen.id, {
              fullName: citizen.fullName,
              fatherFullName: citizen.fatherFullName ?? '',
              motherFullName: citizen.motherFullName ?? '',
            }]),
          );
          this.candidateOptions = this.buildCandidateOptions(graduates);
          this.records = records.map((record) => this.mapRecord(record));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.records = [];
          this.candidateOptions = [];
          this.graduatedCandidates = [];
          this.citizensById.clear();
          this.errorMessage = error instanceof TimeoutError
            ? 'Превышено время ожидания ответа API.'
            : 'Не удалось загрузить медицинские записи.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  openCreateExamModal(): void {
    this.isEditExamMode = false;
    this.editingVisitId = null;
    this.examForm = this.resetExamFormData();
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
    this.showExamModal = true;
  }

  openEditExamModal(visit: MedicalVisitItem): void {
    this.isEditExamMode = true;
    this.editingVisitId = visit.id;
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
    this.examForm = {
      peopleId: String(visit.peopleId),
      clinic: visit.clinic === '-' ? '' : visit.clinic,
      examDate: this.toInputDate(visit.date),
      decision: visit.decision,
      reason: visit.reason === '-' ? '' : visit.reason,
      defermentReason: visit.defermentReason === '-' ? '' : visit.defermentReason,
      notes: visit.notes === '-' ? '' : visit.notes,
    };
    this.showExamModal = true;
  }

  closeExamModal(): void {
    if (this.isFormSubmitting) {
      return;
    }
    this.showExamModal = false;
  }

  onCandidateChanged(value: string | number | null): void {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      return;
    }
    this.examForm.peopleId = id.toString();
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
  }

  onDecisionChanged(value: string | number | null): void {
    if (value !== 'FIT' && value !== 'UNFIT') {
      this.examForm.decision = '';
      return;
    }
    this.examForm.decision = value;
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
  }

  saveFitnessDecision(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.isFormSubmitting = true;
    this.examErrorMessage = '';
    this.examSuccessMessage = '';

    const request$ =
      this.isEditExamMode && this.editingVisitId
        ? this.medicalRecordsService.update(this.editingVisitId, payload)
        : this.medicalRecordsService.create(payload);

    request$
      .pipe(
        finalize(() => {
          this.isFormSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (ok) => {
          if (!ok) {
            this.examErrorMessage = this.isEditExamMode ? 'Не удалось изменить запись.' : 'Не удалось создать запись.';
            return;
          }
          this.showExamModal = false;
          this.loadData();
        },
        error: () => {
          this.examErrorMessage = this.isEditExamMode ? 'Не удалось изменить запись.' : 'Не удалось создать запись.';
        },
      });
  }

  getStatusLabel(status: string): string {
    return status === 'UNFIT' ? 'Не годен' : 'Годен';
  }

  private mapRecord(record: ApiMedicalRecord): MedicalVisitItem {
    return {
      id: record.id,
      peopleId: record.peopleId,
      patientFullName: record.peopleFullName?.trim() || `ID ${record.peopleId}`,
      fatherFullName: record.fatherFullName?.trim() || '-',
      motherFullName: record.motherFullName?.trim() || '-',
      addressLabel: record.addressLabel?.trim() || '-',
      clinic: record.clinic?.trim() || '-',
      date: this.formatDate(record.createdAtRecord),
      decision: (record.decision as Decision) ?? 'FIT',
      reason: record.reason?.trim() || '-',
      defermentReason: record.defermentReason?.trim() || '-',
      notes: record.notes?.trim() || '-',
    };
  }

  private buildCandidateOptions(records: ApiSchoolRecord[]): SelectOption[] {
    return records
      .slice()
      .sort((a, b) => (a.peopleFullName ?? '').localeCompare(b.peopleFullName ?? '', 'ru'))
      .map((record) => {
        const citizen = this.citizensById.get(record.peopleId);
        const parentBits: string[] = [];
        if (citizen?.fatherFullName) parentBits.push(`отец: ${citizen.fatherFullName}`);
        if (citizen?.motherFullName) parentBits.push(`мать: ${citizen.motherFullName}`);
        const label = record.peopleFullName?.trim() || `ID ${record.peopleId}`;
        return {
          value: String(record.peopleId),
          label: parentBits.length > 0 ? `${label} (${parentBits.join(', ')})` : label,
        };
      });
  }

  private buildPayload(): CreateMedicalRecordRequest | null {
    const peopleId = Number(this.examForm.peopleId);
    const userId = this.authService.resolveCurrentUserId();

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.examErrorMessage = 'Выберите выпускника школы.';
      return null;
    }
    if (!userId) {
      this.examErrorMessage = 'Не удалось определить текущего пользователя.';
      return null;
    }
    if (!this.examForm.clinic.trim()) {
      this.examErrorMessage = 'Укажите поликлинику.';
      return null;
    }
    if (!this.examForm.examDate.trim()) {
      this.examErrorMessage = 'Укажите дату осмотра.';
      return null;
    }
    if (!this.examForm.decision) {
      this.examErrorMessage = 'Выберите итог осмотра.';
      return null;
    }

    return {
      peopleId,
      userId,
      clinic: this.examForm.clinic.trim(),
      decision: this.examForm.decision,
      reason: this.examForm.reason.trim() || null,
      defermentReason: this.examForm.defermentReason.trim() || null,
      createdAtRecord: this.examForm.examDate ? this.toIsoDate(this.examForm.examDate) : null,
      notes: this.examForm.notes.trim() || null,
    };
  }

  private resetExamFormData(): ExamForm {
    return {
      peopleId: '',
      clinic: 'Поликлиника №1',
      examDate: new Date().toISOString().slice(0, 10),
      decision: '',
      reason: '',
      defermentReason: '',
      notes: '',
    };
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('ru-RU');
  }

  private toIsoDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toISOString().split('T')[0];
  }

  private toInputDate(value: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
