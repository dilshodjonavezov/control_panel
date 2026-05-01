import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  SelectComponent,
  SelectOption,
} from '../../../shared/components';
import {
  MaternityRecordsService,
  type ApiCitizen,
  type ApiPerson,
  type CreateMaternityRecordRequest,
} from '../../../services/maternity-records.service';
import { AuthService } from '../../../services/auth.service';
import {
  ApiZagsBirthRecord,
  ZagsBirthRecordsService,
} from '../../../services/zags-birth-records.service';
import { ApiZagsActRecord, ZagsActsService } from '../../../services/zags-acts.service';
import { AddressesService, type ApiFamily } from '../../../services/addresses.service';

type BirthScenario =
  | 'standard'
  | 'outside_marriage'
  | 'unregistered_marriage'
  | 'relative_without_zags'
  | 'guardianship';

export interface BirthRecordCreatePayload extends CreateMaternityRecordRequest {}

@Component({
  selector: 'app-birth-record-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
  ],
  templateUrl: './birth-record-create.component.html',
  styleUrl: './birth-record-create.component.css',
})
export class BirthRecordCreateComponent implements OnChanges, OnInit {
  @Input() initialData: BirthRecordCreatePayload | null = null;
  @Input() submitLabel: string = 'Сохранить';
  @Output() saved = new EventEmitter<BirthRecordCreatePayload>();

  form = this.createDefaultForm();
  errorMessage = '';
  resolvedUserId: number | null = null;
  private people: ApiPerson[] = [];
  private citizens: ApiCitizen[] = [];
  private families: ApiFamily[] = [];
  private zagsRecords: ApiZagsBirthRecord[] = [];
  birthScenarioHint = '';

  fatherOptions: SelectOption[] = [];
  motherOptions: SelectOption[] = [];
  filteredFatherOptions: SelectOption[] = [];
  filteredMotherOptions: SelectOption[] = [];
  selectedFatherCitizenId: number | null = null;
  selectedMotherCitizenId: number | null = null;
  selectedFamilyId: number | null = null;

  parentLinkHint = '';
  private readonly fatherToMothers = new Map<string, Set<string>>();
  private readonly motherToFathers = new Map<string, Set<string>>();
  private readonly normalizedToDisplay = new Map<string, string>();
  private readonly allowedCouples = new Set<string>();

  genderOptions: SelectOption[] = [
    { value: 'M', label: 'Мужской' },
    { value: 'F', label: 'Женский' },
  ];

  birthScenarioOptions: SelectOption[] = [
    { value: 'standard', label: 'Обычный брак' },
    { value: 'outside_marriage', label: 'Ребёнок вне брака' },
    { value: 'unregistered_marriage', label: 'Незарегистрированный брак' },
    { value: 'relative_without_zags', label: 'Ребёнок родственника без регистрации' },
    { value: 'guardianship', label: 'Опека или опекун' },
  ];

  statusOptions: SelectOption[] = [
    { value: 'DRAFT', label: 'Черновик' },
    { value: 'SUBMITTED_TO_ZAGS', label: 'Отправлено в ЗАГС' },
    { value: 'REJECTED', label: 'Отклонено' },
    { value: 'ARCHIVED', label: 'Архив' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly maternityRecordsService: MaternityRecordsService,
    private readonly zagsBirthRecordsService: ZagsBirthRecordsService,
    private readonly zagsActsService: ZagsActsService,
    private readonly addressesService: AddressesService,
  ) {}

  ngOnInit(): void {
    this.resolveCurrentUserId();
    this.loadPeople();
    this.loadCitizens();
    this.loadFamilies();
    this.loadStatuses();
    this.loadParentLinks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData']) {
      this.applyInitialData();
    }
  }

  refreshLookups(): void {
    this.loadPeople();
    this.loadParentLinks();
  }

  submit(): void {
    const userId = this.resolvedUserId;
    const birthWeight = Number(this.form.birthWeight);
    const fatherFullName = this.form.fatherFullName.trim();
    const motherFullName = this.form.motherFullName.trim();

    if (userId === null || !Number.isInteger(userId) || userId <= 0) {
      this.errorMessage = 'Не удалось определить текущего пользователя.';
      return;
    }

    if (!this.form.birthDateTime) {
      this.errorMessage = 'Укажите дату и время рождения.';
      return;
    }

    if (!this.form.placeOfBirth.trim()) {
      this.errorMessage = 'Укажите место рождения.';
      return;
    }

    if (!motherFullName) {
      this.errorMessage = 'Укажите ФИО матери.';
      return;
    }

    if (!Number.isFinite(birthWeight) || birthWeight <= 0) {
      this.errorMessage = 'Укажите корректный вес при рождении.';
      return;
    }

    const fatherPersonId =
      this.initialData?.fatherPersonId ?? this.resolveFatherPersonId(this.form.fatherFullName);

    this.errorMessage = '';

    const payload: BirthRecordCreatePayload = {
      userId,
      birthDateTime: new Date(this.form.birthDateTime).toISOString(),
      placeOfBirth: this.form.placeOfBirth.trim(),
      gender: this.form.gender as BirthRecordCreatePayload['gender'],
      childFullName: this.form.childFullName.trim() || null,
      fatherFullName: fatherFullName || null,
      motherFullName: motherFullName || null,
      birthCaseType: this.mapBirthScenarioToCaseType(this.form.birthScenario as BirthScenario),
      birthWeight,
      status: this.form.status as BirthRecordCreatePayload['status'],
      comment: this.form.comment.trim(),
    };

    if (fatherFullName && fatherPersonId && fatherPersonId > 0) {
      payload.fatherPersonId = fatherPersonId;
    }
    if (this.selectedMotherCitizenId && this.selectedMotherCitizenId > 0) {
      payload.motherCitizenId = this.selectedMotherCitizenId;
    }
    if (this.selectedFamilyId && this.selectedFamilyId > 0) {
      payload.familyId = this.selectedFamilyId;
    }

    if (fatherFullName && motherFullName) {
      this.ensureParentLink(
        fatherFullName,
        motherFullName,
        this.isAllowedZagsCouple(fatherFullName, motherFullName),
      );
    }

    this.saved.emit(payload);
  }

  onFatherSelected(value: string | number | null): void {
    if (typeof value !== 'string') {
      return;
    }

    this.form.fatherFullName = value;
    this.syncSelectedParents();
    this.filterMothersByFather();
  }

  onMotherSelected(value: string | number | null): void {
    if (typeof value !== 'string') {
      return;
    }

    this.form.motherFullName = value;
    this.syncSelectedParents();
    this.filterFathersByMother();
  }

  onFatherNameManualChange(): void {
    this.syncSelectedParents();
    this.filterMothersByFather();
  }

  onMotherNameManualChange(): void {
    this.syncSelectedParents();
    this.filterFathersByMother();
  }

  onBirthScenarioChange(value: string | number | null): void {
    if (typeof value !== 'string') {
      return;
    }

    this.form.birthScenario = value as BirthScenario;
    this.birthScenarioHint = this.getBirthScenarioHint(this.form.birthScenario as BirthScenario);
    this.filterMothersByFather();
    this.filterFathersByMother();

    if (this.form.birthScenario === 'outside_marriage' && !this.form.fatherFullName.trim()) {
      this.parentLinkHint = this.birthScenarioHint;
    }
  }

  private applyInitialData(): void {
    if (!this.initialData) {
      this.form = this.createDefaultForm();
      this.errorMessage = '';
      this.parentLinkHint = '';
      this.birthScenarioHint = this.getBirthScenarioHint(this.form.birthScenario as BirthScenario);
      this.filteredFatherOptions = [...this.fatherOptions];
      this.filteredMotherOptions = [...this.motherOptions];
      this.selectedFatherCitizenId = null;
      this.selectedMotherCitizenId = null;
      this.selectedFamilyId = null;
      return;
    }

    this.form = {
      birthDateTime: this.toDateTimeLocal(this.initialData.birthDateTime),
      placeOfBirth: this.initialData.placeOfBirth || '',
      gender: this.initialData.gender,
      childFullName: this.initialData.childFullName || '',
      fatherFullName: this.initialData.fatherFullName || '',
      motherFullName: this.initialData.motherFullName || '',
      birthWeight: this.initialData.birthWeight.toString(),
      status: this.initialData.status,
      comment: this.initialData.comment || '',
      birthScenario: this.inferBirthScenario(this.initialData),
    };
    this.resolvedUserId = this.initialData.userId;
    this.errorMessage = '';
    this.birthScenarioHint = this.getBirthScenarioHint(this.form.birthScenario as BirthScenario);
    this.filterMothersByFather();
    this.filterFathersByMother();
    this.syncSelectedParents();
    if (this.form.birthScenario === 'outside_marriage' && !this.form.fatherFullName.trim()) {
      this.parentLinkHint = this.birthScenarioHint;
    }
  }

  private createDefaultForm() {
    return {
      birthDateTime: '',
      placeOfBirth: '',
      gender: 'M',
      childFullName: '',
      fatherFullName: '',
      motherFullName: '',
      birthWeight: '',
      status: 'DRAFT',
      birthScenario: 'standard',
      comment: '',
    };
  }

  private loadStatuses(): void {
    const statusLabels: Record<string, string> = {
      DRAFT: 'Черновик',
      SUBMITTED_TO_ZAGS: 'Отправлено в ЗАГС',
      REJECTED: 'Отклонено',
      ARCHIVED: 'Архив',
      Черновик: 'Черновик',
      'Отправлен в ЗАГС': 'Отправлено в ЗАГС',
      Зарегистрирован: 'Зарегистрировано в ЗАГС',
      Отклонено: 'Отклонено',
      Архив: 'Архив',
    };

    this.maternityRecordsService
      .getMaternityStatuses()
      .pipe(catchError(() => of(['DRAFT', 'SUBMITTED_TO_ZAGS', 'REJECTED', 'ARCHIVED'])))
      .subscribe((statuses) => {
        const allowedStatuses = statuses.filter((status) => status !== 'REGISTERED_BY_ZAGS');

        this.statusOptions = allowedStatuses.map((status) => ({
          value: status,
          label: statusLabels[status] ?? status,
        }));

        const normalizedStatuses = allowedStatuses.map((status) => statusLabels[status] ?? status);
        if (this.form.status === 'REGISTERED_BY_ZAGS') {
          this.form.status = allowedStatuses[0] ?? 'DRAFT';
        }

        if (!normalizedStatuses.includes(statusLabels[this.form.status] ?? this.form.status)) {
          this.form.status = allowedStatuses[0] ?? 'DRAFT';
        }
      });
  }

  private resolveCurrentUserId(): void {
    if (this.initialData?.userId) {
      this.resolvedUserId = this.initialData.userId;
      return;
    }

    this.resolvedUserId = this.authService.resolveCurrentUserId();
  }

  private loadPeople(): void {
    this.maternityRecordsService.getPeople().subscribe({
      next: (people) => {
        this.people = people;
      },
      error: () => {
        this.people = [];
      },
    });
  }

  private loadCitizens(): void {
    this.maternityRecordsService.getCitizens().subscribe({
      next: (citizens) => {
        this.citizens = citizens;
        this.buildCitizenOptions();
        this.syncSelectedParents();
      },
      error: () => {
        this.citizens = [];
      },
    });
  }

  private loadFamilies(): void {
    this.addressesService.getFamilies().subscribe({
      next: (families) => {
        this.families = families;
        this.syncSelectedParents();
      },
      error: () => {
        this.families = [];
      },
    });
  }

  private loadParentLinks(): void {
    this.zagsBirthRecordsService
      .getAll()
      .pipe(catchError(() => of([] as ApiZagsBirthRecord[])))
      .subscribe((records) => {
        this.zagsRecords = records;
        this.applyParentRecords(this.zagsRecords);
      });

    this.zagsActsService
      .getAll()
      .pipe(catchError(() => of([] as ApiZagsActRecord[])))
      .subscribe((records) => {
        this.applyMarriageRecords(records);
      });
  }

  private linkParents(fatherName: string, motherName: string): void {
    const fatherNorm = this.normalizeName(fatherName);
    const motherNorm = this.normalizeName(motherName);
    if (!fatherNorm || !motherNorm) {
      return;
    }

    this.normalizedToDisplay.set(fatherNorm, fatherName.trim());
    this.normalizedToDisplay.set(motherNorm, motherName.trim());

    const mothers = this.fatherToMothers.get(fatherNorm) ?? new Set<string>();
    mothers.add(motherNorm);
    this.fatherToMothers.set(fatherNorm, mothers);

    const fathers = this.motherToFathers.get(motherNorm) ?? new Set<string>();
    fathers.add(fatherNorm);
    this.motherToFathers.set(motherNorm, fathers);

    this.allowedCouples.add(this.buildCoupleKey(fatherNorm, motherNorm));
  }

  private filterMothersByFather(): void {
    const fatherNorm = this.normalizeName(this.form.fatherFullName);
    if (!fatherNorm || !this.fatherToMothers.has(fatherNorm)) {
      this.filteredMotherOptions = [...this.motherOptions];
      this.parentLinkHint = this.buildManualLinkHint();
      return;
    }

    const linkedMothers = this.fatherToMothers.get(fatherNorm) ?? new Set<string>();
    const linkedMotherNames = Array.from(linkedMothers)
      .map((norm) => this.normalizedToDisplay.get(norm) || norm)
      .filter((name) => name.length > 0)
      .sort((a, b) => a.localeCompare(b, 'ru'));

    const linkedSet = new Set(linkedMotherNames);
    this.filteredMotherOptions = this.motherOptions.filter((option) =>
      linkedSet.has(option.value as string),
    );

    if (this.form.motherFullName && !linkedSet.has(this.form.motherFullName)) {
      this.form.motherFullName = linkedMotherNames[0] || this.form.motherFullName;
    }

    this.parentLinkHint =
      linkedMotherNames.length > 0
        ? `Для выбранного отца найдено ${linkedMotherNames.length} связей с матерью(ями).`
        : this.buildManualLinkHint();
  }

  private filterFathersByMother(): void {
    const motherNorm = this.normalizeName(this.form.motherFullName);
    if (!motherNorm || !this.motherToFathers.has(motherNorm)) {
      this.filteredFatherOptions = [...this.fatherOptions];
      if (!this.normalizeName(this.form.fatherFullName)) {
        this.parentLinkHint = this.buildManualLinkHint();
      }
      return;
    }

    const linkedFathers = this.motherToFathers.get(motherNorm) ?? new Set<string>();
    const linkedFatherNames = Array.from(linkedFathers)
      .map((norm) => this.normalizedToDisplay.get(norm) || norm)
      .filter((name) => name.length > 0)
      .sort((a, b) => a.localeCompare(b, 'ru'));

    const linkedSet = new Set(linkedFatherNames);
    this.filteredFatherOptions = this.fatherOptions.filter((option) =>
      linkedSet.has(option.value as string),
    );

    if (this.form.fatherFullName && !linkedSet.has(this.form.fatherFullName)) {
      this.form.fatherFullName = linkedFatherNames[0] || this.form.fatherFullName;
    }

    if (!this.parentLinkHint && linkedFatherNames.length > 0) {
      this.parentLinkHint = `Для выбранной матери найдено ${linkedFatherNames.length} связей с отцом(ами).`;
    }
  }

  private resolveFatherPersonId(fatherFullName: string): number | null {
    const normalizedFatherName = this.normalizeName(fatherFullName);
    if (!normalizedFatherName) {
      return null;
    }

    const matched = this.people.find(
      (person) => this.normalizeName(person.fullName) === normalizedFatherName,
    );
    if (matched?.id) {
      return matched.id;
    }

    const linkedZagsRecord = this.zagsRecords.find(
      (record) =>
        this.normalizeName(record.fatherFullName) === normalizedFatherName &&
        !!(record.fatherPersonId ?? record.peopleId),
    );

    return linkedZagsRecord?.fatherPersonId ?? linkedZagsRecord?.peopleId ?? null;
  }

  private syncSelectedParents(): void {
    const father = this.findCitizenByName(this.form.fatherFullName);
    const mother = this.findCitizenByName(this.form.motherFullName);

    this.selectedFatherCitizenId = father?.id ?? null;
    this.selectedMotherCitizenId = mother?.id ?? null;
    this.selectedFamilyId = this.resolveFamilyId(father?.id ?? null, mother?.id ?? null);
  }

  private isAllowedZagsCouple(fatherFullName: string, motherFullName: string): boolean {
    const fatherNorm = this.normalizeName(fatherFullName);
    const motherNorm = this.normalizeName(motherFullName);
    if (!fatherNorm || !motherNorm || this.allowedCouples.size === 0) {
      return false;
    }

    return this.allowedCouples.has(this.buildCoupleKey(fatherNorm, motherNorm));
  }

  private buildCoupleKey(fatherNorm: string, motherNorm: string): string {
    return `${fatherNorm}::${motherNorm}`;
  }

  private ensureParentLink(fatherFullName: string, motherFullName: string, hadExistingLink: boolean): void {
    this.linkParents(fatherFullName, motherFullName);

    if (!this.fatherOptions.some((option) => option.value === fatherFullName)) {
      this.fatherOptions = [...this.fatherOptions, { value: fatherFullName, label: fatherFullName }]
        .sort((a, b) => `${a.label}`.localeCompare(`${b.label}`, 'ru'));
    }

    if (!this.motherOptions.some((option) => option.value === motherFullName)) {
      this.motherOptions = [...this.motherOptions, { value: motherFullName, label: motherFullName }]
        .sort((a, b) => `${a.label}`.localeCompare(`${b.label}`, 'ru'));
    }

    this.filterMothersByFather();
    this.filterFathersByMother();

    if (!hadExistingLink) {
      this.parentLinkHint = 'Связка родителей сохранена локально. Запись можно регистрировать дальше в ЗАГС.';
    }
  }

  private buildManualLinkHint(): string {
    const hasFather = this.normalizeName(this.form.fatherFullName).length > 0;
    const hasMother = this.normalizeName(this.form.motherFullName).length > 0;

    if (hasFather && hasMother) {
      return 'Пара родителей будет связана локально после сохранения записи.';
    }

    return '';
  }

  private getBirthScenarioHint(scenario: BirthScenario): string {
    const hints: Record<BirthScenario, string> = {
      standard: 'Обычный брак: укажите обоих родителей, если они известны.',
      outside_marriage: 'Ребёнок вне брака: укажите мать, отец может отсутствовать.',
      unregistered_marriage: 'Незарегистрированный брак: можно сохранить обоих родителей без акта ЗАГС.',
      relative_without_zags: 'Ребёнок родственника без регистрации: допускается неполный набор родителей.',
      guardianship: 'Опека или опекун: можно указать только доступных законных представителей.',
    };

    return hints[scenario];
  }

  private mapBirthScenarioToCaseType(scenario: BirthScenario): string {
    const mapped: Record<BirthScenario, string> = {
      standard: 'STANDARD_MARRIAGE',
      outside_marriage: 'OUT_OF_WEDLOCK',
      unregistered_marriage: 'UNREGISTERED_MARRIAGE',
      relative_without_zags: 'RELATIVE_WITHOUT_ZAGS',
      guardianship: 'GUARDIANSHIP',
    };

    return mapped[scenario];
  }

  private inferBirthScenario(data: BirthRecordCreatePayload): BirthScenario {
    if (!data.fatherFullName?.trim() && data.motherFullName?.trim()) {
      return 'outside_marriage';
    }

    return 'standard';
  }

  private isFatherRequired(scenario: BirthScenario): boolean {
    return false;
  }

  private toDateTimeLocal(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private normalizeName(value: string | null): string {
    return (value || '').toLowerCase().replace(/\s+/g, ' ').replace(/[.,]/g, '').trim();
  }

  private applyParentRecords(records: ApiZagsBirthRecord[]): void {
    this.fatherToMothers.clear();
    this.motherToFathers.clear();
    this.normalizedToDisplay.clear();
    this.allowedCouples.clear();

    const fathers = new Set<string>();
    const mothers = new Set<string>();

    records.forEach((record) => {
      const father = record.fatherFullName?.trim() || '';
      const mother = record.motherFullName?.trim() || '';
      if (father) {
        fathers.add(father);
      }
      if (mother) {
        mothers.add(mother);
      }
      this.linkParents(father, mother);
    });

    this.fatherOptions = Array.from(fathers)
      .sort((a, b) => a.localeCompare(b, 'ru'))
      .map((name) => ({ value: name, label: name }));
    this.motherOptions = Array.from(mothers)
      .sort((a, b) => a.localeCompare(b, 'ru'))
      .map((name) => ({ value: name, label: name }));

    this.filteredFatherOptions = [...this.fatherOptions];
    this.filteredMotherOptions = [...this.motherOptions];

    this.filterMothersByFather();
    this.filterFathersByMother();
    this.buildCitizenOptions();
  }

  private applyMarriageRecords(records: ApiZagsActRecord[]): void {
    const fathers = new Set<string>(this.fatherOptions.map((option) => `${option.value}`));
    const mothers = new Set<string>(this.motherOptions.map((option) => `${option.value}`));

    records
      .filter((record) => record.actType === 'MARRIAGE')
      .forEach((record) => {
        const spouseOne = record.marriageDetails?.spouseOneFullName?.trim() || '';
        const spouseTwo = record.marriageDetails?.spouseTwoFullName?.trim() || '';
        if (!spouseOne || !spouseTwo) {
          return;
        }

        fathers.add(spouseOne);
        mothers.add(spouseTwo);
        this.linkParents(spouseOne, spouseTwo);
      });

    this.fatherOptions = Array.from(fathers)
      .sort((a, b) => a.localeCompare(b, 'ru'))
      .map((name) => ({ value: name, label: name }));
    this.motherOptions = Array.from(mothers)
      .sort((a, b) => a.localeCompare(b, 'ru'))
      .map((name) => ({ value: name, label: name }));

    this.filteredFatherOptions = [...this.fatherOptions];
    this.filteredMotherOptions = [...this.motherOptions];

    this.filterMothersByFather();
    this.filterFathersByMother();
    this.buildCitizenOptions();
  }

  private buildCitizenOptions(): void {
    const fathers = this.citizens
      .filter((citizen) => citizen.gender?.toUpperCase() === 'MALE')
      .map((citizen) => ({ value: citizen.fullName, label: citizen.fullName }));
    const mothers = this.citizens
      .filter((citizen) => citizen.gender?.toUpperCase() === 'FEMALE')
      .map((citizen) => ({ value: citizen.fullName, label: citizen.fullName }));

    const mergedFathers = new Map<string, SelectOption>();
    [...fathers, ...this.fatherOptions].forEach((option) => {
      const key = String(option.value).trim();
      if (key) {
        mergedFathers.set(key, { value: key, label: String(option.label) });
      }
    });

    const mergedMothers = new Map<string, SelectOption>();
    [...mothers, ...this.motherOptions].forEach((option) => {
      const key = String(option.value).trim();
      if (key) {
        mergedMothers.set(key, { value: key, label: String(option.label) });
      }
    });

    this.fatherOptions = Array.from(mergedFathers.values()).sort((a, b) => a.label.localeCompare(b.label, 'ru'));
    this.motherOptions = Array.from(mergedMothers.values()).sort((a, b) => a.label.localeCompare(b.label, 'ru'));
    this.filteredFatherOptions = [...this.fatherOptions];
    this.filteredMotherOptions = [...this.motherOptions];
  }

  private findCitizenByName(fullName: string): ApiCitizen | null {
    const normalized = this.normalizeName(fullName);
    if (!normalized) {
      return null;
    }

    return this.citizens.find((citizen) => this.normalizeName(citizen.fullName) === normalized) ?? null;
  }

  private resolveFamilyId(fatherCitizenId: number | null, motherCitizenId: number | null): number | null {
    if (!fatherCitizenId && !motherCitizenId) {
      return null;
    }

    const matchedFamily =
      this.families.find((family) =>
        (fatherCitizenId ? family.fatherCitizenId === fatherCitizenId : true) &&
        (motherCitizenId ? family.motherCitizenId === motherCitizenId : true),
      ) ??
      this.families.find((family) =>
        (fatherCitizenId ? family.memberCitizenIds.includes(fatherCitizenId) : false) &&
        (motherCitizenId ? family.memberCitizenIds.includes(motherCitizenId) : false),
      ) ??
      this.families.find((family) => fatherCitizenId !== null && family.fatherCitizenId === fatherCitizenId) ??
      this.families.find((family) => motherCitizenId !== null && family.motherCitizenId === motherCitizenId) ??
      null;

    return matchedFamily?.id ?? null;
  }
}
