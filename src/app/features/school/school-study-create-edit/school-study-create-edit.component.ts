import { Component, OnInit, OnChanges, SimpleChanges, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, InputComponent, SelectComponent, SelectOption, ButtonComponent } from '../../../shared/components';
import { type CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';
interface SchoolStudyRecord {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  startDate: string;
  endDate: string | null;
  classLevel: string;
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  schoolName: string;
}

@Component({
  selector: 'app-school-study-create-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './school-study-create-edit.component.html',
  styleUrl: './school-study-create-edit.component.css'
})
export class SchoolStudyCreateEditComponent implements OnInit, OnChanges {
  @Input() recordId: string | null = null;
  @Input() embedded: boolean = false;
  @Output() closed = new EventEmitter<void>();

  citizen = signal<CitizenReadCardData | null>({
    id: 'CIT-441120',
    iin: '120501400555',
    fullName: 'Смирнов Алексей Игоревич',
    birthDate: '05.05.2012',
    status: 'SCHOOL'
  });

  record: SchoolStudyRecord = {
    id: 'sch-101',
    lastName: 'Смирнов',
    firstName: 'Алексей',
    middleName: 'Игоревич',
    startDate: '2022-09-01',
    endDate: '',
    classLevel: '7Б',
    status: 'ACTIVE',
    schoolName: 'Школа №21, г. Алматы'
  };

  statusOptions: SelectOption[] = [
    { value: 'ACTIVE', label: 'Обучается' },
    { value: 'GRADUATED', label: 'Выпуск' },
    { value: 'TRANSFERRED', label: 'Переведен' }
  ];

  status = signal<'SAVED' | 'UPDATED' | null>(null);
  lastActionAt = signal<string | null>(null);

  private recordById: Record<string, SchoolStudyRecord> = {
    'sch-101': {
      id: 'sch-101',
      lastName: 'Смирнов',
      firstName: 'Алексей',
      middleName: 'Игоревич',
      startDate: '2022-09-01',
      endDate: '',
      classLevel: '7Б',
      status: 'ACTIVE',
      schoolName: 'Школа №21, г. Алматы'
    },
    'sch-098': {
      id: 'sch-098',
      lastName: 'Полякова',
      firstName: 'Мария',
      middleName: 'Денисовна',
      startDate: '2014-09-01',
      endDate: '2024-05-25',
      classLevel: '11А',
      status: 'GRADUATED',
      schoolName: 'Школа №18, г. Алматы'
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
  }

  update(): void {
    this.status.set('UPDATED');
    this.lastActionAt.set(this.getNowLabel());
  }

  goBack(): void {
    if (this.embedded) {
      this.closed.emit();
      return;
    }
    this.router.navigate(['/school/studies']);
  }

  private loadRecord(id: string | null): void {
    if (id && this.recordById[id]) {
      this.record = { ...this.recordById[id] };
      return;
    }
    this.record = {
      id: 'new',
      lastName: '',
      firstName: '',
      middleName: '',
      startDate: '',
      endDate: '',
      classLevel: '',
      status: 'ACTIVE',
      schoolName: ''
    };
  }

  private getNowLabel(): string {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }
}


