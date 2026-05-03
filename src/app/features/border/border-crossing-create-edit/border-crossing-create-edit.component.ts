import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, timeout, TimeoutError } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import {
  ApiBorderCrossing,
  ApiCitizen,
  BorderCrossingService,
  CreateBorderCrossingRequest,
} from '../../../services/border-crossing.service';
import { AddressesService, ApiAddress } from '../../../services/addresses.service';
import { PassportRecordsService, ApiPassportRecord } from '../../../services/passport-records.service';
import { ButtonComponent, CardComponent, InputComponent, SelectComponent, SelectOption } from '../../../shared/components';
import { type CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';

interface BorderCrossingForm {
  peopleId: string;
  departureDate: string;
  returnDate: string;
  outsideBorder: 'true' | 'false';
  country: string;
  description: string;
}

@Component({
  selector: 'app-border-crossing-create-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './border-crossing-create-edit.component.html',
  styleUrl: './border-crossing-create-edit.component.css',
})
export class BorderCrossingCreateEditComponent implements OnChanges, OnInit {
  @Input() citizen: CitizenReadCardData | null = null;
  @Input() recordId: string | null = null;
  @Input() embedded = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  isLoading = false;
  isReferenceLoading = false;
  isCitizenDetailsLoading = false;
  isSubmitting = false;
  isCitizenSearchLoading = false;
  errorMessage = '';
  successMessage = '';

  form: BorderCrossingForm = this.createDefaultForm();
  citizens: ApiCitizen[] = [];
  selectedCitizen: ApiCitizen | null = null;
  selectedPassport: ApiPassportRecord | null = null;
  selectedAddress: ApiAddress | null = null;

  citizenSearch = '';
  citizenPage = 1;
  readonly citizenPageSize = 15;
  citizenTotal = 0;
  hasMoreCitizens = false;

  outsideBorderOptions: SelectOption[] = [
    { value: 'true', label: 'Да' },
    { value: 'false', label: 'Нет' },
  ];

  constructor(
    private readonly borderCrossingService: BorderCrossingService,
    private readonly passportRecordsService: PassportRecordsService,
    private readonly addressesService: AddressesService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadInitialCitizens();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['citizen'] && this.citizen?.id && !this.recordId) {
      this.form.peopleId = this.extractPeopleId(this.citizen.id)?.toString() ?? '';
      this.loadSelectedCitizen();
    }

    if (changes['recordId'] && this.recordId) {
      this.loadRecord();
    }
  }

  get documentNumber(): string {
    if (this.isCitizenDetailsLoading) {
      return 'Загрузка паспорта...';
    }
    return this.selectedPassport?.passportNumber?.trim() || 'Нет активного паспорта';
  }

  get addressLabel(): string {
    if (this.isCitizenDetailsLoading) {
      return 'Загрузка адреса...';
    }
    return this.selectedAddress?.fullAddress?.trim() || 'Нет активного адреса';
  }

  get parentSummary(): string {
    if (!this.selectedCitizen) {
      return 'Нет выбранного гражданина';
    }

    return `${this.selectedCitizen.fatherFullName?.trim() || 'Отец не указан'} / ${this.selectedCitizen.motherFullName?.trim() || 'Мать не указана'}`;
  }

  get selectedCitizenLabel(): string {
    if (!this.selectedCitizen) {
      return 'Гражданин не выбран';
    }

    return this.selectedCitizen.fullName?.trim() || `ID ${this.selectedCitizen.id}`;
  }

  get citizenRangeLabel(): string {
    if (this.citizenTotal === 0) {
      return 'Ничего не найдено';
    }

    const start = (this.citizenPage - 1) * this.citizenPageSize + 1;
    const end = Math.min(this.citizenPage * this.citizenPageSize, this.citizenTotal);
    return `${start}-${end} из ${this.citizenTotal}`;
  }

  searchCitizens(page = 1): void {
    this.isCitizenSearchLoading = true;
    this.citizenPage = page;

    this.borderCrossingService
      .searchCitizens(this.citizenSearch, this.citizenPage, this.citizenPageSize)
      .pipe(
        finalize(() => {
          this.isCitizenSearchLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.citizens = response.items;
          this.citizenTotal = response.total;
          this.citizenPage = response.page;
          this.hasMoreCitizens = response.hasMore;
        },
        error: () => {
          this.citizens = [];
          this.citizenTotal = 0;
          this.hasMoreCitizens = false;
        },
      });
  }

  selectCitizen(citizen: ApiCitizen): void {
    this.selectedCitizen = citizen;
    this.form.peopleId = citizen.id.toString();
    this.loadCitizenDetails();
  }

  clearSelectedCitizen(): void {
    this.form.peopleId = '';
    this.selectedCitizen = null;
    this.selectedPassport = null;
    this.selectedAddress = null;
  }

  goToPreviousCitizenPage(): void {
    if (this.citizenPage > 1) {
      this.searchCitizens(this.citizenPage - 1);
    }
  }

  goToNextCitizenPage(): void {
    if (this.hasMoreCitizens) {
      this.searchCitizens(this.citizenPage + 1);
    }
  }

  save(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    const recordId = Number(this.recordId);
    const isEdit = Number.isInteger(recordId) && recordId > 0;

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    const request$ = isEdit
      ? this.borderCrossingService.update(recordId, payload)
      : this.borderCrossingService.create(payload);

    request$
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: (record) => {
          if (!record) {
            this.errorMessage = isEdit ? 'Не удалось изменить запись.' : 'Не удалось создать запись.';
            return;
          }
          this.successMessage = isEdit ? 'Запись обновлена.' : 'Запись создана.';
          this.saved.emit();
          if (this.embedded) {
            this.closed.emit();
          }
        },
        error: (error: unknown) => {
          this.errorMessage =
            error instanceof TimeoutError
              ? 'Превышено время ожидания ответа API.'
              : isEdit
                ? 'Не удалось изменить запись.'
                : 'Не удалось создать запись.';
        },
      });
  }

  close(): void {
    if (this.embedded) {
      this.closed.emit();
    }
  }

  private loadInitialCitizens(): void {
    this.isReferenceLoading = true;
    this.errorMessage = '';

    this.borderCrossingService
      .searchCitizens('', 1, this.citizenPageSize)
      .pipe(
        finalize(() => {
          this.isReferenceLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.citizens = response.items;
          this.citizenTotal = response.total;
          this.citizenPage = response.page;
          this.hasMoreCitizens = response.hasMore;

          if (this.citizen?.id && !this.recordId) {
            this.form.peopleId = this.extractPeopleId(this.citizen.id)?.toString() ?? '';
            this.loadSelectedCitizen();
          }

          if (this.recordId) {
            this.loadRecord();
          }
        },
        error: (error: unknown) => {
          this.citizens = [];
          this.citizenTotal = 0;
          this.hasMoreCitizens = false;
          this.errorMessage =
            error instanceof TimeoutError
              ? 'Превышено время ожидания ответа API.'
              : 'Не удалось загрузить список граждан.';
        },
      });
  }

  private loadRecord(): void {
    const recordId = Number(this.recordId);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.borderCrossingService
      .getById(recordId)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (record) => {
          if (!record) {
            this.errorMessage = 'Запись не найдена.';
            return;
          }
          this.applyRecord(record);
          this.loadSelectedCitizen();
        },
        error: (error: unknown) => {
          this.errorMessage =
            error instanceof TimeoutError
              ? 'Превышено время ожидания ответа API.'
              : 'Не удалось загрузить запись погранслужбы.';
        },
      });
  }

  private applyRecord(record: ApiBorderCrossing): void {
    this.form = {
      peopleId: record.peopleId.toString(),
      departureDate: this.toDateTimeLocal(record.departureDate),
      returnDate: record.returnDate ? this.toDateTimeLocal(record.returnDate) : '',
      outsideBorder: record.outsideBorder ? 'true' : 'false',
      country: record.country?.trim() || '',
      description: record.description?.trim() || '',
    };
  }

  private loadSelectedCitizen(): void {
    const peopleId = Number(this.form.peopleId);
    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.clearSelectedCitizen();
      return;
    }

    const localCitizen = this.citizens.find((citizen) => citizen.id === peopleId) ?? null;
    if (localCitizen) {
      this.selectedCitizen = localCitizen;
      this.loadCitizenDetails();
      return;
    }

    this.borderCrossingService.getCitizenById(peopleId).subscribe((citizen) => {
      this.selectedCitizen = citizen;
      this.loadCitizenDetails();
    });
  }

  private loadCitizenDetails(): void {
    const peopleId = Number(this.form.peopleId);
    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.selectedPassport = null;
      this.selectedAddress = null;
      this.isCitizenDetailsLoading = false;
      return;
    }

    this.isCitizenDetailsLoading = true;

    forkJoin({
      passports: this.passportRecordsService.getByPeopleId(peopleId),
      addresses: this.addressesService.getByCitizenId(peopleId),
    })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isCitizenDetailsLoading = false;
        }),
      )
      .subscribe({
        next: ({ passports, addresses }) => {
          this.selectedPassport = passports[0] ?? null;
          this.selectedAddress = addresses.find((address) => address.isActive) ?? addresses[0] ?? null;
        },
        error: () => {
          this.selectedPassport = null;
          this.selectedAddress = null;
        },
      });
  }

  private buildPayload(): CreateBorderCrossingRequest | null {
    const peopleId = Number(this.form.peopleId);
    const userId = this.authService.resolveCurrentUserId();

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.errorMessage = 'Выберите гражданина из списка ниже.';
      return null;
    }

    if (!userId) {
      this.errorMessage = 'Не удалось определить текущего пользователя.';
      return null;
    }

    if (!this.form.departureDate) {
      this.errorMessage = 'Укажите дату выезда.';
      return null;
    }

    if (!this.form.country.trim()) {
      this.errorMessage = 'Укажите страну.';
      return null;
    }

    return {
      peopleId,
      userId,
      departureDate: new Date(this.form.departureDate).toISOString(),
      returnDate: this.form.returnDate ? new Date(this.form.returnDate).toISOString() : null,
      outsideBorder: this.form.outsideBorder === 'true',
      country: this.form.country.trim(),
      description: this.form.description.trim() || null,
      documentNumber: this.selectedPassport?.passportNumber?.trim() || null,
    };
  }

  private createDefaultForm(): BorderCrossingForm {
    return {
      peopleId: '',
      departureDate: '',
      returnDate: '',
      outsideBorder: 'true',
      country: '',
      description: '',
    };
  }

  private extractPeopleId(citizenId: string): number | null {
    const numericPart = citizenId.replace(/[^\d]/g, '');
    if (!numericPart) {
      return null;
    }
    const peopleId = Number(numericPart);
    return Number.isInteger(peopleId) ? peopleId : null;
  }

  private toDateTimeLocal(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
