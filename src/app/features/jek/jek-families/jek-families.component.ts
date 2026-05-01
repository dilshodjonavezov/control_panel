import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { timeout, TimeoutError } from 'rxjs';
import { AddressesService, ApiFamily } from '../../../services/addresses.service';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  SelectComponent,
  SelectOption,
  TableComponent,
  TableColumn,
} from '../../../shared/components';

interface FamilyRow {
  id: number;
  familyName: string;
  father: string;
  mother: string;
  childrenCount: number;
  sonsCount: number;
  daughtersCount: number;
  militaryChildrenCount: number;
  exemptionStatus: string;
  childrenSummary: string;
  status: string;
}

@Component({
  selector: 'app-jek-families',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    InputComponent,
    SelectComponent,
    TableComponent,
    ButtonComponent,
  ],
  templateUrl: './jek-families.component.html',
  styleUrl: './jek-families.component.css',
})
export class JekFamiliesComponent implements OnInit {
  filters = {
    search: '',
    exemption: 'all',
  };

  exemptionOptions: SelectOption[] = [
    { value: 'all', label: 'Все семьи' },
    { value: 'eligible', label: 'Есть освобождение' },
    { value: 'regular', label: 'Без освобождения' },
  ];

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'familyName', label: 'Семья', sortable: true },
    { key: 'father', label: 'Отец', sortable: true },
    { key: 'mother', label: 'Мать', sortable: true },
    { key: 'childrenCount', label: 'Детей', sortable: true },
    { key: 'sonsCount', label: 'Сыновей', sortable: true },
    { key: 'daughtersCount', label: 'Дочерей', sortable: true },
    { key: 'militaryChildrenCount', label: 'В военкомате', sortable: true },
    { key: 'exemptionStatus', label: 'Льгота отцу', sortable: true },
    { key: 'childrenSummary', label: 'Дети', sortable: false },
  ];

  rows: FamilyRow[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly addressesService: AddressesService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadFamilies();
    this.route.queryParamMap.subscribe((params) => {
      const action = params.get('action');
      if (!action) {
        return;
      }
      this.filters = {
        search: '',
        exemption: action === 'father-exemptions' ? 'eligible' : 'all',
      };
    });
  }

  get filteredRows(): FamilyRow[] {
    const search = this.filters.search.trim().toLowerCase();
    const exemption = this.filters.exemption;

    return this.rows.filter((row) => {
      const matchesSearch =
        !search ||
        row.familyName.toLowerCase().includes(search) ||
        row.father.toLowerCase().includes(search) ||
        row.mother.toLowerCase().includes(search) ||
        row.childrenSummary.toLowerCase().includes(search);
      const matchesExemption =
        exemption === 'all' ||
        (exemption === 'eligible' && row.exemptionStatus === 'Освобождение') ||
        (exemption === 'regular' && row.exemptionStatus === 'Обычный учет');

      return matchesSearch && matchesExemption;
    });
  }

  loadFamilies(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.addressesService
      .getFamilies()
      .pipe(timeout(15000))
      .subscribe({
        next: (families) => {
          this.rows = families.map((family) => this.mapFamily(family));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.rows = [];
          this.errorMessage =
            error instanceof TimeoutError
              ? 'Превышено время ожидания ответа API.'
              : 'Не удалось загрузить семейный реестр.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private mapFamily(family: ApiFamily): FamilyRow {
    const childrenSummary =
      family.children?.length
        ? family.children
            .map((child) => {
              const marker = child.militaryRegisteredAtBirth ? ' [военкомат]' : '';
              return `${child.fullName ?? `ID ${child.id}`}${marker}`;
            })
            .join(', ')
        : '—';

    return {
      id: family.id,
      familyName: family.familyName?.trim() || `Семья #${family.id}`,
      father: family.fatherFullName?.trim() || '—',
      mother: family.motherFullName?.trim() || '—',
      childrenCount: family.childrenCount ?? family.childCitizenIds?.length ?? 0,
      sonsCount: family.sonsCount ?? 0,
      daughtersCount: family.daughtersCount ?? 0,
      militaryChildrenCount:
        family.militaryRegisteredChildrenCount ?? family.militaryRegisteredChildCitizenIds?.length ?? 0,
      exemptionStatus: family.eligibleFatherForMilitaryExemption ? 'Освобождение' : 'Обычный учет',
      childrenSummary,
      status: family.status,
    };
  }
}
