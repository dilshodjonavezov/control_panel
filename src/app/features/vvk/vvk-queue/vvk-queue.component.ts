import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin, TimeoutError, timeout } from 'rxjs';
import { CardComponent, TableComponent, TableColumn, InputComponent, SelectComponent, SelectOption, ButtonComponent } from '../../../shared/components';
import { MedicalRecordsService, ApiMedicalRecord } from '../../../services/medical-records.service';

type Decision = 'FIT' | 'UNFIT';

interface MilitaryRecordItem {
  id: number;
  fullName: string;
  fatherFullName: string;
  motherFullName: string;
  addressLabel: string;
  clinic: string;
  decision: Decision;
  reason: string;
  defermentReason: string;
  createdAtRecord: string;
}

@Component({
  selector: 'app-vvk-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './vvk-queue.component.html',
  styleUrl: './vvk-queue.component.css'
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
    { key: 'decision', label: 'Годность', sortable: true },
    { key: 'reason', label: 'Причина', sortable: true },
    { key: 'defermentReason', label: 'Отсрочка', sortable: true },
    { key: 'createdAtRecord', label: 'Дата', sortable: true },
  ];

  decisionOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'FIT', label: 'Годен' },
    { value: 'UNFIT', label: 'Не годен' },
  ];

  records: MilitaryRecordItem[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly medicalRecordsService: MedicalRecordsService,
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

    this.medicalRecordsService
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
          this.records = records.map((record) => this.mapRecord(record));
        },
        error: (error: unknown) => {
          this.records = [];
          this.errorMessage = error instanceof TimeoutError
            ? 'Превышено время ожидания ответа API.'
            : 'Не удалось загрузить записи для военкомата.';
        },
      });
  }

  getStatusLabel(decision: string): string {
    return decision === 'UNFIT' ? 'Не годен' : 'Годен';
  }

  private mapRecord(record: ApiMedicalRecord): MilitaryRecordItem {
    return {
      id: record.id,
      fullName: record.peopleFullName?.trim() || `ID ${record.peopleId}`,
      fatherFullName: record.fatherFullName?.trim() || '-',
      motherFullName: record.motherFullName?.trim() || '-',
      addressLabel: record.addressLabel?.trim() || '-',
      clinic: record.clinic?.trim() || '-',
      decision: (record.decision as Decision) ?? 'FIT',
      reason: record.reason?.trim() || '-',
      defermentReason: record.defermentReason?.trim() || '-',
      createdAtRecord: record.createdAtRecord ? this.formatDate(record.createdAtRecord) : '-',
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
