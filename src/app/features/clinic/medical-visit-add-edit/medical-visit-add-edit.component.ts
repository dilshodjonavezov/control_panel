import { Component, OnInit, OnChanges, SimpleChanges, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, InputComponent, SelectComponent, SelectOption, ButtonComponent } from '../../../shared/components';
import { type CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';
export interface MedicalVisitRecord {
  id: string;
  patientFullName: string;
  visitDate: string;
  doctor: string;
  diagnosis: string;
  notes: string;
  status: 'DRAFT' | 'FINAL';
}

@Component({
  selector: 'app-medical-visit-add-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './medical-visit-add-edit.component.html',
  styleUrl: './medical-visit-add-edit.component.css'
})
export class MedicalVisitAddEditComponent implements OnInit, OnChanges {
  @Input() recordId: string | null = null;
  @Input() embedded: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<MedicalVisitRecord>();

  citizen = signal<CitizenReadCardData | null>({
    id: 'CIT-771102',
    iin: '800101300123',
    fullName: 'Иванов Петр Павлович',
    birthDate: '01.01.1980',
    status: 'ACTIVE'
  });

  record: MedicalVisitRecord = {
    id: 'v-101',
    patientFullName: 'Иванов Петр Павлович',
    visitDate: '2026-01-24',
    doctor: 'Сидорова А.В.',
    diagnosis: 'ОРВИ',
    notes: 'Рекомендовано обильное питье',
    status: 'FINAL'
  };

  statusOptions: SelectOption[] = [
    { value: 'DRAFT', label: 'Черновик' },
    { value: 'FINAL', label: 'Закрыто' }
  ];

  status = signal<'SAVED' | 'UPDATED' | null>(null);
  lastActionAt = signal<string | null>(null);

  private recordById: Record<string, MedicalVisitRecord> = {
    'v-101': {
      id: 'v-101',
      patientFullName: 'Иванов Петр Павлович',
      visitDate: '2026-01-24',
      doctor: 'Сидорова А.В.',
      diagnosis: 'ОРВИ',
      notes: 'Рекомендовано обильное питье',
      status: 'FINAL'
    },
    'v-097': {
      id: 'v-097',
      patientFullName: 'Иванов Петр Павлович',
      visitDate: '2026-01-12',
      doctor: 'Рахимова Н.С.',
      diagnosis: 'Жалобы на боли',
      notes: 'Назначено обследование',
      status: 'DRAFT'
    }
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = this.recordId || this.route.snapshot.paramMap.get('id');
    this.loadRecord(id);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recordId']) {
      this.loadRecord(this.recordId);
    }
  }

  save(): void {
    this.status.set('SAVED');
    this.lastActionAt.set(this.getNowLabel());
    this.saved.emit({ ...this.record });
  }

  update(): void {
    this.status.set('UPDATED');
    this.lastActionAt.set(this.getNowLabel());
    this.saved.emit({ ...this.record });
  }

  goBack(): void {
    if (this.embedded) {
      this.closed.emit();
      return;
    }
    this.router.navigate(['/clinic/records']);
  }

  private loadRecord(id: string | null): void {
    if (id && this.recordById[id]) {
      this.record = { ...this.recordById[id] };
      return;
    }
    this.record = {
      id: 'new',
      patientFullName: this.citizen()?.fullName || '',
      visitDate: '',
      doctor: '',
      diagnosis: '',
      notes: '',
      status: 'DRAFT'
    };
  }

  private getNowLabel(): string {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }
}


