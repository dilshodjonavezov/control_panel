import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, InputComponent, SelectComponent, SelectOption, TableComponent, TableColumn } from '../../../shared/components';
import { VoenkomatCitizenRow, VoenkomatDataService } from '../../../services/voenkomat-data.service';

@Component({
  selector: 'app-citizens',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, InputComponent, CardComponent, SelectComponent],
  templateUrl: './citizens.component.html',
  styleUrl: './citizens.component.css',
})
export class CitizensComponent implements OnInit {
  readonly isConscriptsPage = signal(false);
  readonly citizens = signal<VoenkomatCitizenRow[]>([]);
  readonly filteredCitizens = signal<VoenkomatCitizenRow[]>([]);
  readonly searchQuery = signal('');
  readonly territoryQuery = signal('');
  readonly selectedStatus = signal('all');
  readonly selectedSection = signal('all');
  readonly selectedBirthYear = signal('all');
  readonly selectedFitness = signal('all');
  readonly selectedDeferment = signal('all');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly pageTitle = signal('Граждане');
  readonly pageDescription = signal('Полный реестр граждан с разделением по правилам военкомата.');

  columns: TableColumn[] = [
    { key: 'fullName', label: 'Гражданин', sortable: true },
    { key: 'voenkomatSection', label: 'Раздел учета', sortable: true },
    { key: 'birthDate', label: 'Дата рождения', sortable: true },
    { key: 'militaryStatus', label: 'Военный статус', sortable: true },
    { key: 'fitnessCategory', label: 'Годность', sortable: true },
    { key: 'studyPlace', label: 'Учеба', sortable: true },
    { key: 'defermentBasis', label: 'Основание', sortable: false },
    { key: 'registrationAddress', label: 'Адрес', sortable: false },
  ];

  constructor(
    private readonly voenkomatDataService: VoenkomatDataService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const mode = this.route.snapshot.data['mode'];
    if (mode === 'conscripts') {
      this.isConscriptsPage.set(true);
      this.selectedSection.set('Призывники');
      this.pageTitle.set('Призывники');
      this.pageDescription.set('Здесь показываются только призывники: мужчины от 18 до 27 лет.');
    }

    this.loadCitizens();
  }

  loadCitizens(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.voenkomatDataService.getCitizens().subscribe({
      next: (citizens) => {
        this.citizens.set(citizens);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить реестр военкомата.');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.citizens()];

    if (this.isConscriptsPage()) {
      filtered = filtered.filter((item) => item.voenkomatSection === 'Призывники');
    }

    if (!this.isConscriptsPage() && this.selectedSection() !== 'all') {
      filtered = filtered.filter((item) => item.voenkomatSection === this.selectedSection());
    }

    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter((item) => item.militaryStatus === this.selectedStatus());
    }

    if (this.selectedBirthYear() !== 'all') {
      filtered = filtered.filter((item) => new Date(item.birthDate).getFullYear() === Number(this.selectedBirthYear()));
    }

    if (this.selectedFitness() !== 'all') {
      filtered = filtered.filter((item) => item.fitnessCategory === this.selectedFitness());
    }

    if (this.selectedDeferment() === 'with') {
      filtered = filtered.filter((item) => item.defermentBasis !== 'Нет активного основания');
    }
    if (this.selectedDeferment() === 'without') {
      filtered = filtered.filter((item) => item.defermentBasis === 'Нет активного основания');
    }

    const territory = this.territoryQuery().toLowerCase();
    if (territory) {
      filtered = filtered.filter((item) => item.registrationAddress.toLowerCase().includes(territory));
    }

    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter((item) =>
        item.fullName.toLowerCase().includes(query) ||
        item.registrationAddress.toLowerCase().includes(query) ||
        item.studyPlace.toLowerCase().includes(query),
      );
    }

    this.filteredCitizens.set(filtered);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusSelect(value: string): void {
    this.selectedStatus.set(value);
    this.applyFilters();
  }

  onSectionSelect(value: string): void {
    this.selectedSection.set(value);
    this.applyFilters();
  }

  onBirthYearSelect(value: string): void {
    this.selectedBirthYear.set(value);
    this.applyFilters();
  }

  onFitnessSelect(value: string): void {
    this.selectedFitness.set(value);
    this.applyFilters();
  }

  onDefermentSelect(value: string): void {
    this.selectedDeferment.set(value);
    this.applyFilters();
  }

  onTerritoryChange(): void {
    this.applyFilters();
  }

  viewDetails(row: VoenkomatCitizenRow): void {
    this.router.navigate(['/voenkomat/citizens', row.id]);
  }

  getBirthYearOptions(): SelectOption[] {
    const years = Array.from(new Set(this.citizens().map((item) => new Date(item.birthDate).getFullYear()))).sort((a, b) => b - a);
    return [{ value: 'all', label: 'Все годы' }, ...years.map((year) => ({ value: String(year), label: String(year) }))];
  }

  getStatusOptions(): SelectOption[] {
    const statuses = Array.from(new Set(this.citizens().map((item) => item.militaryStatus))).sort((a, b) => a.localeCompare(b, 'ru'));
    return [{ value: 'all', label: 'Все статусы' }, ...statuses.map((status) => ({ value: status, label: status }))];
  }

  getSectionOptions(): SelectOption[] {
    const sections = Array.from(new Set(this.citizens().map((item) => item.voenkomatSection))).sort((a, b) => a.localeCompare(b, 'ru'));
    return [{ value: 'all', label: 'Все разделы' }, ...sections.map((section) => ({ value: section, label: section }))];
  }

  getFitnessOptions(): SelectOption[] {
    const values = Array.from(new Set(this.citizens().map((item) => item.fitnessCategory))).sort((a, b) => a.localeCompare(b, 'ru'));
    return [{ value: 'all', label: 'Все категории' }, ...values.map((value) => ({ value, label: value }))];
  }

  getDefermentOptions(): SelectOption[] {
    return [
      { value: 'all', label: 'Все основания' },
      { value: 'with', label: 'Есть основание' },
      { value: 'without', label: 'Нет основания' },
    ];
  }
}
