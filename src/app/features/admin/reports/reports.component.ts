import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, CardComponent, TableColumn, TableComponent } from '../../../shared/components';
import { VoenkomatCitizenRow, VoenkomatDataService } from '../../../services/voenkomat-data.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, CardComponent, TableComponent, ButtonComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  readonly citizens = signal<VoenkomatCitizenRow[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly columns: TableColumn[] = [
    { key: 'fullName', label: 'Гражданин', sortable: true },
    { key: 'birthDate', label: 'Дата рождения', sortable: true },
    { key: 'age', label: 'Возраст', sortable: true },
    { key: 'militaryStatus', label: 'Военный статус', sortable: true },
    { key: 'defermentBasis', label: 'Основание', sortable: false },
    { key: 'registrationAddress', label: 'Адрес', sortable: false }
  ];

  readonly draftList = computed(() =>
    this.citizens().filter((citizen) => citizen.voenkomatSection === 'Призывники'),
  );

  readonly familyExemptions = computed(() =>
    this.citizens().filter((citizen) => citizen.voenkomatSection === 'Освобождение по семье'),
  );

  readonly students = computed(() =>
    this.citizens().filter((citizen) => citizen.voenkomatSection === 'Учебная отсрочка'),
  );

  readonly unfit = computed(() =>
    this.citizens().filter((citizen) => citizen.voenkomatSection === 'Не годен'),
  );

  readonly otherMen = computed(() =>
    this.citizens().filter((citizen) => citizen.voenkomatSection === 'Остальные мужчины'),
  );

  constructor(private readonly voenkomatDataService: VoenkomatDataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.voenkomatDataService.getCitizens().subscribe({
      next: (citizens) => {
        this.citizens.set(citizens);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить отчеты военкомата.');
        this.isLoading.set(false);
      },
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ru-RU');
  }
}
