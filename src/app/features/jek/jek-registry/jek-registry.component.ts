import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin, TimeoutError, timeout } from 'rxjs';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  ModalComponent,
  SelectComponent,
  SelectOption,
  TableComponent,
  TableColumn,
} from '../../../shared/components';
import {
  AddressesService,
  ApiAddress,
  ApiCitizen,
  ApiFamily,
  CreateAddressRequest,
} from '../../../services/addresses.service';

interface AddressItem {
  id: number;
  citizenId: number;
  citizenFullName: string;
  familyId: number | null;
  familyLabel: string;
  type: string;
  region: string;
  district: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  postalCode: string;
  fullAddress: string;
  startDate: string;
  startDateRaw: string;
  endDate: string;
  endDateRaw: string;
  isActive: 'Активный' | 'Не активный';
  notes: string;
}

interface AddressForm {
  citizenId: string;
  familyId: string;
  type: string;
  region: string;
  district: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  postalCode: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  notes: string;
}

@Component({
  selector: 'app-jek-registry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    InputComponent,
    SelectComponent,
    TableComponent,
    ButtonComponent,
    ModalComponent,
  ],
  templateUrl: './jek-registry.component.html',
  styleUrl: './jek-registry.component.css',
})
export class JekRegistryComponent implements OnInit {
  filters = {
    fullName: '',
    address: '',
    active: 'all',
  };

  activeOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'inactive', label: 'Неактивные' },
  ];

  typeOptions: SelectOption[] = [
    { value: 'REGISTRATION', label: 'Регистрация' },
    { value: 'RESIDENCE', label: 'Проживание' },
    { value: 'TEMPORARY', label: 'Временный' },
  ];

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'citizenFullName', label: 'Гражданин', sortable: true },
    { key: 'familyLabel', label: 'Семья', sortable: true },
    { key: 'type', label: 'Тип', sortable: true },
    { key: 'fullAddress', label: 'Полный адрес', sortable: true },
    { key: 'startDate', label: 'Начало', sortable: true },
    { key: 'endDate', label: 'Окончание', sortable: true },
    { key: 'isActive', label: 'Статус', sortable: true },
    { key: 'notes', label: 'Комментарий', sortable: false },
  ];

  records: AddressItem[] = [];
  peopleOptions: SelectOption[] = [];
  familyOptions: SelectOption[] = [];
  private citizens: ApiCitizen[] = [];
  private families: ApiFamily[] = [];
  private addressCitizenIds = new Set<number>();

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  formData: AddressForm = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: AddressItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(
    private readonly addressesService: AddressesService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('action') !== 'registry-check') {
        return;
      }
      this.filters = { fullName: '', address: '', active: 'all' };
    });
  }

  get filteredRecords(): AddressItem[] {
    const byName = this.filters.fullName.trim().toLowerCase();
    const byAddress = this.filters.address.trim().toLowerCase();
    const byActive = this.filters.active;

    return this.records.filter((record) => {
      const matchesName = !byName || record.citizenFullName.toLowerCase().includes(byName);
      const matchesAddress = !byAddress || record.fullAddress.toLowerCase().includes(byAddress);
      const matchesActive =
        byActive === 'all' ||
        (byActive === 'active' && record.isActive === 'Активный') ||
        (byActive === 'inactive' && record.isActive === 'Не активный');

      return matchesName && matchesAddress && matchesActive;
    });
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Изменить адрес' : 'Добавить адрес';
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      addresses: this.addressesService.getAll(),
      citizens: this.addressesService.getCitizens(),
      families: this.addressesService.getFamilies(),
    })
      .pipe(timeout(15000))
      .subscribe({
        next: ({ addresses, citizens, families }) => {
          this.citizens = citizens;
          this.families = families;
          this.addressCitizenIds = new Set(addresses.map((address) => address.citizenId));
          this.peopleOptions = this.buildCitizenOptions(citizens, this.addressCitizenIds);
          this.familyOptions = families.map((family: ApiFamily) => ({
            value: family.id.toString(),
            label: this.formatFamilyLabel(family),
          }));
          this.records = addresses.map((address) => this.mapRecord(address));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.records = [];
          this.peopleOptions = [];
          this.familyOptions = [];
          this.citizens = [];
          this.families = [];
          this.addressCitizenIds.clear();
          if (error instanceof TimeoutError) {
            this.errorMessage = 'Превышено время ожидания ответа API.';
          } else {
            this.errorMessage = 'Не удалось загрузить реестр ЖЭК.';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingRecordId = null;
    this.formData = this.createDefaultForm();
    this.formErrorMessage = '';
    this.applyFamilyDefaults(this.formData.citizenId);
    this.showFormModal = true;
  }

  openEdit(row: AddressItem): void {
    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.formData = {
      citizenId: row.citizenId.toString(),
      familyId: row.familyId ? row.familyId.toString() : '',
      type: row.type,
      region: row.region === '-' ? '' : row.region,
      district: row.district === '-' ? '' : row.district,
      city: row.city === '-' ? '' : row.city,
      street: row.street === '-' ? '' : row.street,
      house: row.house === '-' ? '' : row.house,
      apartment: row.apartment === '-' ? '' : row.apartment,
      postalCode: row.postalCode === '-' ? '' : row.postalCode,
      startDate: row.startDateRaw,
      endDate: row.endDateRaw,
      isActive: row.isActive === 'Активный',
      notes: row.notes === '-' ? '' : row.notes,
    };
    this.applyFamilyDefaults(this.formData.citizenId);
    this.formErrorMessage = '';
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (this.isFormSubmitting) {
      return;
    }
    this.showFormModal = false;
  }

  saveForm(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.isFormSubmitting = true;
    this.formErrorMessage = '';

    const request$ =
      this.isEditMode && this.editingRecordId
        ? this.addressesService.update(this.editingRecordId, payload)
        : this.addressesService.create(payload);

    request$
      .pipe(
        finalize(() => {
          this.isFormSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (ok) => {
          if (!ok) {
            this.formErrorMessage = this.isEditMode ? 'Не удалось изменить адрес.' : 'Не удалось создать адрес.';
            return;
          }
          this.showFormModal = false;
          this.loadData();
        },
        error: () => {
          this.formErrorMessage = this.isEditMode ? 'Не удалось изменить адрес.' : 'Не удалось создать адрес.';
        },
      });
  }

  openDelete(row: AddressItem): void {
    this.deletingRecord = row;
    this.deleteErrorMessage = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) {
      return;
    }
    this.showDeleteModal = false;
    this.deletingRecord = null;
    this.deleteErrorMessage = '';
  }

  confirmDelete(): void {
    if (!this.deletingRecord || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.deleteErrorMessage = '';

    this.addressesService
      .delete(this.deletingRecord.id)
      .pipe(
        finalize(() => {
          this.isDeleting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (ok) => {
          if (!ok) {
            this.deleteErrorMessage = 'Не удалось удалить адрес.';
            return;
          }
          this.showDeleteModal = false;
          this.deletingRecord = null;
          this.loadData();
        },
        error: () => {
          this.deleteErrorMessage = 'Не удалось удалить адрес.';
        },
      });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      REGISTRATION: 'Регистрация',
      RESIDENCE: 'Проживание',
      TEMPORARY: 'Временный',
    };
    return labels[type] ?? type;
  }

  private mapRecord(address: ApiAddress): AddressItem {
    return {
      id: address.id,
      citizenId: address.citizenId,
      citizenFullName: address.citizenFullName?.trim() || `ID ${address.citizenId}`,
      familyId: address.familyId,
      familyLabel: address.familyId ? this.formatFamilyLabelFromAddress(address.familyId) : '—',
      type: address.type,
      region: address.region?.trim() || '-',
      district: address.district?.trim() || '-',
      city: address.city?.trim() || '-',
      street: address.street?.trim() || '-',
      house: address.house?.trim() || '-',
      apartment: address.apartment?.trim() || '-',
      postalCode: address.postalCode?.trim() || '-',
      fullAddress: address.fullAddress?.trim() || '-',
      startDate: this.formatDate(address.startDate),
      startDateRaw: this.normalizeDateInput(address.startDate),
      endDate: this.formatDate(address.endDate),
      endDateRaw: this.normalizeDateInput(address.endDate),
      isActive: address.isActive ? 'Активный' : 'Не активный',
      notes: address.notes?.trim() || '-',
    };
  }

  private buildPayload(): CreateAddressRequest | null {
    const citizenId = Number(this.formData.citizenId);
    const familyId = this.formData.familyId ? Number(this.formData.familyId) : null;

    if (!Number.isInteger(citizenId) || citizenId <= 0) {
      this.formErrorMessage = 'Выберите гражданина.';
      return null;
    }

    if (!this.formData.region.trim()) {
      this.formErrorMessage = 'Укажите регион.';
      return null;
    }

    if (!this.formData.street.trim()) {
      this.formErrorMessage = 'Укажите улицу.';
      return null;
    }

    if (!this.formData.house.trim()) {
      this.formErrorMessage = 'Укажите дом.';
      return null;
    }

    if (!this.formData.startDate.trim()) {
      this.formErrorMessage = 'Укажите дату начала.';
      return null;
    }

    const endDate = this.formData.endDate.trim() ? this.toIsoDate(this.formData.endDate) : null;

    return {
      citizenId,
      familyId: Number.isInteger(familyId ?? NaN) && (familyId ?? 0) > 0 ? familyId : null,
      type: this.formData.type || 'REGISTRATION',
      region: this.formData.region.trim(),
      district: this.formData.district.trim() || null,
      city: this.formData.city.trim() || null,
      street: this.formData.street.trim(),
      house: this.formData.house.trim(),
      apartment: this.formData.apartment.trim() || null,
      postalCode: this.formData.postalCode.trim() || null,
      startDate: this.toIsoDate(this.formData.startDate),
      endDate,
      isActive: this.formData.isActive,
      notes: this.formData.notes.trim() || null,
    };
  }

  onCitizenSelected(value: string | number | null): void {
    const citizenId = Number(value);
    if (!Number.isInteger(citizenId) || citizenId <= 0) {
      return;
    }

    this.applyFamilyDefaults(String(citizenId));
  }

  private createDefaultForm(): AddressForm {
    return {
      citizenId: '',
      familyId: '',
      type: 'REGISTRATION',
      region: '',
      district: '',
      city: '',
      street: '',
      house: '',
      apartment: '',
      postalCode: '',
      startDate: '',
      endDate: '',
      isActive: true,
      notes: '',
    };
  }

  private buildCitizenOptions(citizens: ApiCitizen[], addressCitizenIds: Set<number>): SelectOption[] {
    return citizens
      .slice()
      .sort((a, b) => {
        const aIsChild = a.lifeStatus === 'NEWBORN' && !addressCitizenIds.has(a.id);
        const bIsChild = b.lifeStatus === 'NEWBORN' && !addressCitizenIds.has(b.id);
        if (aIsChild !== bIsChild) {
          return aIsChild ? -1 : 1;
        }
        return b.id - a.id;
      })
      .map((citizen) => {
        const isChildWithoutAddress = citizen.lifeStatus === 'NEWBORN' && !addressCitizenIds.has(citizen.id);
        const labelPrefix = isChildWithoutAddress ? 'Ребёнок без адреса' : 'Гражданин';
        return {
          value: citizen.id.toString(),
          label: `${labelPrefix}: ${citizen.fullName?.trim() || `ID ${citizen.id}`}`,
        };
      });
  }

  private applyFamilyDefaults(citizenIdValue: string | null): void {
    const citizenId = Number(citizenIdValue);
    if (!Number.isInteger(citizenId) || citizenId <= 0) {
      return;
    }

    const family = this.families.find(
      (item) => item.primaryCitizenId === citizenId || item.memberCitizenIds.includes(citizenId),
    );
    if (family && !this.formData.familyId) {
      this.formData.familyId = family.id.toString();
    }
  }

  private formatFamilyLabel(family: ApiFamily): string {
    const primary = family.primaryCitizenFullName?.trim();
    const familyName = family.familyName?.trim();
    const memberCount = family.memberCount > 0 ? `(${family.memberCount})` : '';

    if (primary) {
      return memberCount ? `${primary} ${memberCount}` : primary;
    }

    if (familyName) {
      return memberCount ? `${familyName} ${memberCount}` : familyName;
    }

    return `Семья #${family.id}`;
  }

  private formatFamilyLabelFromAddress(familyId: number): string {
    const family = this.families.find((item) => item.id === familyId);
    return family ? this.formatFamilyLabel(family) : `Семья #${familyId}`;
  }

  private normalizeDateInput(value: string | null): string {
    if (!value || value === '-') {
      return '';
    }
    return value.includes('T') ? value.slice(0, 10) : value;
  }

  private toIsoDate(value: string): string {
    return new Date(value).toISOString().split('T')[0];
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('ru-RU');
  }
}
