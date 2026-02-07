import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CitizenService } from '../../../services/citizen.service';
import { Citizen, CitizenStatus, FitnessCategory } from '../../../models';
import { TableComponent, TableColumn, ButtonComponent, InputComponent, CardComponent, ModalComponent, SelectComponent, SelectOption } from '../../../shared/components';

@Component({
  selector: 'app-citizens',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    ButtonComponent,
    InputComponent,
    CardComponent,
    ModalComponent,
    SelectComponent
  ],
  templateUrl: './citizens.component.html',
  styleUrl: './citizens.component.css'
})
export class CitizensComponent implements OnInit {
  citizens = signal<Citizen[]>([]);
  filteredCitizens = signal<Citizen[]>([]);
  searchQuery = signal('');
  territoryQuery = signal('');
  selectedStatus = signal<CitizenStatus | 'all'>(CitizenStatus.CONSCRIPT);
  selectedBirthYear = signal<string>('all');
  selectedFitness = signal<FitnessCategory | 'all'>('all');
  selectedDeferment = signal<'all' | 'with' | 'without'>('all');
  showAddModal = signal(false);
  editingCitizen = signal<Citizen | null>(null);

  formData: {
    firstName: string;
    lastName: string;
    middleName: string;
    birthDate: string;
    status: CitizenStatus;
    fitnessCategory: FitnessCategory | '';
    registrationAddress: string;
    actualAddress: string;
    phoneNumber: string;
    email: string;
  } = {
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: '',
    status: CitizenStatus.CONSCRIPT,
    fitnessCategory: '',
    registrationAddress: '',
    actualAddress: '',
    phoneNumber: '',
    email: ''
  };

  columns: TableColumn[] = [
    { key: 'lastName', label: 'Фамилия', sortable: true },
    { key: 'firstName', label: 'Имя', sortable: true },
    { key: 'middleName', label: 'Отчество', sortable: true },
    { key: 'birthDate', label: 'Дата рождения', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'fitnessCategory', label: 'Категория годности', sortable: true },
    { key: 'registrationAddress', label: 'Адрес регистрации', sortable: false }
  ];

  statusOptions: SelectOption[] = [
    { value: 'all', label: 'Все статусы' },
    { value: CitizenStatus.PRE_CONSCRIPT, label: 'Допризывник' },
    { value: CitizenStatus.CONSCRIPT, label: 'Призывник' },
    { value: CitizenStatus.STUDENT, label: 'Студент' },
    { value: CitizenStatus.FAMILY_CIRCUMSTANCES, label: 'Семейные обстоятельства' },
    { value: CitizenStatus.UNFIT_HEALTH, label: 'Не годен по здоровью' },
    { value: CitizenStatus.ABROAD, label: 'За границей' },
    { value: CitizenStatus.IN_SERVICE, label: 'На службе' },
    { value: CitizenStatus.DEMOBILIZED, label: 'Демобель' }
  ];

  fitnessCategoryFilterOptions: SelectOption[] = [
    { value: 'all', label: 'Все категории годности' },
    { value: FitnessCategory.FIT, label: 'Годен' },
    { value: FitnessCategory.FIT_WITH_LIMITATIONS, label: 'Годен с ограничениями' },
    { value: FitnessCategory.TEMP_UNFIT, label: 'Временно не годен' },
    { value: FitnessCategory.UNFIT, label: 'Не годен' }
  ];

  fitnessCategoryFormOptions: SelectOption[] = [
    { value: FitnessCategory.FIT, label: 'Годен' },
    { value: FitnessCategory.FIT_WITH_LIMITATIONS, label: 'Годен с ограничениями' },
    { value: FitnessCategory.TEMP_UNFIT, label: 'Временно не годен' },
    { value: FitnessCategory.UNFIT, label: 'Не годен' }
  ];

  defermentOptions: SelectOption[] = [
    { value: 'all', label: 'Все отсрочки' },
    { value: 'with', label: 'Есть отсрочка' },
    { value: 'without', label: 'Нет отсрочки' }
  ];

  statusLabels: Record<CitizenStatus, string> = {
    [CitizenStatus.PRE_CONSCRIPT]: 'Допризывник',
    [CitizenStatus.CONSCRIPT]: 'Призывник',
    [CitizenStatus.STUDENT]: 'Студент',
    [CitizenStatus.FAMILY_CIRCUMSTANCES]: 'Семейные обстоятельства',
    [CitizenStatus.UNFIT_HEALTH]: 'Не годен по здоровью',
    [CitizenStatus.ABROAD]: 'За границей',
    [CitizenStatus.IN_SERVICE]: 'На службе',
    [CitizenStatus.DEMOBILIZED]: 'Демобель'
  };

  fitnessCategoryLabels: Record<FitnessCategory, string> = {
    [FitnessCategory.FIT]: 'Годен',
    [FitnessCategory.FIT_WITH_LIMITATIONS]: 'Годен с ограничениями',
    [FitnessCategory.TEMP_UNFIT]: 'Временно не годен',
    [FitnessCategory.UNFIT]: 'Не годен'
  };

  constructor(
    private citizenService: CitizenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCitizens();
  }

  loadCitizens(): void {
    this.citizens.set(this.citizenService.getCitizens()());
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.citizens()];

    filtered = filtered.filter(c => c.status === CitizenStatus.CONSCRIPT);

    if (this.selectedBirthYear() !== 'all') {
      const year = Number(this.selectedBirthYear());
      filtered = filtered.filter(c => new Date(c.birthDate).getFullYear() === year);
    }

    const territory = this.territoryQuery().toLowerCase();
    if (territory) {
      filtered = filtered.filter(c =>
        c.registrationAddress.toLowerCase().includes(territory) ||
        c.actualAddress?.toLowerCase().includes(territory)
      );
    }

    if (this.selectedFitness() !== 'all') {
      filtered = filtered.filter(c => c.fitnessCategory === this.selectedFitness());
    }

    if (this.selectedDeferment() !== 'all') {
      filtered = filtered.filter(c =>
        this.selectedDeferment() === 'with'
          ? this.citizenService.hasActiveDeferment(c.id)
          : !this.citizenService.hasActiveDeferment(c.id)
      );
    }

    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(c =>
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        c.middleName?.toLowerCase().includes(query) ||
        c.registrationAddress.toLowerCase().includes(query)
      );
    }

    this.filteredCitizens.set(filtered);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onBirthYearSelect(value: string): void {
    this.selectedBirthYear.set(value);
    this.applyFilters();
  }

  onFitnessSelect(value: FitnessCategory | 'all'): void {
    this.selectedFitness.set(value);
    this.applyFilters();
  }

  onDefermentSelect(value: 'all' | 'with' | 'without'): void {
    this.selectedDeferment.set(value);
    this.applyFilters();
  }

  onTerritoryChange(): void {
    this.applyFilters();
  }

  onStatusSelect(value: string | CitizenStatus): void {
    this.selectedStatus.set(value as CitizenStatus | 'all');
    this.onStatusChange();
  }

  openAddModal(): void {
    this.editingCitizen.set(null);
    this.formData = {
      firstName: '',
      lastName: '',
      middleName: '',
      birthDate: '',
      status: CitizenStatus.CONSCRIPT,
      fitnessCategory: '',
      registrationAddress: '',
      actualAddress: '',
      phoneNumber: '',
      email: ''
    };
    this.showAddModal.set(true);
  }

  openEditModal(citizen: Citizen): void {
    this.editingCitizen.set(citizen);
    this.formData = {
      firstName: citizen.firstName,
      lastName: citizen.lastName,
      middleName: citizen.middleName || '',
      birthDate: citizen.birthDate ? new Date(citizen.birthDate).toISOString().split('T')[0] : '',
      status: citizen.status,
      fitnessCategory: citizen.fitnessCategory || '',
      registrationAddress: citizen.registrationAddress,
      actualAddress: citizen.actualAddress || '',
      phoneNumber: citizen.phoneNumber || '',
      email: citizen.email || ''
    };
    this.showAddModal.set(true);
  }

  closeModal(): void {
    this.showAddModal.set(false);
    this.editingCitizen.set(null);
  }

  saveCitizen(): void {
    const data = this.formData;
    const citizenData = {
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName || undefined,
      birthDate: new Date(data.birthDate),
      status: data.status,
      fitnessCategory: data.fitnessCategory || undefined,
      registrationAddress: data.registrationAddress,
      actualAddress: data.actualAddress || undefined,
      phoneNumber: data.phoneNumber || undefined,
      email: data.email || undefined
    };

    if (this.editingCitizen()) {
      this.citizenService.updateCitizen(this.editingCitizen()!.id, citizenData);
    } else {
      this.citizenService.createCitizen(citizenData);
    }

    this.loadCitizens();
    this.closeModal();
  }

  deleteCitizen(citizen: Citizen): void {
    if (confirm(`Вы уверены, что хотите удалить гражданина ${citizen.lastName} ${citizen.firstName}?`)) {
      this.citizenService.deleteCitizen(citizen.id);
      this.loadCitizens();
    }
  }

  viewDetails(citizen: Citizen): void {
    this.router.navigate(['/admin/citizens', citizen.id]);
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ru-RU');
  }

  getStatusLabel(status: CitizenStatus): string {
    return this.statusLabels[status] || status;
  }

  getFitnessLabel(category?: FitnessCategory): string {
    return category ? this.fitnessCategoryLabels[category] : 'Не указано';
  }

  getBirthYearOptions(): SelectOption[] {
    const years = Array.from(
      new Set(this.citizens().map(c => new Date(c.birthDate).getFullYear()))
    ).sort((a, b) => b - a);

    return [
      { value: 'all', label: 'Все года' },
      ...years.map(year => ({ value: String(year), label: String(year) }))
    ];
  }

  getStatusOptions(): SelectOption[] {
    return Object.entries(CitizenStatus).map(([key, value]) => ({
      value: value,
      label: this.statusLabels[value]
    }));
  }
}
