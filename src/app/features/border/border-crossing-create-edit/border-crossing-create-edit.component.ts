import { Component, OnChanges, SimpleChanges, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, InputComponent, SelectComponent, SelectOption, ButtonComponent } from '../../../shared/components';
import { type CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';
type CrossingType = 'EXIT' | 'ENTRY';

interface BorderCrossingRecord {
  id: string;
  fullName: string;
  crossingDate: string;
  checkpoint: string;
  type: CrossingType;
  country: string;
  notes: string;
}

@Component({
  selector: 'app-border-crossing-create-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './border-crossing-create-edit.component.html',
  styleUrl: './border-crossing-create-edit.component.css'
})
export class BorderCrossingCreateEditComponent implements OnChanges {
  @Input() citizen: CitizenReadCardData | null = null;
  @Input() recordId: string | null = null;
  @Input() embedded: boolean = false;
  @Output() closed = new EventEmitter<void>();

  status = signal<'SAVED' | 'UPDATED' | null>(null);
  lastActionAt = signal<string | null>(null);

  record: BorderCrossingRecord = {
    id: 'bc-101',
    fullName: 'Иванов Петр Павлович',
    crossingDate: '2026-01-25',
    checkpoint: 'КПП Алматы-1',
    type: 'EXIT',
    country: 'Кыргызстан',
    notes: 'Выезд по учебе'
  };

  typeOptions: SelectOption[] = [
    { value: 'EXIT', label: 'Выезд' },
    { value: 'ENTRY', label: 'Въезд' }
  ];

  private recordById: Record<string, BorderCrossingRecord> = {
    'bc-101': {
      id: 'bc-101',
      fullName: 'Иванов Петр Павлович',
      crossingDate: '2026-01-25',
      checkpoint: 'КПП Алматы-1',
      type: 'EXIT',
      country: 'Кыргызстан',
      notes: 'Выезд по учебе'
    },
    'bc-098': {
      id: 'bc-098',
      fullName: 'Соколова Марина Андреевна',
      crossingDate: '2025-06-10',
      checkpoint: 'КПП Нур-Султан',
      type: 'ENTRY',
      country: 'Россия',
      notes: 'Возвращение'
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recordId']) {
      this.loadRecord(this.recordId);
    }
    if (changes['citizen']) {
      this.applyAbroadStatus();
    }
  }

  save(): void {
    this.status.set('SAVED');
    this.lastActionAt.set(this.getNowLabel());
    this.applyAbroadStatus();
  }

  update(): void {
    this.status.set('UPDATED');
    this.lastActionAt.set(this.getNowLabel());
    this.applyAbroadStatus();
  }

  close(): void {
    if (this.embedded) {
      this.closed.emit();
    }
  }

  private loadRecord(id: string | null): void {
    if (id && this.recordById[id]) {
      this.record = { ...this.recordById[id] };
      return;
    }
    this.record = {
      id: 'new',
      fullName: this.citizen?.fullName || '',
      crossingDate: '',
      checkpoint: '',
      type: 'EXIT',
      country: '',
      notes: ''
    };
  }

  private applyAbroadStatus(): void {
    if (!this.citizen) return;
    if (!this.record.fullName) {
      this.record.fullName = this.citizen.fullName;
    }
    if (this.record.type === 'EXIT' && this.isMoreThanSixMonths(this.record.crossingDate)) {
      this.citizen = { ...this.citizen, status: 'ABROAD' };
    }
  }

  private isMoreThanSixMonths(dateValue: string): boolean {
    if (!dateValue) return false;
    const crossing = new Date(dateValue);
    const now = new Date();
    const diffMonths = (now.getFullYear() - crossing.getFullYear()) * 12 + (now.getMonth() - crossing.getMonth());
    return diffMonths >= 6;
  }

  private getNowLabel(): string {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }
}


