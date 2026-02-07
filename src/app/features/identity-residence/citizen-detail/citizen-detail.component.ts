import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  Gender,
  PassportRecord,
  AddressRecord,
  MilRecord,
  AddressType,
  PassportStatus,
  MilStatus
} from '../../../services/identity-citizen.service';

@Component({
  selector: 'app-identity-citizen-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    TableComponent,
    InputComponent,
    ButtonComponent,
    ModalComponent,
    SelectComponent,
    RouterLink
  ],
  templateUrl: './citizen-detail.component.html',
  styleUrl: './citizen-detail.component.css'
})
export class CitizenDetailComponent {
  citizenId = '';
  activeTab = signal<'profile' | 'passport' | 'address' | 'military' | 'history'>('profile');
  editMode = signal(false);

  showStatusModal = false;
  showDeleteModal = false;
  deleteReason = '';
  hardDelete = false;
  confirmHardDelete = false;
  canHardDelete = false;

  profileForm = {
    lastName: '',
    firstName: '',
    middleName: '',
    birthDate: '',
    gender: 'male' as Gender,
    citizenship: '',
    maritalStatus: '',
    phone: '',
    email: ''
  };

  profileDirty = false;

  statusOptions: SelectOption[] = [
    { value: 'ACTIVE', label: 'Активный' },
    { value: 'REMOVED', label: 'Удалён' },
    { value: 'ARCHIVED', label: 'Архив' }
  ];

  genderOptions: SelectOption[] = [
    { value: 'male', label: 'Мужской' },
    { value: 'female', label: 'Женский' }
  ];

  passportStatusOptions: SelectOption[] = [
    { value: 'ACTIVE', label: 'Действующий' },
    { value: 'EXPIRED', label: 'Истёк' },
    { value: 'ANNULLED', label: 'Аннулирован' }
  ];

  addressTypeOptions: SelectOption[] = [
    { value: 'REGISTRATION', label: 'Регистрация' },
    { value: 'RESIDENCE', label: 'Проживание' },
    { value: 'TEMPORARY', label: 'Временный' }
  ];

  milStatusOptions: SelectOption[] = [
    { value: 'ENLISTED', label: 'Состоит' },
    { value: 'REMOVED', label: 'Снят' }
  ];

  passportColumns: TableColumn[] = [
    { key: 'series', label: 'Серия', sortable: true },
    { key: 'number', label: 'Номер', sortable: true },
    { key: 'issuedBy', label: 'Кем выдан', sortable: true },
    { key: 'issueDate', label: 'Дата выдачи', sortable: true },
    { key: 'expireDate', label: 'Дата окончания', sortable: true },
    { key: 'status', label: 'Статус', sortable: true }
  ];

  addressColumns: TableColumn[] = [
    { key: 'type', label: 'Тип', sortable: true },
    { key: 'full', label: 'Адрес', sortable: true },
    { key: 'startDate', label: 'Начало', sortable: true },
    { key: 'endDate', label: 'Окончание', sortable: true },
    { key: 'isActive', label: 'Активный', sortable: true }
  ];

  milColumns: TableColumn[] = [
    { key: 'office', label: 'Военкомат', sortable: true },
    { key: 'enlistDate', label: 'Дата постановки', sortable: true },
    { key: 'category', label: 'Категория', sortable: true },
    { key: 'status', label: 'Статус', sortable: true }
  ];

  historyFilters = {
    from: '',
    to: '',
    section: 'all',
    user: ''
  };

  showPassportModal = false;
  editingPassportId: string | null = null;
  passportForm = this.blankPassportForm();

  showAddressModal = false;
  editingAddressId: string | null = null;
  addressForm = this.blankAddressForm();

  showMilModal = false;
  editingMilId: string | null = null;
  milForm = this.blankMilForm();

  citizen = computed(() => {
    return this.citizensList.find(c => c.id === this.citizenId) || null;
  });

  filteredHistory = computed(() => {
    const citizen = this.citizen();
    if (!citizen) return [];
    return citizen.history.filter(entry => {
      if (this.historyFilters.section !== 'all' && entry.section !== this.historyFilters.section) return false;
      if (this.historyFilters.user && !entry.user.toLowerCase().includes(this.historyFilters.user.toLowerCase())) return false;
      if (this.historyFilters.from && entry.date < this.historyFilters.from) return false;
      if (this.historyFilters.to && entry.date > this.historyFilters.to) return false;
      return true;
    });
  });

  constructor(
    private citizenService: IdentityCitizenService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.citizenId = id;
      const citizen = this.citizen();
      if (citizen) {
        this.fillProfileForm(citizen);
        if (this.route.snapshot.queryParamMap.get('mode') === 'edit') {
          this.editMode.set(true);
        }
      }
    }
  }

  switchTab(tab: 'profile' | 'passport' | 'address' | 'military' | 'history'): void {
    if (this.profileDirty && !confirm('Есть несохраненные изменения. Продолжить?')) {
      return;
    }
    this.activeTab.set(tab);
  }

  enableEdit(): void {
    const citizen = this.citizen();
    if (!citizen) return;
    this.fillProfileForm(citizen);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const citizen = this.citizen();
    if (!citizen) return;
    this.fillProfileForm(citizen);
    this.editMode.set(false);
    this.profileDirty = false;
  }

  saveProfile(): void {
    this.citizenService.updateCitizen(this.citizenId, {
      lastName: this.profileForm.lastName,
      firstName: this.profileForm.firstName,
      middleName: this.profileForm.middleName,
      birthDate: this.profileForm.birthDate,
      gender: this.profileForm.gender,
      citizenship: this.profileForm.citizenship,
      maritalStatus: this.profileForm.maritalStatus,
      phone: this.profileForm.phone,
      email: this.profileForm.email
    });
    this.editMode.set(false);
    this.profileDirty = false;
  }

  openStatusModal(): void {
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
  }

  onStatusSelect(value: string | number | null): void {
    if (typeof value !== 'string') return;
    const status = value as CitizenStatus;
    this.citizenService.changeStatus([this.citizenId], status);
    this.showStatusModal = false;
  }

  openDelete(): void {
    this.showDeleteModal = true;
    this.deleteReason = '';
    this.hardDelete = false;
    this.confirmHardDelete = false;
  }

  closeDelete(): void {
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.deleteReason.trim()) return;
    if (this.hardDelete && !this.confirmHardDelete) return;
    this.citizenService.softDelete(this.citizenId, this.deleteReason, this.hardDelete);
    this.router.navigate(['/identity-residence/jek']);
  }

  openPassportModal(passport?: PassportRecord): void {
    this.showPassportModal = true;
    if (passport) {
      this.editingPassportId = passport.id;
      this.passportForm = { ...passport };
    } else {
      this.editingPassportId = null;
      this.passportForm = this.blankPassportForm();
    }
  }

  savePassport(): void {
    if (this.editingPassportId) {
      this.citizenService.updatePassport(this.citizenId, this.editingPassportId, this.passportForm);
    } else {
      this.citizenService.addPassport(this.citizenId, this.passportForm);
    }
    this.showPassportModal = false;
  }

  annulPassport(passport: PassportRecord): void {
    this.citizenService.annulPassport(this.citizenId, passport.id);
  }

  openAddressModal(address?: AddressRecord): void {
    this.showAddressModal = true;
    if (address) {
      this.editingAddressId = address.id;
      this.addressForm = { ...address };
    } else {
      this.editingAddressId = null;
      this.addressForm = this.blankAddressForm();
    }
  }

  saveAddress(): void {
    if (this.editingAddressId) {
      this.citizenService.updateAddress(this.citizenId, this.editingAddressId, this.addressForm);
    } else {
      this.citizenService.addAddress(this.citizenId, this.addressForm);
    }
    this.showAddressModal = false;
  }

  openMilModal(record?: MilRecord): void {
    this.showMilModal = true;
    if (record) {
      this.editingMilId = record.id;
      this.milForm = { ...record };
    } else {
      this.editingMilId = null;
      this.milForm = this.blankMilForm();
    }
  }

  saveMil(): void {
    if (this.editingMilId) {
      this.citizenService.updateMilRecord(this.citizenId, this.editingMilId, this.milForm);
    } else {
      this.citizenService.addMilRecord(this.citizenId, this.milForm);
    }
    this.showMilModal = false;
  }

  getStatusLabel(status: CitizenStatus): string {
    const labels: Record<CitizenStatus, string> = {
      ACTIVE: 'Активный',
      REMOVED: 'Удалён',
      ARCHIVED: 'Архив'
    };
    return labels[status];
  }

  getPassportStatusLabel(status: PassportStatus): string {
    const labels: Record<PassportStatus, string> = {
      ACTIVE: 'Действующий',
      EXPIRED: 'Истёк',
      ANNULLED: 'Аннулирован'
    };
    return labels[status];
  }

  getAddressTypeLabel(type: AddressType): string {
    const labels: Record<AddressType, string> = {
      REGISTRATION: 'Регистрация',
      RESIDENCE: 'Проживание',
      TEMPORARY: 'Временный'
    };
    return labels[type];
  }

  getMilStatusLabel(status: MilStatus): string {
    const labels: Record<MilStatus, string> = {
      ENLISTED: 'Состоит',
      REMOVED: 'Снят'
    };
    return labels[status];
  }

  isMilRequired(citizen: CitizenRecord): boolean {
    if (citizen.gender === 'female') return false;
    const age = this.getAge(citizen.birthDate);
    return age >= 17;
  }

  private fillProfileForm(citizen: CitizenRecord): void {
    this.profileForm = {
      lastName: citizen.lastName,
      firstName: citizen.firstName,
      middleName: citizen.middleName || '',
      birthDate: citizen.birthDate,
      gender: citizen.gender,
      citizenship: citizen.citizenship,
      maritalStatus: citizen.maritalStatus || '',
      phone: citizen.phone || '',
      email: citizen.email || ''
    };
  }

  private blankPassportForm(): PassportRecord {
    return {
      id: '',
      series: '',
      number: '',
      issuedBy: '',
      issueDate: '',
      expireDate: '',
      status: 'ACTIVE'
    };
  }

  private blankAddressForm(): AddressRecord {
    return {
      id: '',
      type: 'REGISTRATION',
      region: '',
      district: '',
      city: '',
      street: '',
      house: '',
      apartment: '',
      startDate: '',
      endDate: '',
      isActive: true,
      notes: ''
    };
  }

  private blankMilForm(): MilRecord {
    return {
      id: '',
      office: '',
      enlistDate: '',
      category: '',
      status: 'ENLISTED',
      notes: ''
    };
  }

  private getAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  }

  private get citizensList(): CitizenRecord[] {
    return this.citizenService.getCitizens()();
  }
}
