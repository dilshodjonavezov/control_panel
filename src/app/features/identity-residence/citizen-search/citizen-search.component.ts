import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CardComponent,
  TableComponent,
  TableColumn,
  InputComponent,
  ButtonComponent,
  ModalComponent,
  SelectComponent,
  SelectOption
} from '../../../shared/components';
import {
  IdentityCitizenService,
  CitizenRecord,
  CitizenStatus,
  Gender
} from '../../../services/identity-citizen.service';

interface CitizenRow {
  id: string;
  iin: string;
  fullName: string;
  birthDate: string;
  status: CitizenStatus;
  hasPassport: boolean;
  hasAddress: boolean;
  hasMilOffice: boolean;
  updatedAt: string;
  updatedBy: string;
  gender: Gender;
  district?: string;
  createdAt: string;
}

@Component({
  selector: 'app-citizen-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    TableComponent,
    InputComponent,
    ButtonComponent,
    ModalComponent,
    SelectComponent
  ],
  templateUrl: './citizen-search.component.html',
  styleUrl: './citizen-search.component.css'
})
export class CitizenSearchComponent {
  showAdvanced = false;
  showCreateModal = false;
  showDeleteModal = false;
  deleteReason = '';
  deleteTargetIds: string[] = [];
  hardDelete = false;
  confirmHardDelete = false;
  canHardDelete = false;

  bulkAction: '' | 'status' | 'delete' | 'district' = '';
  bulkStatus: CitizenStatus | '' = '';
  bulkDistrict = '';

  pageSize = 10;
  pageSizes = [10, 25, 50, 100];
  pageSizeOptions: SelectOption[] = this.pageSizes.map(size => ({ value: size, label: size.toString() }));
  currentPage = 1;
  sortKey: keyof CitizenRow = 'updatedAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  selectedIds = new Set<string>();

  filters = {
    iin: '',
    fullName: '',
    birthDate: '',
    status: [] as CitizenStatus[],
    gender: 'all',
    district: '',
    hasPassport: 'all',
    hasAddress: 'all',
    hasMilOffice: 'all',
    createdFrom: '',
    createdTo: '',
    updatedFrom: '',
    updatedTo: ''
  };

  createForm = {
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: '',
    gender: 'male' as Gender,
    iin: '',
    status: 'ACTIVE' as CitizenStatus,
    citizenship: 'Казахстан',
    district: '',
    addDocuments: false,
    addPassport: false,
    addAddress: false,
    addMilOffice: false
  };

  formErrors = signal<string | null>(null);

  statusOptions: SelectOption[] = [
    { value: 'ACTIVE', label: 'Активный' },
    { value: 'REMOVED', label: 'Удалён' },
    { value: 'ARCHIVED', label: 'Архив' }
  ];

  genderOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'male', label: 'Мужской' },
    { value: 'female', label: 'Женский' }
  ];
  genderOptionsForm: SelectOption[] = [
    { value: 'male', label: 'Мужской' },
    { value: 'female', label: 'Женский' }
  ];

  yesNoOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'yes', label: 'Да' },
    { value: 'no', label: 'Нет' }
  ];

  bulkActionOptions: SelectOption[] = [
    { value: '', label: 'Массовые действия' },
    { value: 'status', label: 'Изменить статус' },
    { value: 'district', label: 'Назначить район/ЖЭК' },
    { value: 'delete', label: 'Удалить (soft)' }
  ];

  columns: TableColumn[] = [
    { key: 'select', label: '', sortable: false },
    { key: 'iin', label: 'ИИН', sortable: true },
    { key: 'fullName', label: 'ФИО', sortable: true },
    { key: 'birthDate', label: 'Дата рождения', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'passport', label: 'Паспорт', sortable: false },
    { key: 'address', label: 'Адрес', sortable: false },
    { key: 'mil', label: 'Военкомат', sortable: false },
    { key: 'updated', label: 'Обновлён', sortable: true }
  ];

  filteredRows = computed(() => {
    const data = this.citizensList.map(c => this.toRow(c));
    const name = this.filters.fullName.trim().toLowerCase();
    const iin = this.filters.iin.trim().toLowerCase();
    const district = this.filters.district.trim().toLowerCase();
    const status = this.filters.status;

    let filtered = data.filter(row => {
      if (iin && !row.iin.toLowerCase().includes(iin)) return false;
      if (name && !row.fullName.toLowerCase().includes(name)) return false;
      if (this.filters.birthDate && row.birthDate !== this.filters.birthDate) return false;
      if (status.length && !status.includes(row.status)) return false;
      if (this.filters.gender !== 'all' && row.gender !== this.filters.gender) return false;
      if (district && !(row.district || '').toLowerCase().includes(district)) return false;
      if (!this.matchesYesNo(this.filters.hasPassport, row.hasPassport)) return false;
      if (!this.matchesYesNo(this.filters.hasAddress, row.hasAddress)) return false;
      if (!this.matchesYesNo(this.filters.hasMilOffice, row.hasMilOffice)) return false;
      if (!this.matchesRange(this.filters.createdFrom, this.filters.createdTo, row.createdAt)) return false;
      if (!this.matchesRange(this.filters.updatedFrom, this.filters.updatedTo, row.updatedAt)) return false;
      return true;
    });

    filtered = this.sortRows(filtered);
    return filtered;
  });

  get pagedRows(): CitizenRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRows().slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize));
  }

  constructor(
    private citizenService: IdentityCitizenService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.hydrateFromQuery();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.updateQueryParams();
  }

  resetFilters(): void {
    this.filters = {
      iin: '',
      fullName: '',
      birthDate: '',
      status: [],
      gender: 'all',
      district: '',
      hasPassport: 'all',
      hasAddress: 'all',
      hasMilOffice: 'all',
      createdFrom: '',
      createdTo: '',
      updatedFrom: '',
      updatedTo: ''
    };
    this.currentPage = 1;
    this.updateQueryParams();
  }

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  onSortChanged(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.sortKey = event.key as keyof CitizenRow;
    this.sortDirection = event.direction;
  }

  toggleSelection(id: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
  }

  toggleAll(checked: boolean): void {
    if (!checked) {
      this.selectedIds.clear();
      return;
    }
    this.pagedRows.forEach(row => this.selectedIds.add(row.id));
  }

  onToggleAll(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.toggleAll(!!target?.checked);
  }

  onToggleRow(id: string, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.toggleSelection(id, !!target?.checked);
  }

  isStatusSelected(value: string | number): boolean {
    return this.filters.status.includes(value as CitizenStatus);
  }

  onStatusToggle(value: string | number, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const checked = !!target?.checked;
    const statusValue = value as CitizenStatus;
    if (checked) {
      this.filters.status = Array.from(new Set([...this.filters.status, statusValue]));
    } else {
      this.filters.status = this.filters.status.filter(s => s !== statusValue);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  openCreate(): void {
    this.showCreateModal = true;
    this.formErrors.set(null);
  }

  closeCreate(): void {
    this.showCreateModal = false;
  }

  saveCitizen(openDetail: boolean): void {
    this.formErrors.set(null);
    if (!this.createForm.lastName.trim() || !this.createForm.firstName.trim()) {
      this.formErrors.set('ФИО обязательно для заполнения.');
      return;
    }
    if (!this.createForm.iin.trim()) {
      this.formErrors.set('ИИН обязателен.');
      return;
    }
    if (this.createForm.birthDate && new Date(this.createForm.birthDate) > new Date()) {
      this.formErrors.set('Дата рождения не может быть в будущем.');
      return;
    }
    const exists = this.citizensList.some(c => c.iin === this.createForm.iin.trim());
    if (exists) {
      this.formErrors.set('ИИН уже существует.');
      return;
    }

    const citizen = this.citizenService.createCitizen({
      iin: this.createForm.iin.trim(),
      firstName: this.createForm.firstName.trim(),
      lastName: this.createForm.lastName.trim(),
      middleName: this.createForm.middleName.trim(),
      birthDate: this.createForm.birthDate,
      gender: this.createForm.gender,
      citizenship: this.createForm.citizenship,
      maritalStatus: '',
      phone: '',
      email: '',
      status: this.createForm.status,
      district: this.createForm.district,
      passports: [],
      addresses: [],
      milRecords: []
    });

    if (openDetail) {
      this.showCreateModal = false;
      this.router.navigate(['/identity-residence/citizens', citizen.id], { queryParams: { mode: 'edit' } });
      return;
    }

    this.resetCreateForm();
  }

  resetCreateForm(): void {
    this.createForm = {
      firstName: '',
      lastName: '',
      middleName: '',
      birthDate: '',
      gender: 'male',
      iin: '',
      status: 'ACTIVE',
      citizenship: 'Казахстан',
      district: '',
      addDocuments: false,
      addPassport: false,
      addAddress: false,
      addMilOffice: false
    };
    this.formErrors.set(null);
  }

  openDelete(ids: string[]): void {
    this.deleteTargetIds = ids;
    this.deleteReason = '';
    this.hardDelete = false;
    this.confirmHardDelete = false;
    this.showDeleteModal = true;
  }

  closeDelete(): void {
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.deleteReason.trim()) {
      return;
    }
    if (this.hardDelete && !this.confirmHardDelete) {
      return;
    }
    this.deleteTargetIds.forEach(id => this.citizenService.softDelete(id, this.deleteReason, this.hardDelete));
    this.selectedIds.clear();
    this.showDeleteModal = false;
  }

  applyBulkAction(): void {
    if (!this.selectedCount || !this.bulkAction) return;
    const ids = Array.from(this.selectedIds);

    if (this.bulkAction === 'status' && this.bulkStatus) {
      this.citizenService.changeStatus(ids, this.bulkStatus);
    }

    if (this.bulkAction === 'district' && this.bulkDistrict.trim()) {
      ids.forEach(id => this.citizenService.updateCitizen(id, { district: this.bulkDistrict.trim() }));
    }

    if (this.bulkAction === 'delete') {
      this.openDelete(ids);
      return;
    }

    this.selectedIds.clear();
  }

  openDetail(row: CitizenRow): void {
    this.router.navigate(['/identity-residence/citizens', row.id]);
  }

  editDetail(row: CitizenRow): void {
    this.router.navigate(['/identity-residence/citizens', row.id], { queryParams: { mode: 'edit' } });
  }

  handleRowAction(row: CitizenRow, action: string): void {
    if (!action) return;
    if (action === 'duplicate') {
      const source = this.citizensList.find(c => c.id === row.id);
      if (source) {
        this.citizenService.createCitizen({
          iin: `${source.iin}-DUP`,
          firstName: source.firstName,
          lastName: source.lastName,
          middleName: source.middleName || '',
          birthDate: source.birthDate,
          gender: source.gender,
          citizenship: source.citizenship,
          maritalStatus: source.maritalStatus,
          phone: source.phone,
          email: source.email,
          status: source.status,
          district: source.district,
          passports: [],
          addresses: [],
          milRecords: []
        });
      }
    }

    if (action === 'status') {
      this.citizenService.changeStatus([row.id], row.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE');
    }

    if (action === 'copy_id') {
      this.copyToClipboard(row.id);
    }

    if (action === 'copy_iin') {
      this.copyToClipboard(row.iin);
    }
  }

  handleRowActionChange(row: CitizenRow, value: string | number | null): void {
    if (typeof value !== 'string') return;
    this.handleRowAction(row, value);
  }

  importData(): void {
    // Placeholder for CSV/Excel import
  }

  exportData(): void {
    const rows = this.filteredRows();
    const header = ['ИИН', 'ФИО', 'Дата рождения', 'Статус', 'Паспорт', 'Адрес', 'Военкомат', 'Обновлён'];
    const lines = rows.map(row => [
      row.iin,
      row.fullName,
      this.formatDate(row.birthDate),
      this.getStatusLabel(row.status),
      row.hasPassport ? 'Да' : 'Нет',
      row.hasAddress ? 'Да' : 'Нет',
      row.hasMilOffice ? 'Да' : 'Нет',
      `${this.formatDate(row.updatedAt)} / ${row.updatedBy}`
    ].join(','));

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `citizens-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  trackById(_: number, row: CitizenRow): string {
    return row.id;
  }

  getStatusLabel(status: CitizenStatus): string {
    const labels: Record<CitizenStatus, string> = {
      ACTIVE: 'Активный',
      REMOVED: 'Удалён',
      ARCHIVED: 'Архив'
    };
    return labels[status];
  }

  private hydrateFromQuery(): void {
    const params = this.route.snapshot.queryParams;
    if (params['iin']) this.filters.iin = params['iin'];
    if (params['fullName']) this.filters.fullName = params['fullName'];
    if (params['birthDate']) this.filters.birthDate = params['birthDate'];
    if (params['status']) this.filters.status = params['status'].split(',') as CitizenStatus[];
    if (params['gender']) this.filters.gender = params['gender'];
    if (params['district']) this.filters.district = params['district'];
    if (params['hasPassport']) this.filters.hasPassport = params['hasPassport'];
    if (params['hasAddress']) this.filters.hasAddress = params['hasAddress'];
    if (params['hasMilOffice']) this.filters.hasMilOffice = params['hasMilOffice'];
    if (params['createdFrom']) this.filters.createdFrom = params['createdFrom'];
    if (params['createdTo']) this.filters.createdTo = params['createdTo'];
    if (params['updatedFrom']) this.filters.updatedFrom = params['updatedFrom'];
    if (params['updatedTo']) this.filters.updatedTo = params['updatedTo'];
  }

  private updateQueryParams(): void {
    const queryParams: Record<string, string> = {};
    if (this.filters.iin) queryParams['iin'] = this.filters.iin;
    if (this.filters.fullName) queryParams['fullName'] = this.filters.fullName;
    if (this.filters.birthDate) queryParams['birthDate'] = this.filters.birthDate;
    if (this.filters.status.length) queryParams['status'] = this.filters.status.join(',');
    if (this.filters.gender !== 'all') queryParams['gender'] = this.filters.gender;
    if (this.filters.district) queryParams['district'] = this.filters.district;
    if (this.filters.hasPassport !== 'all') queryParams['hasPassport'] = this.filters.hasPassport;
    if (this.filters.hasAddress !== 'all') queryParams['hasAddress'] = this.filters.hasAddress;
    if (this.filters.hasMilOffice !== 'all') queryParams['hasMilOffice'] = this.filters.hasMilOffice;
    if (this.filters.createdFrom) queryParams['createdFrom'] = this.filters.createdFrom;
    if (this.filters.createdTo) queryParams['createdTo'] = this.filters.createdTo;
    if (this.filters.updatedFrom) queryParams['updatedFrom'] = this.filters.updatedFrom;
    if (this.filters.updatedTo) queryParams['updatedTo'] = this.filters.updatedTo;

    this.router.navigate([], { queryParams, replaceUrl: true });
  }

  private toRow(citizen: CitizenRecord): CitizenRow {
    return {
      id: citizen.id,
      iin: citizen.iin,
      fullName: `${citizen.lastName} ${citizen.firstName} ${citizen.middleName || ''}`.trim(),
      birthDate: citizen.birthDate,
      status: citizen.status,
      hasPassport: citizen.passports.length > 0,
      hasAddress: citizen.addresses.length > 0,
      hasMilOffice: citizen.milRecords.length > 0,
      updatedAt: citizen.updatedAt,
      updatedBy: citizen.updatedBy,
      gender: citizen.gender,
      district: citizen.district,
      createdAt: citizen.createdAt
    };
  }

  private sortRows(rows: CitizenRow[]): CitizenRow[] {
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const key = this.sortKey;
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      if (av === bv) return 0;
      return av > bv ? direction : -direction;
    });
  }

  private matchesYesNo(filter: string, value: boolean): boolean {
    if (filter === 'all') return true;
    return filter === 'yes' ? value : !value;
  }

  private matchesRange(from: string, to: string, value: string): boolean {
    if (from && value < from) return false;
    if (to && value > to) return false;
    return true;
  }

  private formatDate(value: string): string {
    if (!value) return '—';
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
  }

  private copyToClipboard(text: string): void {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
  }

  private get citizensList(): CitizenRecord[] {
    return this.citizenService.getCitizens()();
  }
}
