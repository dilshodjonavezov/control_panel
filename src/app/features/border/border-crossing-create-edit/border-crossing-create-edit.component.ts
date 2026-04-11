import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocalPersonWorkflowService } from '../../../services/local-person-workflow.service';
import { ButtonComponent, CardComponent, InputComponent, SelectComponent, SelectOption } from '../../../shared/components';
import { type CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';

interface BorderCrossingForm {
  peopleId: string;
  userId: string;
  departureDate: string;
  returnDate: string;
  outsideBorder: 'true' | 'false';
  country: string;
  description: string;
}

interface LocalCrossingRecord {
  id: number;
  peopleId: number;
  peopleName: string;
  userId: number;
  userName: string;
  departureDate: string;
  returnDate: string | null;
  outsideBorder: boolean;
  country: string;
  description: string;
}

interface LocalMaternityItem {
  id: number;
  childFullName: string;
}

interface LocalSchoolRecord {
  peopleId: number;
  peopleFullName: string;
}

@Component({
  selector: 'app-border-crossing-create-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './border-crossing-create-edit.component.html',
  styleUrl: './border-crossing-create-edit.component.css',
})
export class BorderCrossingCreateEditComponent implements OnChanges, OnInit {
  private readonly crossingsStorageKey = 'local_border_crossings_v1';
  private readonly schoolStorageKey = 'local_school_records_v1';
  private readonly maternityStorageKey = 'local_maternity_seed_v1';

  @Input() citizen: CitizenReadCardData | null = null;
  @Input() recordId: string | null = null;
  @Input() embedded: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  status = signal<'SAVED' | null>(null);
  lastActionAt = signal<string | null>(null);
  isLoading = false;
  isReferenceLoading = false;
  isSubmitting = false;
  errorMessage = '';

  form: BorderCrossingForm = this.createDefaultForm();
  peopleOptions = signal<SelectOption[]>([]);
  userOptions = signal<SelectOption[]>([]);

  outsideBorderOptions: SelectOption[] = [
    { value: 'true', label: 'Да' },
    { value: 'false', label: 'Нет' },
  ];

  constructor(private readonly workflowService: LocalPersonWorkflowService) {}

  ngOnInit(): void {
    this.loadReferenceData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['recordId'] && !changes['citizen']) {
      return;
    }
    this.loadRecord();
  }

  save(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    const records = this.readCrossings();
    const recordId = Number(this.recordId);
    const isEdit = Number.isInteger(recordId) && recordId > 0;

    if (isEdit) {
      const existingIndex = records.findIndex((item) => item.id === recordId);
      if (existingIndex < 0) {
        this.errorMessage = 'Запись не найдена.';
        this.isSubmitting = false;
        return;
      }
      records[existingIndex] = { ...records[existingIndex], ...payload };
    } else {
      const nextId = records.length > 0 ? Math.max(...records.map((item) => item.id)) + 1 : 1;
      records.unshift({
        id: nextId,
        ...payload,
      });
    }

    this.writeCrossings(records);
    this.workflowService.linkPersonIdToName(payload.peopleId, payload.peopleName);
    this.workflowService.applyBorderState(payload.peopleName, payload.outsideBorder);

    this.status.set('SAVED');
    this.lastActionAt.set(this.getNowLabel());
    this.saved.emit();
    if (this.embedded) {
      this.closed.emit();
    }

    this.isSubmitting = false;
  }

  close(): void {
    if (this.embedded) {
      this.closed.emit();
    }
  }

  private loadRecord(): void {
    this.errorMessage = '';
    this.status.set(null);

    if (!this.recordId) {
      this.form = this.createDefaultForm();
      if (this.citizen?.id) {
        const peopleId = this.extractPeopleId(this.citizen.id);
        if (peopleId) {
          this.form.peopleId = peopleId.toString();
        }
      }
      return;
    }

    const id = Number(this.recordId);
    if (!Number.isInteger(id)) {
      this.errorMessage = 'Некорректный ID записи.';
      return;
    }

    const item = this.readCrossings().find((record) => record.id === id);
    if (!item) {
      this.errorMessage = 'Запись не найдена.';
      return;
    }

    this.form = {
      peopleId: item.peopleId.toString(),
      userId: item.userId.toString(),
      departureDate: this.toDateTimeLocal(item.departureDate),
      returnDate: item.returnDate ? this.toDateTimeLocal(item.returnDate) : '',
      outsideBorder: item.outsideBorder ? 'true' : 'false',
      country: item.country ?? '',
      description: item.description ?? '',
    };
  }

  private loadReferenceData(): void {
    this.isReferenceLoading = true;

    const linkedFromWorkflow = this.readWorkflowPeople();
    const fromSchool = this.readSchoolPeople();
    const fromMaternity = this.readMaternityPeople();

    const combined = new Map<number, string>();
    [...linkedFromWorkflow, ...fromSchool, ...fromMaternity].forEach((item) => {
      if (item.id > 0 && item.fullName.trim()) {
        combined.set(item.id, item.fullName.trim());
      }
    });

    this.peopleOptions.set(
      Array.from(combined.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'ru'))
        .map(([id, fullName]) => ({ value: id, label: fullName })),
    );

    this.userOptions.set([
      { value: 1, label: 'admin' },
      { value: 2, label: 'borderemployee' },
    ]);

    this.isReferenceLoading = false;
  }

  private buildPayload(): Omit<LocalCrossingRecord, 'id'> | null {
    const peopleId = Number(this.form.peopleId);
    const userId = Number(this.form.userId);
    const peopleName = this.resolveSelectedPeopleName(peopleId);
    const userName = this.resolveSelectedUserName(userId);

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.errorMessage = 'Выберите гражданина.';
      return null;
    }

    if (!peopleName) {
      this.errorMessage = 'Не найдено имя гражданина.';
      return null;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      this.errorMessage = 'Выберите пользователя.';
      return null;
    }

    if (!this.form.departureDate) {
      this.errorMessage = 'Укажите дату выезда.';
      return null;
    }

    return {
      peopleId,
      peopleName,
      userId,
      userName,
      departureDate: new Date(this.form.departureDate).toISOString(),
      returnDate: this.form.returnDate ? new Date(this.form.returnDate).toISOString() : null,
      outsideBorder: this.form.outsideBorder === 'true',
      country: this.form.country.trim(),
      description: this.form.description.trim(),
    };
  }

  private createDefaultForm(): BorderCrossingForm {
    return {
      peopleId: '',
      userId: '2',
      departureDate: '',
      returnDate: '',
      outsideBorder: 'true',
      country: '',
      description: '',
    };
  }

  private readCrossings(): LocalCrossingRecord[] {
    const raw = localStorage.getItem(this.crossingsStorageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as LocalCrossingRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeCrossings(records: LocalCrossingRecord[]): void {
    localStorage.setItem(this.crossingsStorageKey, JSON.stringify(records));
  }

  private readSchoolPeople(): Array<{ id: number; fullName: string }> {
    const raw = localStorage.getItem(this.schoolStorageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as LocalSchoolRecord[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((item) => ({ id: Number(item.peopleId), fullName: item.peopleFullName || '' }))
        .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.fullName.trim());
    } catch {
      return [];
    }
  }

  private readMaternityPeople(): Array<{ id: number; fullName: string }> {
    const raw = localStorage.getItem(this.maternityStorageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as LocalMaternityItem[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((item) => ({ id: Number(item.id), fullName: item.childFullName || '' }))
        .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.fullName.trim());
    } catch {
      return [];
    }
  }

  private readWorkflowPeople(): Array<{ id: number; fullName: string }> {
    const raw = localStorage.getItem('local_person_workflow_v1');
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as { personNameById?: Record<string, string> };
      const links = parsed.personNameById ?? {};
      return Object.keys(links)
        .map((idKey) => ({ id: Number(idKey), fullName: links[idKey] ?? '' }))
        .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.fullName.trim());
    } catch {
      return [];
    }
  }

  private toDateTimeLocal(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private extractPeopleId(citizenId: string): number | null {
    const numericPart = citizenId.replace(/[^\d]/g, '');
    if (!numericPart) {
      return null;
    }
    const peopleId = Number(numericPart);
    return Number.isInteger(peopleId) ? peopleId : null;
  }

  private resolveSelectedPeopleName(peopleId: number): string {
    const option = this.peopleOptions().find((item) => Number(item.value) === peopleId);
    return option?.label?.trim() || '';
  }

  private resolveSelectedUserName(userId: number): string {
    const option = this.userOptions().find((item) => Number(item.value) === userId);
    return option?.label?.trim() || `ID ${userId}`;
  }

  private getNowLabel(): string {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }
}
