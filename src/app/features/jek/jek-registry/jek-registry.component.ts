import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, CardComponent, InputComponent, ModalComponent, SelectComponent, SelectOption, TableComponent, TableColumn } from '../../../shared/components';

type ResidenceStatus = 'registered' | 'temporary' | 'removed';
type UtilityDebt = 'all' | 'no_debt' | 'has_debt';

interface JekResident {
  residentId: string;
  fullName: string;
  iin: string;
  district: string;
  address: string;
  registrationType: 'Постоянная' | 'Временная';
  registeredAt: string;
  debtAmount: number;
  status: ResidenceStatus;
}

interface JekFilters {
  fullName: string;
  district: string;
  address: string;
  debt: UtilityDebt;
  status: 'all' | ResidenceStatus;
}

@Component({
  selector: 'app-jek-registry',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, TableComponent, ButtonComponent, ModalComponent],
  templateUrl: './jek-registry.component.html',
  styleUrl: './jek-registry.component.css'
})
export class JekRegistryComponent {
  showCreateModal = false;

  draftFilters: JekFilters = {
    fullName: '',
    district: '',
    address: '',
    debt: 'all',
    status: 'all'
  };

  appliedFilters: JekFilters = { ...this.draftFilters };

  createForm = {
    fullName: '',
    iin: '',
    district: '',
    address: '',
    registrationType: 'Постоянная' as JekResident['registrationType'],
    debtAmount: '',
    status: 'registered' as ResidenceStatus
  };

  districtOptions: SelectOption[] = [
    { value: '', label: 'Все районы' },
    { value: 'Центральный', label: 'Центральный' },
    { value: 'Северный', label: 'Северный' },
    { value: 'Южный', label: 'Южный' }
  ];

  debtOptions: SelectOption[] = [
    { value: 'all', label: 'Любая задолженность' },
    { value: 'no_debt', label: 'Без долга' },
    { value: 'has_debt', label: 'Есть долг' }
  ];

  statusOptions: SelectOption[] = [
    { value: 'all', label: 'Все статусы' },
    { value: 'registered', label: 'Зарегистрирован' },
    { value: 'temporary', label: 'Временная регистрация' },
    { value: 'removed', label: 'Снят с регистрации' }
  ];

  registrationTypeOptions: SelectOption[] = [
    { value: 'Постоянная', label: 'Постоянная' },
    { value: 'Временная', label: 'Временная' }
  ];

  statusCreateOptions: SelectOption[] = [
    { value: 'registered', label: 'Зарегистрирован' },
    { value: 'temporary', label: 'Временная регистрация' },
    { value: 'removed', label: 'Снят с регистрации' }
  ];

  columns: TableColumn[] = [
    { key: 'residentId', label: 'Resident ID', sortable: true },
    { key: 'fullName', label: 'ФИО', sortable: true },
    { key: 'iin', label: 'ИИН', sortable: true },
    { key: 'district', label: 'Район', sortable: true },
    { key: 'address', label: 'Адрес', sortable: true },
    { key: 'registrationType', label: 'Регистрация', sortable: true },
    { key: 'registeredAt', label: 'Дата учета', sortable: true },
    { key: 'debtAmount', label: 'Долг (тг)', sortable: true },
    { key: 'status', label: 'Статус', sortable: true }
  ];

  residents: JekResident[] = [
    {
      residentId: 'RES-10021',
      fullName: 'Иванов Артем Сергеевич',
      iin: '990201300121',
      district: 'Центральный',
      address: 'ул. Абая 15, кв. 8',
      registrationType: 'Постоянная',
      registeredAt: '2022-08-14',
      debtAmount: 0,
      status: 'registered'
    },
    {
      residentId: 'RES-10022',
      fullName: 'Садыкова Ляззат Ермековна',
      iin: '021125400987',
      district: 'Северный',
      address: 'мкр. Самал 2, д. 44',
      registrationType: 'Временная',
      registeredAt: '2025-04-03',
      debtAmount: 18640,
      status: 'temporary'
    },
    {
      residentId: 'RES-10023',
      fullName: 'Пак Дмитрий Валерьевич',
      iin: '960617301112',
      district: 'Южный',
      address: 'пр. Республики 73, кв. 102',
      registrationType: 'Постоянная',
      registeredAt: '2020-11-29',
      debtAmount: 0,
      status: 'removed'
    }
  ];

  get filteredResidents(): JekResident[] {
    const byName = this.appliedFilters.fullName.trim().toLowerCase();
    const byAddress = this.appliedFilters.address.trim().toLowerCase();

    return this.residents.filter((resident) => {
      if (byName && !resident.fullName.toLowerCase().includes(byName)) return false;
      if (this.appliedFilters.district && resident.district !== this.appliedFilters.district) return false;
      if (byAddress && !resident.address.toLowerCase().includes(byAddress)) return false;
      if (this.appliedFilters.status !== 'all' && resident.status !== this.appliedFilters.status) return false;
      if (this.appliedFilters.debt === 'no_debt' && resident.debtAmount > 0) return false;
      if (this.appliedFilters.debt === 'has_debt' && resident.debtAmount === 0) return false;
      return true;
    });
  }

  applyFilters(): void {
    this.appliedFilters = { ...this.draftFilters };
  }

  resetFilters(): void {
    this.draftFilters = {
      fullName: '',
      district: '',
      address: '',
      debt: 'all',
      status: 'all'
    };
    this.applyFilters();
  }

  openCreate(): void {
    this.showCreateModal = true;
    this.createForm = {
      fullName: '',
      iin: '',
      district: '',
      address: '',
      registrationType: 'Постоянная',
      debtAmount: '',
      status: 'registered'
    };
  }

  closeCreate(): void {
    this.showCreateModal = false;
  }

  saveResident(): void {
    if (!this.createForm.fullName.trim() || !this.createForm.iin.trim() || !this.createForm.address.trim()) {
      return;
    }

    const nextId = `RES-${10000 + this.residents.length + 1}`;
    const debtAmount = Number(this.createForm.debtAmount || 0);

    this.residents = [
      {
        residentId: nextId,
        fullName: this.createForm.fullName.trim(),
        iin: this.createForm.iin.trim(),
        district: this.createForm.district || 'Центральный',
        address: this.createForm.address.trim(),
        registrationType: this.createForm.registrationType,
        registeredAt: new Date().toISOString().slice(0, 10),
        debtAmount: Number.isFinite(debtAmount) ? debtAmount : 0,
        status: this.createForm.status
      },
      ...this.residents
    ];

    this.closeCreate();
  }

  getStatusLabel(status: ResidenceStatus): string {
    const labels: Record<ResidenceStatus, string> = {
      registered: 'Зарегистрирован',
      temporary: 'Временная регистрация',
      removed: 'Снят с регистрации'
    };
    return labels[status];
  }
}
