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
  type ApiPerson,
  type CreateMaternityRecordRequest,
} from '../../../services/maternity-records.service';
import { AuthService } from '../../../services/auth.service';
import {
  ApiZagsBirthRecord,
  ZagsBirthRecordsService,
} from '../../../services/zags-birth-records.service';

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
  private zagsRecords: ApiZagsBirthRecord[] = [];

  fatherOptions: SelectOption[] = [];
  motherOptions: SelectOption[] = [];
  filteredFatherOptions: SelectOption[] = [];
  filteredMotherOptions: SelectOption[] = [];

  parentLinkHint = '';

  private readonly fatherToMothers = new Map<string, Set<string>>();
  private readonly motherToFathers = new Map<string, Set<string>>();
  private readonly normalizedToDisplay = new Map<string, string>();
  private readonly allowedCouples = new Set<string>();
  private readonly localParentPairs: Array<{ fatherFullName: string; motherFullName: string; fatherPersonId: number }> = [
    {
      fatherFullName: 'Юсуфов Рустам Шарипович',
      motherFullName: 'Юсуфова Парвина Насруллоевна',
      fatherPersonId: 1001,
    },
    {
      fatherFullName: 'Мирзоев Тимур Азизович',
      motherFullName: 'Мирзоева Сарвиноз Рустамовна',
      fatherPersonId: 1002,
    },
    {
      fatherFullName: 'Назаров Исмоил Хасанович',
      motherFullName: 'Назарова Фируза Мирзоевна',
      fatherPersonId: 1003,
    },
    {
      fatherFullName: 'Каримов Абдулло Файзуллоевич',
      motherFullName: 'Каримова Зарина Юсуфовна',
      fatherPersonId: 1004,
    },
    {
      fatherFullName: 'Зоиров Джамшед Саидович',
      motherFullName: 'Зоирова Нилуфар Саидовна',
      fatherPersonId: 1005,
    },
  ];

  genderOptions: SelectOption[] = [
    { value: 'M', label: 'Мужской' },
    { value: 'F', label: 'Женский' },
  ];

  statusOptions: SelectOption[] = [
    { value: 'Черновик', label: 'Черновик' },
    { value: 'Отправлен в ЗАГС', label: 'Отправлен в ЗАГС' },
    { value: 'Зарегистрирован', label: 'Зарегистрирован' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly maternityRecordsService: MaternityRecordsService,
    private readonly zagsBirthRecordsService: ZagsBirthRecordsService,
  ) {}

  ngOnInit(): void {
    this.initializeLocalFallbackData();
    this.resolveCurrentUserId();
    this.loadPeople();
    this.loadStatuses();
    this.loadParentLinks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData']) {
      this.applyInitialData();
    }
  }

  submit(): void {
    const userId = this.resolvedUserId;
    const birthWeight = Number(this.form.birthWeight);

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

    if (!this.form.childFullName.trim()) {
      this.errorMessage = 'Укажите ФИО ребенка.';
      return;
    }

    if (!this.form.fatherFullName.trim()) {
      this.errorMessage = 'Укажите ФИО отца.';
      return;
    }

    if (!this.form.motherFullName.trim()) {
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
      childFullName: this.form.childFullName.trim(),
      fatherFullName: this.form.fatherFullName.trim(),
      motherFullName: this.form.motherFullName.trim(),
      birthWeight,
      status: this.form.status as BirthRecordCreatePayload['status'],
      comment: this.form.comment.trim(),
    };

    if (fatherPersonId && fatherPersonId > 0) {
      payload.fatherPersonId = fatherPersonId;
    }

    this.ensureParentLink(
      payload.fatherFullName,
      payload.motherFullName,
      this.isAllowedZagsCouple(payload.fatherFullName, payload.motherFullName),
    );

    this.saved.emit(payload);
  }

  onFatherSelected(value: string | number | null): void {
    if (typeof value !== 'string') {
      return;
    }

    this.form.fatherFullName = value;
    this.filterMothersByFather();
  }

  onMotherSelected(value: string | number | null): void {
    if (typeof value !== 'string') {
      return;
    }

    this.form.motherFullName = value;
    this.filterFathersByMother();
  }

  onFatherNameManualChange(): void {
    this.filterMothersByFather();
  }

  onMotherNameManualChange(): void {
    this.filterFathersByMother();
  }

  private applyInitialData(): void {
    if (!this.initialData) {
      this.form = this.createDefaultForm();
      this.errorMessage = '';
      this.parentLinkHint = '';
      this.filteredFatherOptions = [...this.fatherOptions];
      this.filteredMotherOptions = [...this.motherOptions];
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
    };
    this.resolvedUserId = this.initialData.userId;
    this.errorMessage = '';
    this.filterMothersByFather();
    this.filterFathersByMother();
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
      status: 'Черновик',
      comment: '',
    };
  }

  private loadStatuses(): void {
    this.maternityRecordsService
      .getMaternityStatuses()
      .pipe(catchError(() => of(['Черновик', 'Отправлен в ЗАГС', 'Зарегистрирован'])))
      .subscribe((statuses) => {
        this.statusOptions = statuses.map((status) => ({ value: status, label: status }));
        if (!statuses.includes(this.form.status)) {
          this.form.status = statuses[0] ?? 'Черновик';
        }
      });
  }

  private resolveCurrentUserId(): void {
    if (this.initialData?.userId) {
      this.resolvedUserId = this.initialData.userId;
      return;
    }

    const username = this.authService.getCurrentUsername();
    if (!username) {
      this.resolvedUserId = null;
      return;
    }

    this.authService.getUsers().subscribe({
      next: (users) => {
        const matched = users.find(
          (user) => user.username.trim().toLowerCase() === username.toLowerCase(),
        );
        this.resolvedUserId = matched?.id ?? this.resolveLocalUserId(username);
      },
      error: () => {
        this.resolvedUserId = this.resolveLocalUserId(username);
      },
    });
  }

  private loadPeople(): void {
    this.maternityRecordsService.getPeople().subscribe({
      next: (people) => {
        this.people = this.mergeLocalPeople(people);
      },
      error: () => {
        this.people = this.getLocalPeople();
      },
    });
  }

  private loadParentLinks(): void {
    this.zagsBirthRecordsService
      .getAll()
      .pipe(catchError(() => of([] as ApiZagsBirthRecord[])))
      .subscribe((records) => {
        this.zagsRecords = records.length > 0 ? records : this.buildFallbackZagsRecords();
        this.applyParentRecords(this.zagsRecords);
      });
  }

  private initializeLocalFallbackData(): void {
    this.people = this.getLocalPeople();
    this.zagsRecords = this.buildFallbackZagsRecords();
    this.applyParentRecords(this.zagsRecords);
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

  private resolveLocalUserId(username: string): number | null {
    const normalized = username.trim().toLowerCase();
    if (normalized === 'admin') {
      return 1;
    }
    if (normalized === 'maternity' || normalized === 'maternity@example.com') {
      return 2;
    }
    if (normalized === 'zags' || normalized === 'zags@example.com') {
      return 3;
    }
    return null;
  }

  private buildFallbackZagsRecords(): ApiZagsBirthRecord[] {
    return this.localParentPairs.map((pair, index) => ({
      id: 9000 + index + 1,
      maternityRecordId: null,
      peopleId: pair.fatherPersonId,
      peopleFullName: pair.fatherFullName,
      userId: 3,
      userName: 'zags',
      actNumber: `LOCAL-${index + 1}`,
      childFullName: null,
      birthDate: null,
      registrationDate: null,
      placeOfRegistration: 'Локальный ЗАГС',
      birthPlace: null,
      fatherFullName: pair.fatherFullName,
      motherFullName: pair.motherFullName,
      fatherPersonId: pair.fatherPersonId,
      status: 'Черновик',
    }));
  }

  private getLocalPeople(): ApiPerson[] {
    return this.localParentPairs.map((pair) => ({
      id: pair.fatherPersonId,
      fullName: pair.fatherFullName,
    }));
  }

  private mergeLocalPeople(people: ApiPerson[]): ApiPerson[] {
    const merged = new Map<number, ApiPerson>();
    people.forEach((person) => {
      if (person.id > 0) {
        merged.set(person.id, person);
      }
    });

    this.getLocalPeople().forEach((person) => {
      if (!merged.has(person.id)) {
        merged.set(person.id, person);
      }
    });

    return Array.from(merged.values());
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
  }
}
