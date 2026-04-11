import { Component, OnInit, OnChanges, SimpleChanges, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, InputComponent, SelectComponent, SelectOption, ButtonComponent } from '../../../shared/components';
import { type CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';
import { LocalPersonWorkflowService } from '../../../services/local-person-workflow.service';
type StudyStatus = 'ENROLLED' | 'EXPELLED';
type StudyForm = 'FULL_TIME' | 'PART_TIME';

interface UniversityStudyRecord {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  iin: string;
  eventType: 'ENROLLMENT' | 'EXPULSION';
  expulsionReason: string;
  universityName: string;
  faculty: string;
  course: string;
  form: StudyForm;
  status: StudyStatus;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-university-study-create-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './university-study-create-edit.component.html',
  styleUrl: './university-study-create-edit.component.css'
})
export class UniversityStudyCreateEditComponent implements OnInit, OnChanges {
  @Input() recordId: string | null = null;
  @Input() embedded: boolean = false;
  @Output() closed = new EventEmitter<void>();

  citizen = signal<CitizenReadCardData | null>({
    id: 'CIT-771102',
    iin: '800101300123',
    fullName: 'Иванов Петр Павлович',
    birthDate: '01.01.1980',
    status: 'ACTIVE'
  });

  record: UniversityStudyRecord = {
    id: 'uni-201',
    lastName: 'Иванов',
    firstName: 'Петр',
    middleName: 'Павлович',
    iin: '800101300123',
    eventType: 'ENROLLMENT',
    expulsionReason: '',
    universityName: 'КазНУ им. аль-Фараби',
    faculty: 'Информатика',
    course: '2',
    form: 'FULL_TIME',
    status: 'ENROLLED',
    startDate: '2024-09-01',
    endDate: ''
  };

  statusOptions: SelectOption[] = [
    { value: 'ENROLLED', label: 'Поступил' },
    { value: 'EXPELLED', label: 'Отчислен' }
  ];

  eventTypeOptions: SelectOption[] = [
    { value: 'ENROLLMENT', label: 'Поступление' },
    { value: 'EXPULSION', label: 'Отчисление' }
  ];

  formOptions: SelectOption[] = [
    { value: 'FULL_TIME', label: 'Очная форма' },
    { value: 'PART_TIME', label: 'Заочная форма' }
  ];

  status = signal<'SAVED' | 'UPDATED' | null>(null);
  lastActionAt = signal<string | null>(null);

  private recordById: Record<string, UniversityStudyRecord> = {
    'uni-201': {
      id: 'uni-201',
      lastName: 'Иванов',
      firstName: 'Петр',
      middleName: 'Павлович',
      iin: '800101300123',
      eventType: 'ENROLLMENT',
      expulsionReason: '',
      universityName: 'КазНУ им. аль-Фараби',
      faculty: 'Информатика',
      course: '2',
      form: 'FULL_TIME',
      status: 'ENROLLED',
      startDate: '2024-09-01',
      endDate: ''
    },
    'uni-198': {
      id: 'uni-198',
      lastName: 'Соколов',
      firstName: 'Егор',
      middleName: 'Андреевич',
      iin: '030713300942',
      eventType: 'EXPULSION',
      expulsionReason: 'Академическая неуспеваемость',
      universityName: 'КазНУ им. аль-Фараби',
      faculty: 'Экономика',
      course: '4',
      form: 'FULL_TIME',
      status: 'EXPELLED',
      startDate: '2021-09-01',
      endDate: '2026-01-15'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly workflowService: LocalPersonWorkflowService,
  ) {}

  ngOnInit(): void {
    const id = this.recordId || this.route.snapshot.paramMap.get('id');
    this.loadRecord(id);
    this.applyCitizenStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recordId']) {
      this.loadRecord(this.recordId);
      this.applyCitizenStatus();
    }
  }

  save(): void {
    this.status.set('SAVED');
    this.lastActionAt.set(this.getNowLabel());
    this.applyCitizenStatus();
    this.applyWorkflowStatus();
  }

  update(): void {
    this.status.set('UPDATED');
    this.lastActionAt.set(this.getNowLabel());
    this.applyCitizenStatus();
    this.applyWorkflowStatus();
  }

  goBack(): void {
    if (this.embedded) {
      this.closed.emit();
      return;
    }
    this.router.navigate(['/university/studies']);
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
      iin: '',
      eventType: 'ENROLLMENT',
      expulsionReason: '',
      universityName: '',
      faculty: '',
      course: '',
      form: 'FULL_TIME',
      status: 'ENROLLED',
      startDate: '',
      endDate: ''
    };
  }

  private applyCitizenStatus(): void {
    const current = this.record;
    if (!this.citizen()) return;

    if (current.status === 'ENROLLED' && current.form === 'FULL_TIME') {
      this.citizen.set({
        ...this.citizen()!,
        status: 'STUDENT_DEFERRED'
      });
      return;
    }

    if (current.status === 'EXPELLED') {
      this.citizen.set({
        ...this.citizen()!,
        status: 'ACTIVE'
      });
    }
  }

  private getNowLabel(): string {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }

  private applyWorkflowStatus(): void {
    const fullName = [this.record.lastName, this.record.firstName, this.record.middleName]
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .join(' ');

    if (!fullName) {
      return;
    }

    this.workflowService.applyUniversityStatus(fullName, this.record.status, this.record.form);
  }
}


