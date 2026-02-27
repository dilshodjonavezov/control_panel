import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, TableComponent, TableColumn, InputComponent, SelectComponent, SelectOption, ButtonComponent, ModalComponent } from '../../../shared/components';
import { IdentityCitizenService, PassportRecord, CitizenRecord, PassportStatus } from '../../../services/identity-citizen.service';

interface PassportRow {
  citizenId: string;
  iin: string;
  fullName: string;
  series: string;
  number: string;
  issuedBy: string;
  issueDate: string;
  expireDate: string;
  status: PassportStatus;
}

@Component({
  selector: 'app-passport-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, SelectComponent, ButtonComponent, ModalComponent],
  templateUrl: './passport-list.component.html',
  styleUrl: './passport-list.component.css'
})
export class PassportListComponent {
  filters = {
    iin: '',
    fullName: '',
    series: '',
    number: '',
    status: 'all'
  };

  showCreateModal = false;
  createForm = {
    citizenId: '',
    series: '',
    number: '',
    issuedBy: '',
    issueDate: '',
    expireDate: '',
    status: 'ACTIVE' as PassportStatus
  };

  citizenOptions = computed(() => {
    return this.citizenService.getCitizens()().map(c => ({
      value: c.id,
      label: `${c.lastName} ${c.firstName} ${c.middleName || ''}`.trim()
    }));
  });

  statusOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'ACTIVE', label: 'Действующий' },
    { value: 'EXPIRED', label: 'Истёк' },
    { value: 'ANNULLED', label: 'Аннулирован' }
  ];

  statusFormOptions: SelectOption[] = [
    { value: 'ACTIVE', label: 'Действующий' },
    { value: 'EXPIRED', label: 'Истёк' },
    { value: 'ANNULLED', label: 'Аннулирован' }
  ];

  columns: TableColumn[] = [
    { key: 'iin', label: 'ИИН', sortable: true },
    { key: 'fullName', label: 'ФИО', sortable: true },
    { key: 'series', label: 'Серия', sortable: true },
    { key: 'number', label: 'Номер', sortable: true },
    { key: 'issuedBy', label: 'Кем выдан', sortable: true },
    { key: 'issueDate', label: 'Дата выдачи', sortable: true },
    { key: 'expireDate', label: 'Дата окончания', sortable: true },
    { key: 'status', label: 'Статус', sortable: true }
  ];

  rows = computed(() => {
    const data = this.flattenPassports(this.citizenService.getCitizens()());
    const iin = this.filters.iin.trim().toLowerCase();
    const name = this.filters.fullName.trim().toLowerCase();
    const series = this.filters.series.trim().toLowerCase();
    const number = this.filters.number.trim().toLowerCase();

    return data.filter(row => {
      if (iin && !row.iin.toLowerCase().includes(iin)) return false;
      if (name && !row.fullName.toLowerCase().includes(name)) return false;
      if (series && !row.series.toLowerCase().includes(series)) return false;
      if (number && !row.number.toLowerCase().includes(number)) return false;
      if (this.filters.status !== 'all' && row.status !== this.filters.status) return false;
      return true;
    });
  });

  constructor(private citizenService: IdentityCitizenService) {}

  getStatusLabel(status: PassportStatus): string {
    const labels: Record<PassportStatus, string> = {
      ACTIVE: 'Действующий',
      EXPIRED: 'Истёк',
      ANNULLED: 'Аннулирован'
    };
    return labels[status];
  }

  openCreate(): void {
    this.showCreateModal = true;
    this.createForm = {
      citizenId: '',
      series: '',
      number: '',
      issuedBy: '',
      issueDate: '',
      expireDate: '',
      status: 'ACTIVE'
    };
  }

  closeCreate(): void {
    this.showCreateModal = false;
  }

  savePassport(): void {
    if (!this.createForm.citizenId || !this.createForm.series || !this.createForm.number) {
      return;
    }
    this.citizenService.addPassport(this.createForm.citizenId, {
      series: this.createForm.series,
      number: this.createForm.number,
      issuedBy: this.createForm.issuedBy,
      issueDate: this.createForm.issueDate,
      expireDate: this.createForm.expireDate,
      status: this.createForm.status
    });
    this.closeCreate();
  }

  private flattenPassports(citizens: CitizenRecord[]): PassportRow[] {
    const rows: PassportRow[] = [];
    citizens.forEach(c => {
      c.passports.forEach(passport => {
        rows.push({
          citizenId: c.id,
          iin: c.iin,
          fullName: `${c.lastName} ${c.firstName} ${c.middleName || ''}`.trim(),
          series: passport.series,
          number: passport.number,
          issuedBy: passport.issuedBy,
          issueDate: passport.issueDate,
          expireDate: passport.expireDate,
          status: passport.status
        });
      });
    });
    return rows;
  }
}
