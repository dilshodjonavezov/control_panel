import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, forkJoin, map, of, switchMap, timeout, TimeoutError } from 'rxjs';
import { AddressesService, ApiAddress, ApiFamily } from '../../../services/addresses.service';
import { AuthService } from '../../../services/auth.service';
import {
  ApiBorderCrossing,
  ApiCitizen,
  BorderCrossingService,
  CreateBorderCrossingRequest,
  PagedCitizensResponse,
} from '../../../services/border-crossing.service';
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

  private readonly destroyRef = inject(DestroyRef);
  private readonly citizenSearch$ = new Subject<string>();

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
  selectedFamily: ApiFamily | null = null;

  citizenSearch = '';
  citizenPage = 1;
  readonly citizenPageSize = 15;
  citizenTotal = 0;
  currentCitizenPageCount = 0;
  hasMoreCitizens = false;

  private allPassports: ApiPassportRecord[] | null = null;
  private allAddresses: ApiAddress[] | null = null;
  private allFamilies: ApiFamily[] | null = null;

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
    this.setupCitizenSearch();
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

  get familyLabel(): string {
    if (this.isCitizenDetailsLoading) {
      return 'Загрузка семьи...';
    }
    return this.selectedFamily?.familyName?.trim() || 'Семья не найдена';
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
    if (this.currentCitizenPageCount === 0) {
      return 'Ничего не найдено';
    }

    const start = (this.citizenPage - 1) * this.citizenPageSize + 1;
    const end = start + this.currentCitizenPageCount - 1;
    return `${start}-${end}`;
  }

  get citizenTotalLabel(): string {
    return `Всего граждан в реестре: ${this.citizenTotal}`;
  }

  get selectedCitizenDetails(): string {
    if (!this.selectedCitizen) {
      return 'Выберите гражданина из списка ниже.';
    }

    const details = [
      this.selectedCitizen.birthDate ? `Дата рождения: ${this.selectedCitizen.birthDate}` : null,
      this.selectedCitizen.gender ? `Пол: ${this.selectedCitizen.gender}` : null,
      this.selectedCitizen.citizenship ? `Гражданство: ${this.selectedCitizen.citizenship}` : null,
    ].filter(Boolean);

    return details.join(' · ');
  }

  onCitizenSearchChanged(value: string): void {
    this.citizenSearch = value;
    this.citizenPage = 1;
    this.citizenSearch$.next(value.trim());
  }

  searchCitizens(page = 1): void {
    this.isCitizenSearchLoading = true;
    this.citizenPage = page;
    this.errorMessage = '';

    this.borderCrossingService
      .searchCitizens(this.citizenSearch, page, this.citizenPageSize)
      .pipe(
        finalize(() => {
          this.isCitizenSearchLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.applyCitizenSearchResponse(response);
        },
        error: () => {
          this.citizens = [];
          this.currentCitizenPageCount = 0;
          this.hasMoreCitizens = false;
          this.errorMessage = 'Не удалось загрузить список граждан.';
        },
      });
  }

  selectCitizen(citizen: ApiCitizen): void {
    this.selectedCitizen = citizen;
    this.form.peopleId = citizen.id.toString();
    this.citizenSearch = citizen.fullName?.trim() || '';
    this.errorMessage = '';
    this.loadCitizenDetails();
  }

  clearSelectedCitizen(): void {
    this.form.peopleId = '';
    this.selectedCitizen = null;
    this.selectedPassport = null;
    this.selectedAddress = null;
    this.selectedFamily = null;
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

  private setupCitizenSearch(): void {
    this.citizenSearch$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((search) => {
          this.isCitizenSearchLoading = true;
          this.errorMessage = '';

          return this.borderCrossingService.searchCitizens(search, 1, this.citizenPageSize).pipe(
            catchError(() =>
              of({
                items: [],
                total: this.citizenTotal,
                page: 1,
                limit: this.citizenPageSize,
                hasMore: false,
                search,
                shown: 0,
              } as PagedCitizensResponse),
            ),
            finalize(() => {
              this.isCitizenSearchLoading = false;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.applyCitizenSearchResponse(response);
      });
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
          this.applyCitizenSearchResponse(response);

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
          this.currentCitizenPageCount = 0;
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
      this.citizenSearch = localCitizen.fullName?.trim() || '';
      this.loadCitizenDetails();
      return;
    }

    this.borderCrossingService
      .getCitizenById(peopleId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((citizen) => {
        this.selectedCitizen = citizen;
        this.citizenSearch = citizen?.fullName?.trim() || '';
        this.loadCitizenDetails();
      });
  }

  private loadCitizenDetails(): void {
    const peopleId = Number(this.form.peopleId);
    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.selectedPassport = null;
      this.selectedAddress = null;
      this.selectedFamily = null;
      this.isCitizenDetailsLoading = false;
      return;
    }

    this.isCitizenDetailsLoading = true;

    forkJoin({
      passports: this.passportRecordsService.getByPeopleId(peopleId).pipe(catchError(() => of([]))),
      addresses: this.addressesService.getByCitizenId(peopleId).pipe(catchError(() => of([]))),
    })
      .pipe(
        timeout(15000),
        switchMap(({ passports, addresses }) => {
          const hasDirectPassport = passports.length > 0;
          const hasDirectAddress = addresses.length > 0;
          const hasFamilyId = this.selectedCitizen?.familyId != null;

          if (hasDirectPassport && hasDirectAddress && hasFamilyId) {
            return of({
              directPassports: passports,
              directAddresses: addresses,
              fallbackPassports: this.allPassports ?? [],
              fallbackAddresses: this.allAddresses ?? [],
              families: this.allFamilies ?? [],
            });
          }

          return this.ensureFallbackReferences().pipe(
            map((fallback) => ({
              directPassports: passports,
              directAddresses: addresses,
              fallbackPassports: fallback.passports,
              fallbackAddresses: fallback.addresses,
              families: fallback.families,
            })),
          );
        }),
        finalize(() => {
          this.isCitizenDetailsLoading = false;
        }),
      )
      .subscribe({
        next: ({ directPassports, directAddresses, fallbackPassports, fallbackAddresses, families }) => {
          this.selectedFamily =
            families.find((family) => family.id === this.selectedCitizen?.familyId) ??
            families.find((family) => family.memberCitizenIds.includes(peopleId) || family.childCitizenIds?.includes(peopleId)) ??
            null;

          this.selectedPassport =
            directPassports[0] ??
            fallbackPassports.find((passport) => passport.peopleId === peopleId || passport.citizenId === peopleId) ??
            null;

          this.selectedAddress =
            directAddresses.find((address) => address.isActive) ??
            directAddresses[0] ??
            fallbackAddresses.find((address) => address.citizenId === peopleId && address.isActive) ??
            fallbackAddresses.find((address) => this.selectedFamily?.id != null && address.familyId === this.selectedFamily.id && address.isActive) ??
            fallbackAddresses.find((address) => address.citizenId === peopleId) ??
            null;
        },
        error: () => {
          this.selectedPassport = null;
          this.selectedAddress = null;
          this.selectedFamily = null;
        },
      });
  }

  private ensureFallbackReferences() {
    if (this.allPassports && this.allAddresses && this.allFamilies) {
      return of({
        passports: this.allPassports,
        addresses: this.allAddresses,
        families: this.allFamilies,
      });
    }

    return forkJoin({
      passports: this.passportRecordsService.getAll().pipe(catchError(() => of([]))),
      addresses: this.addressesService.getAll().pipe(catchError(() => of([]))),
      families: this.addressesService.getFamilies().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ passports, addresses, families }) => {
        this.allPassports = passports;
        this.allAddresses = addresses;
        this.allFamilies = families;
        return { passports, addresses, families };
      }),
    );
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

  private applyCitizenSearchResponse(response: PagedCitizensResponse): void {
    this.citizens = response.items;
    this.citizenTotal = response.total;
    this.citizenPage = response.page;
    this.currentCitizenPageCount = response.shown ?? response.items.length;
    this.hasMoreCitizens = response.hasMore;
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
