import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, CardComponent, InputComponent, ModalComponent, SelectComponent, SelectOption, TableComponent, TableColumn } from '../../../shared/components';

type PassportState = 'active' | 'expired' | 'annulled' | 'draft';

interface PassportEntry {
  passportId: string;
  fullName: string;
  iin: string;
  series: string;
  number: string;
  issueDate: string;
  expireDate: string;
  issuedBy: string;
  biometric: 'Да' | 'Нет';
  status: PassportState;
}

interface PassportFilters {
  fullName: string;
  iin: string;
  series: string;
  status: 'all' | PassportState;
  biometric: 'all' | 'yes' | 'no';
}

@Component({
  selector: 'app-passport-registry',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, TableComponent, ButtonComponent, ModalComponent],
  templateUrl: './passport-registry.component.html',
  styleUrl: './passport-registry.component.css'
})
export class PassportRegistryComponent {
  showCreateModal = false;

  draftFilters: PassportFilters = {
    fullName: '',
    iin: '',
    series: '',
    status: 'all',
    biometric: 'all'
  };

  appliedFilters: PassportFilters = { ...this.draftFilters };

  createForm = {
    fullName: '',
    iin: '',
    series: '',
    number: '',
    issueDate: '',
    expireDate: '',
    issuedBy: '',
    biometric: 'Да' as PassportEntry['biometric'],
    status: 'draft' as PassportState
  };

  statusOptions: SelectOption[] = [
    { value: 'all', label: 'Все статусы' },
    { value: 'active', label: 'Действует' },
    { value: 'expired', label: 'Истек' },
    { value: 'annulled', label: 'Аннулирован' },
    { value: 'draft', label: 'Черновик' }
  ];

  biometricOptions: SelectOption[] = [
    { value: 'all', label: 'Биометрия: любая' },
    { value: 'yes', label: 'С биометрией' },
    { value: 'no', label: 'Без биометрии' }
  ];

  biometricCreateOptions: SelectOption[] = [
    { value: 'Да', label: 'Да' },
    { value: 'Нет', label: 'Нет' }
  ];

  statusCreateOptions: SelectOption[] = [
    { value: 'active', label: 'Действует' },
    { value: 'expired', label: 'Истек' },
    { value: 'annulled', label: 'Аннулирован' },
    { value: 'draft', label: 'Черновик' }
  ];

  columns: TableColumn[] = [
    { key: 'passportId', label: 'Passport ID', sortable: true },
    { key: 'fullName', label: 'ФИО', sortable: true },
    { key: 'iin', label: 'ИИН', sortable: true },
    { key: 'series', label: 'Серия', sortable: true },
    { key: 'number', label: 'Номер', sortable: true },
    { key: 'issueDate', label: 'Дата выдачи', sortable: true },
    { key: 'expireDate', label: 'Срок действия', sortable: true },
    { key: 'issuedBy', label: 'Кем выдан', sortable: true },
    { key: 'biometric', label: 'Биометрия', sortable: true },
    { key: 'status', label: 'Статус', sortable: true }
  ];

  entries: PassportEntry[] = [
    {
      passportId: 'PASS-88301',
      fullName: 'Кузнецова Марина Павловна',
      iin: '040511400555',
      series: 'N',
      number: '0844551',
      issueDate: '2024-02-10',
      expireDate: '2034-02-10',
      issuedBy: 'Отдел №1, г. Алматы',
      biometric: 'Да',
      status: 'active'
    },
    {
      passportId: 'PASS-88302',
      fullName: 'Сарсенов Тимур Айдынович',
      iin: '970918300887',
      series: 'M',
      number: '0019942',
      issueDate: '2014-06-01',
      expireDate: '2024-06-01',
      issuedBy: 'Отдел №3, г. Астана',
      biometric: 'Нет',
      status: 'expired'
    },
    {
      passportId: 'PASS-88303',
      fullName: 'Ахметов Руслан Берикович',
      iin: '011020300764',
      series: 'K',
      number: '4458102',
      issueDate: '2025-01-15',
      expireDate: '2035-01-15',
      issuedBy: 'Отдел №2, г. Шымкент',
      biometric: 'Да',
      status: 'draft'
    }
  ];

  get filteredEntries(): PassportEntry[] {
    const byName = this.appliedFilters.fullName.trim().toLowerCase();
    const byIin = this.appliedFilters.iin.trim().toLowerCase();
    const bySeries = this.appliedFilters.series.trim().toLowerCase();

    return this.entries.filter((entry) => {
      if (byName && !entry.fullName.toLowerCase().includes(byName)) return false;
      if (byIin && !entry.iin.toLowerCase().includes(byIin)) return false;
      if (bySeries && !entry.series.toLowerCase().includes(bySeries)) return false;
      if (this.appliedFilters.status !== 'all' && entry.status !== this.appliedFilters.status) return false;
      if (this.appliedFilters.biometric === 'yes' && entry.biometric !== 'Да') return false;
      if (this.appliedFilters.biometric === 'no' && entry.biometric !== 'Нет') return false;
      return true;
    });
  }

  applyFilters(): void {
    this.appliedFilters = { ...this.draftFilters };
  }

  resetFilters(): void {
    this.draftFilters = {
      fullName: '',
      iin: '',
      series: '',
      status: 'all',
      biometric: 'all'
    };
    this.applyFilters();
  }

  openCreate(): void {
    this.showCreateModal = true;
    this.createForm = {
      fullName: '',
      iin: '',
      series: '',
      number: '',
      issueDate: '',
      expireDate: '',
      issuedBy: '',
      biometric: 'Да',
      status: 'draft'
    };
  }

  closeCreate(): void {
    this.showCreateModal = false;
  }

  savePassport(): void {
    if (!this.createForm.fullName.trim() || !this.createForm.iin.trim() || !this.createForm.series.trim() || !this.createForm.number.trim()) {
      return;
    }

    const nextId = `PASS-${88300 + this.entries.length + 1}`;
    this.entries = [
      {
        passportId: nextId,
        fullName: this.createForm.fullName.trim(),
        iin: this.createForm.iin.trim(),
        series: this.createForm.series.trim(),
        number: this.createForm.number.trim(),
        issueDate: this.createForm.issueDate,
        expireDate: this.createForm.expireDate,
        issuedBy: this.createForm.issuedBy.trim(),
        biometric: this.createForm.biometric,
        status: this.createForm.status
      },
      ...this.entries
    ];

    this.closeCreate();
  }

  getStatusLabel(status: PassportState): string {
    const labels: Record<PassportState, string> = {
      active: 'Действует',
      expired: 'Истек',
      annulled: 'Аннулирован',
      draft: 'Черновик'
    };
    return labels[status];
  }
}
