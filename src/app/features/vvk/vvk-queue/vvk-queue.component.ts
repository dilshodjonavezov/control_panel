import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin, TimeoutError, timeout } from 'rxjs';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  ModalComponent,
  SelectComponent,
  SelectOption,
  TableComponent,
  TableColumn,
} from '../../../shared/components';
import { MedicalRecordsService, ApiMedicalRecord } from '../../../services/medical-records.service';
import { AuthService } from '../../../services/auth.service';
import {
  ApiVvkResult,
  CreateVvkResultRequest,
  VvkResultsService,
} from '../../../services/vvk-results.service';

type Decision = 'FIT' | 'UNFIT';
type VvkCategory = 'A' | 'B' | 'C' | 'D_UNFIT';

interface MilitaryRecordItem {
  id: number;
  fullName: string;
  peopleId: number;
  medicalVisitId: number;
  fatherFullName: string;
  motherFullName: string;
  addressLabel: string;
  clinic: string;
  decision: Decision;
  reason: string;
  defermentReason: string;
  createdAtRecord: string;
  vvkCategory: string;
  vvkDecision: string;
  vvkResultId: number | null;
}

interface VvkFormData {
  peopleId: string;
  medicalVisitId: string;
  fullName: string;
  examDate: string;
  category: VvkCategory;
  reason: string;
  notes: string;
  nextReviewDate: string;
}

@Component({
  selector: 'app-vvk-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, SelectComponent, ButtonComponent, ModalComponent],
  templateUrl: './vvk-queue.component.html',
  styleUrl: './vvk-queue.component.css',
})
export class VvkQueueComponent implements OnInit {
  filters = {
    fullName: '',
    address: '',
    decision: 'all',
  };

  columns: TableColumn[] = [
    { key: 'fullName', label: 'ФИО', sortable: true },
    { key: 'fatherFullName', label: 'ФИО отца', sortable: true },
    { key: 'motherFullName', label: 'ФИО матери', sortable: true },
    { key: 'addressLabel', label: 'Адрес', sortable: true },
    { key: 'clinic', label: 'Поликлиника', sortable: true },
    { key: 'decision', label: 'Медосмотр', sortable: true },
    { key: 'vvkDecision', label: 'Решение ВВК', sortable: true },
    { key: 'createdAtRecord', label: 'Дата', sortable: true },
  ];

  decisionOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'FIT', label: 'Годен' },
    { value: 'UNFIT', label: 'Не годен' },
  ];

  vvkCategoryOptions: SelectOption[] = [
    { value: 'A', label: 'A — годен' },
    { value: 'B', label: 'B — годен с ограничениями' },
    { value: 'C', label: 'C — временно не годен' },
    { value: 'D_UNFIT', label: 'D — не годен' },
  ];

  records: MilitaryRecordItem[] = [];
  isLoading = false;
  errorMessage = '';
  showResultModal = false;
  isSubmitting = false;
  submitError = '';
  editingItem: MilitaryRecordItem | null = null;
  formData: VvkFormData = this.createDefaultForm();

  constructor(
    private readonly medicalRecordsService: MedicalRecordsService,
    private readonly vvkResultsService: VvkResultsService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('action') !== 'results') {
        return;
      }
      this.filters = { fullName: '', address: '', decision: 'all' };
    });
  }

  get filteredRecords(): MilitaryRecordItem[] {
    const byName = this.filters.fullName.trim().toLowerCase();
    const byAddress = this.filters.address.trim().toLowerCase();
    const byDecision = this.filters.decision;

    return this.records.filter((record) => {
      const matchesName = !byName || record.fullName.toLowerCase().includes(byName);
      const matchesAddress = !byAddress || record.addressLabel.toLowerCase().includes(byAddress);
      const matchesDecision = byDecision === 'all' || record.decision === byDecision;
      return matchesName && matchesAddress && matchesDecision;
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      medicalRecords: this.medicalRecordsService.getAll(),
      vvkResults: this.vvkResultsService.getAll(),
    })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: ({ medicalRecords, vvkResults }) => {
          const latestVvkByPeopleId = new Map<number, ApiVvkResult>();
          [...vvkResults]
            .sort((left, right) => String(right.examDate ?? '').localeCompare(String(left.examDate ?? '')))
            .forEach((item) => {
              if (!latestVvkByPeopleId.has(item.peopleId)) {
                latestVvkByPeopleId.set(item.peopleId, item);
              }
            });

          this.records = medicalRecords.map((record) => this.mapRecord(record, latestVvkByPeopleId.get(record.peopleId) ?? null));
        },
        error: (error: unknown) => {
          this.records = [];
          this.errorMessage = error instanceof TimeoutError
            ? 'Превышено время ожидания ответа API.'
            : 'Не удалось загрузить записи ВВК.';
        },
      });
  }

  openResultModal(item: MilitaryRecordItem): void {
    this.editingItem = item;
    this.submitError = '';
    this.formData = {
      peopleId: String(item.peopleId),
      medicalVisitId: String(item.medicalVisitId),
      fullName: item.fullName,
      examDate: new Date().toISOString().slice(0, 10),
      category: this.inferCategory(item),
      reason: item.reason === '-' ? '' : item.reason,
      notes: '',
      nextReviewDate: '',
    };
    this.showResultModal = true;
  }

  closeResultModal(): void {
    if (this.isSubmitting) {
      return;
    }
    this.showResultModal = false;
    this.editingItem = null;
    this.submitError = '';
  }

  saveResult(): void {
    if (!this.editingItem) {
      return;
    }

    const userId = this.authService.resolveCurrentUserId();
    if (!userId) {
      this.submitError = 'Не удалось определить текущего пользователя.';
      return;
    }

    if (!this.formData.examDate) {
      this.submitError = 'Укажите дату решения ВВК.';
      return;
    }

    const payload: CreateVvkResultRequest = {
      peopleId: Number(this.formData.peopleId),
      userId,
      medicalVisitId: Number(this.formData.medicalVisitId) || null,
      examDate: this.formData.examDate,
      category: this.formData.category,
      queueStatus: 'DONE',
      reason: this.formData.reason.trim() || null,
      notes: this.formData.notes.trim() || null,
      nextReviewDate: this.formData.nextReviewDate || null,
    };

    this.isSubmitting = true;
    this.submitError = '';

    const request$ = this.editingItem.vvkResultId
      ? this.vvkResultsService.update(this.editingItem.vvkResultId, payload)
      : this.vvkResultsService.create(payload);

    request$
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            this.submitError = 'Не удалось сохранить решение ВВК.';
            return;
          }
          this.showResultModal = false;
          this.editingItem = null;
          this.loadData();
        },
        error: (error: unknown) => {
          this.submitError = error instanceof TimeoutError
            ? 'Превышено время ожидания ответа API.'
            : 'Не удалось сохранить решение ВВК.';
        },
      });
  }

  getStatusLabel(decision: string): string {
    return decision === 'UNFIT' ? 'Не годен' : 'Годен';
  }

  private mapRecord(record: ApiMedicalRecord, vvkResult: ApiVvkResult | null): MilitaryRecordItem {
    return {
      id: record.id,
      peopleId: record.peopleId,
      medicalVisitId: record.id,
      fullName: record.peopleFullName?.trim() || `ID ${record.peopleId}`,
      fatherFullName: record.fatherFullName?.trim() || '-',
      motherFullName: record.motherFullName?.trim() || '-',
      addressLabel: record.addressLabel?.trim() || '-',
      clinic: record.clinic?.trim() || '-',
      decision: (record.decision as Decision) ?? 'FIT',
      reason: record.reason?.trim() || '-',
      defermentReason: record.defermentReason?.trim() || '-',
      createdAtRecord: record.createdAtRecord ? this.formatDate(record.createdAtRecord) : '-',
      vvkCategory: vvkResult?.category?.trim() || 'Нет решения',
      vvkDecision: this.formatVvkDecision(vvkResult),
      vvkResultId: vvkResult?.id ?? null,
    };
  }

  private inferCategory(item: MilitaryRecordItem): VvkCategory {
    if (item.vvkCategory === 'A' || item.vvkCategory === 'B' || item.vvkCategory === 'C' || item.vvkCategory === 'D_UNFIT') {
      return item.vvkCategory;
    }
    return item.decision === 'UNFIT' ? 'D_UNFIT' : 'A';
  }

  private formatVvkDecision(item: ApiVvkResult | null): string {
    if (!item) {
      return 'Нет решения';
    }

    if (item.finalDecision === 'UNFIT') {
      return 'Не годен';
    }
    if (item.finalDecision === 'TEMP_UNFIT') {
      return 'Временно не годен';
    }
    if (item.finalDecision === 'FIT') {
      return 'Годен';
    }
    return item.finalDecision?.trim() || 'Нет решения';
  }

  private createDefaultForm(): VvkFormData {
    return {
      peopleId: '',
      medicalVisitId: '',
      fullName: '',
      examDate: new Date().toISOString().slice(0, 10),
      category: 'A',
      reason: '',
      notes: '',
      nextReviewDate: '',
    };
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('ru-RU');
  }
}
