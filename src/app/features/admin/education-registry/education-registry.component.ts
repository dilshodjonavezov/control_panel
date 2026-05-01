import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  ModalComponent,
  SelectComponent,
  SelectOption,
  TableColumn,
  TableComponent
} from '../../../shared/components';
import { VoenkomatDataService, VoenkomatEducationRow } from '../../../services/voenkomat-data.service';

type StudyStatusFilter = 'all' | 'Школьник' | 'Студент' | 'Выпускник' | 'Отчислен';

@Component({
  selector: 'app-education-registry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    TableComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    ModalComponent
  ],
  templateUrl: './education-registry.component.html',
  styleUrl: './education-registry.component.css'
})
export class EducationRegistryComponent implements OnInit {
  readonly rows = signal<VoenkomatEducationRow[]>([]);
  readonly filteredRows = signal<VoenkomatEducationRow[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  searchQuery = '';
  docQuery = '';
  statusFilter: StudyStatusFilter = 'all';
  institutionQuery = '';
  formFilter = 'all';
  startDate = '';
  endDate = '';

  selected: VoenkomatEducationRow | null = null;
  showCard = false;

  readonly columns: TableColumn[] = [
    { key: 'fullName', label: 'Гражданин', sortable: true },
    { key: 'documentId', label: 'Паспорт', sortable: true },
    { key: 'status', label: 'Статус учебы', sortable: true },
    { key: 'institution', label: 'Учреждение', sortable: true },
    { key: 'form', label: 'Форма', sortable: true },
    { key: 'startDate', label: 'Начало', sortable: true },
    { key: 'endDate', label: 'Окончание', sortable: true }
  ];

  constructor(
    private readonly voenkomatDataService: VoenkomatDataService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadRows();
  }

  loadRows(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.voenkomatDataService.getEducationRegistry().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить учебные связки военкомата.');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();
    const docQuery = this.docQuery.trim().toLowerCase();
    const institutionQuery = this.institutionQuery.trim().toLowerCase();

    const filtered = this.rows().filter((row) => {
      const matchesName = !query || row.fullName.toLowerCase().includes(query);
      const matchesDoc = !docQuery || row.documentId.toLowerCase().includes(docQuery);
      const matchesStatus = this.statusFilter === 'all' || row.status === this.statusFilter;
      const matchesInstitution = !institutionQuery || row.institution.toLowerCase().includes(institutionQuery);
      const matchesForm = this.formFilter === 'all' || row.form === this.formFilter;
      const matchesStart = !this.startDate || row.startDate >= this.startDate;
      const matchesEnd = !this.endDate || row.endDate === '-' || row.endDate <= this.endDate;
      return matchesName && matchesDoc && matchesStatus && matchesInstitution && matchesForm && matchesStart && matchesEnd;
    });

    this.filteredRows.set(filtered);
  }

  openCard(row: VoenkomatEducationRow): void {
    this.selected = row;
    this.showCard = true;
  }

  openCitizen(row: VoenkomatEducationRow): void {
    this.showCard = false;
    this.router.navigate(['/admin/citizens', row.citizenId]);
  }

  closeCard(): void {
    this.showCard = false;
    this.selected = null;
  }

  getStatusOptions(): SelectOption[] {
    return [
      { value: 'all', label: 'Все статусы' },
      { value: 'Школьник', label: 'Школьник' },
      { value: 'Студент', label: 'Студент' },
      { value: 'Выпускник', label: 'Выпускник' },
      { value: 'Отчислен', label: 'Отчислен' },
    ];
  }

  getFormOptions(): SelectOption[] {
    const forms = Array.from(new Set(this.rows().map((row) => row.form))).sort((a, b) => a.localeCompare(b, 'ru'));
    return [{ value: 'all', label: 'Все формы' }, ...forms.map((form) => ({ value: form, label: form }))];
  }
}
