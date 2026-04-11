import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { LocalPersonWorkflowService } from '../../../services/local-person-workflow.service';

interface SchoolRecordItem {
  id: number;
  peopleId: number;
  peopleFullName: string;
  institutionId: number;
  institutionName: string;
  classNumber: number;
  status: 'Учится' | 'Закончил' | 'Отчислен';
  admissionDate: string;
  admissionDateRaw: string;
  graduationDate: string;
  expulsionDate: string;
  isStudying: 'Да' | 'Нет';
  userName: string;
  comment: string;
}

interface SchoolRecordForm {
  fatherFullName: string;
  motherFullName: string;
  maternityRecordId: string;
  institutionId: string;
  classNumber: string;
  status: 'Учится' | 'Закончил' | 'Отчислен';
  admissionDate: string;
}

interface LocalMaternityItem {
  id: number;
  fatherFullName: string;
  motherFullName: string;
  childFullName: string;
}

@Component({
  selector: 'app-school-study-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, SelectComponent, ButtonComponent, ModalComponent],
  templateUrl: './school-study-list.component.html',
  styleUrl: './school-study-list.component.css',
})
export class SchoolStudyListComponent implements OnInit {
  private readonly localRecordsKey = 'local_school_records_v1';
  private readonly localMaternityKey = 'local_maternity_seed_v1';

  filters = {
    fullName: '',
    classNumber: '',
  };

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'peopleFullName', label: 'ФИО', sortable: true },
    { key: 'institutionName', label: 'Учреждение', sortable: true },
    { key: 'classNumber', label: 'Класс', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'admissionDate', label: 'Поступление', sortable: true },
    { key: 'graduationDate', label: 'Окончание', sortable: true },
    { key: 'expulsionDate', label: 'Отчисление', sortable: true },
    { key: 'isStudying', label: 'Обучается', sortable: true },
    { key: 'userName', label: 'Пользователь', sortable: true },
    { key: 'comment', label: 'Комментарий', sortable: false },
  ];

  records: SchoolRecordItem[] = [];

  institutionOptions: SelectOption[] = [];
  fatherOptions: SelectOption[] = [];
  motherOptions: SelectOption[] = [];
  filteredFatherOptions: SelectOption[] = [];
  filteredMotherOptions: SelectOption[] = [];
  childOptions: SelectOption[] = [];
  statusOptions: SelectOption[] = [
    { value: 'Учится', label: 'Учится' },
    { value: 'Закончил', label: 'Закончил' },
    { value: 'Отчислен', label: 'Отчислен' },
  ];

  private maternityById = new Map<number, LocalMaternityItem>();
  private institutionsById = new Map<number, string>();

  private readonly fatherToMothers = new Map<string, Set<string>>();
  private readonly motherToFathers = new Map<string, Set<string>>();
  private readonly normalizedToDisplay = new Map<string, string>();

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  isEditMode = false;
  editingRecordId: number | null = null;
  isFormSubmitting = false;
  formErrorMessage = '';
  parentLinkHint = '';

  selectedFatherFullName = '';
  selectedMotherFullName = '';
  selectedChildFullName = '';

  formData: SchoolRecordForm = this.createDefaultForm();

  showDeleteModal = false;
  deletingRecord: SchoolRecordItem | null = null;
  isDeleting = false;
  deleteErrorMessage = '';

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly workflowService: LocalPersonWorkflowService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  get filteredRecords(): SchoolRecordItem[] {
    const byName = this.filters.fullName.trim().toLowerCase();
    const byClass = this.filters.classNumber.trim().toLowerCase();

    return this.records.filter((record) => {
      const matchesName = !byName || record.peopleFullName.toLowerCase().includes(byName);
      const matchesClass = !byClass || record.classNumber.toString().toLowerCase().includes(byClass);
      return matchesName && matchesClass;
    });
  }

  get formModalTitle(): string {
    return this.isEditMode ? 'Изменить запись обучения' : 'Добавить запись обучения';
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.prepareInstitutionOptions();
    this.prepareFamilyOptions(this.loadLocalMaternitySeed());
    this.records = this.loadLocalRecords();

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingRecordId = null;
    this.formData = this.createDefaultForm();
    this.formErrorMessage = '';
    this.clearSelectedChildInfo();
    this.filteredFatherOptions = [...this.fatherOptions];
    this.filteredMotherOptions = [...this.motherOptions];
    this.applyParentFilters();
    this.showFormModal = true;
  }

  openEdit(row: SchoolRecordItem): void {
    this.isEditMode = true;
    this.editingRecordId = row.id;
    this.formData = {
      fatherFullName: '',
      motherFullName: '',
      maternityRecordId: '',
      institutionId: row.institutionId.toString(),
      classNumber: row.classNumber.toString(),
      status: row.status,
      admissionDate: row.admissionDateRaw,
    };

    this.formErrorMessage = '';
    this.clearSelectedChildInfo();
    this.filteredFatherOptions = [...this.fatherOptions];
    this.filteredMotherOptions = [...this.motherOptions];

    const childNorm = this.normalizeName(row.peopleFullName);
    const match = Array.from(this.maternityById.values()).find((item) => this.normalizeName(item.childFullName) === childNorm);
    if (match) {
      this.formData.fatherFullName = match.fatherFullName;
      this.formData.motherFullName = match.motherFullName;
      this.applyParentFilters();
      this.formData.maternityRecordId = match.id.toString();
      this.onChildSelected(match.id.toString());
    } else {
      this.applyParentFilters();
    }

    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (this.isFormSubmitting) {
      return;
    }
    this.showFormModal = false;
  }

  onFatherSelected(value: string | number | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.formData.fatherFullName = value;
    this.applyParentFilters();
  }

  onMotherSelected(value: string | number | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.formData.motherFullName = value;
    this.applyParentFilters();
  }

  onChildSelected(value: string | number | null): void {
    const maternityRecordId = Number(value);
    if (!Number.isInteger(maternityRecordId) || maternityRecordId <= 0) {
      this.clearSelectedChildInfo();
      return;
    }

    this.formData.maternityRecordId = maternityRecordId.toString();
    const item = this.maternityById.get(maternityRecordId);
    if (!item) {
      this.clearSelectedChildInfo();
      return;
    }

    this.selectedFatherFullName = item.fatherFullName || '-';
    this.selectedMotherFullName = item.motherFullName || '-';
    this.selectedChildFullName = item.childFullName || '-';
    this.formData.fatherFullName = item.fatherFullName;
    this.formData.motherFullName = item.motherFullName;
    this.applyParentFilters();
  }

  saveForm(): void {
    const draft = this.buildLocalRecordDraft();
    if (!draft) {
      return;
    }

    this.isFormSubmitting = true;
    this.formErrorMessage = '';

    if (this.isEditMode && this.editingRecordId) {
      this.records = this.records.map((item) =>
        item.id === this.editingRecordId
          ? {
              ...item,
              peopleId: draft.peopleId,
              peopleFullName: draft.peopleFullName,
              institutionId: draft.institutionId,
              institutionName: draft.institutionName,
              classNumber: draft.classNumber,
              status: draft.status,
              isStudying: draft.status === 'Учится' ? 'Да' : 'Нет',
              admissionDate: draft.admissionDate,
              admissionDateRaw: draft.admissionDateRaw,
              comment: draft.comment,
            }
          : item,
      );
    } else {
      const nextId = this.records.length > 0 ? Math.max(...this.records.map((item) => item.id)) + 1 : 1;
      this.records = [
        {
          id: nextId,
          peopleId: draft.peopleId,
          peopleFullName: draft.peopleFullName,
          institutionId: draft.institutionId,
          institutionName: draft.institutionName,
          classNumber: draft.classNumber,
          status: draft.status,
          admissionDate: draft.admissionDate,
          admissionDateRaw: draft.admissionDateRaw,
          graduationDate: '-',
          expulsionDate: '-',
          isStudying: draft.status === 'Учится' ? 'Да' : 'Нет',
          userName: 'schoolemployee',
          comment: draft.comment,
        },
        ...this.records,
      ];
    }

    this.persistLocalRecords();
    this.workflowService.linkPersonIdToName(draft.peopleId, draft.peopleFullName);
    this.workflowService.applySchoolStatus(draft.peopleFullName, draft.status);

    this.isFormSubmitting = false;
    this.showFormModal = false;
    this.cdr.detectChanges();
  }

  openDelete(row: SchoolRecordItem): void {
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

    this.records = this.records.filter((item) => item.id !== this.deletingRecord!.id);
    this.persistLocalRecords();

    this.isDeleting = false;
    this.showDeleteModal = false;
    this.deletingRecord = null;
    this.cdr.detectChanges();
  }

  private buildLocalRecordDraft(): {
    peopleId: number;
    peopleFullName: string;
    institutionId: number;
    institutionName: string;
    classNumber: number;
    status: 'Учится' | 'Закончил' | 'Отчислен';
    admissionDate: string;
    admissionDateRaw: string;
    comment: string;
  } | null {
    const maternityId = Number(this.formData.maternityRecordId);
    if (!Number.isInteger(maternityId) || maternityId <= 0) {
      this.formErrorMessage = 'Выберите ребенка.';
      return null;
    }

    const child = this.maternityById.get(maternityId);
    if (!child) {
      this.formErrorMessage = 'Не найдена выбранная запись ребенка.';
      return null;
    }

    const institutionId = Number(this.formData.institutionId);
    if (!Number.isInteger(institutionId) || institutionId <= 0) {
      this.formErrorMessage = 'Выберите школу.';
      return null;
    }

    const classNumber = Number(this.formData.classNumber);
    if (!Number.isInteger(classNumber) || classNumber <= 0) {
      this.formErrorMessage = 'Укажите корректный класс.';
      return null;
    }

    if (!this.formData.admissionDate) {
      this.formErrorMessage = 'Укажите дату зачисления.';
      return null;
    }

    if (!this.formData.status) {
      this.formErrorMessage = 'Выберите статус.';
      return null;
    }

    const peopleFullName = child.childFullName;
    const peopleId = maternityId;
    const institutionName = this.institutionsById.get(institutionId) || `ID ${institutionId}`;

    return {
      peopleId,
      peopleFullName,
      institutionId,
      institutionName,
      classNumber,
      status: this.formData.status,
      admissionDate: this.formatDateTime(this.toIsoDateTime(this.formData.admissionDate)),
      admissionDateRaw: this.normalizeDateTimeInput(this.toIsoDateTime(this.formData.admissionDate)),
      comment: `${peopleFullName}`,
    };
  }

  private prepareInstitutionOptions(): void {
    this.institutionsById.clear();

    const localSchools: Array<{ id: number; name: string }> = [
      { id: 1, name: 'Школа №1, г. Душанбе' },
      { id: 2, name: 'Школа №21, г. Худжанд' },
      { id: 3, name: 'Лицей №3, г. Душанбе' },
    ];

    localSchools.forEach((item) => this.institutionsById.set(item.id, item.name));

    this.institutionOptions = localSchools.map((item) => ({ value: item.id.toString(), label: item.name }));
  }

  private prepareFamilyOptions(maternityItems: LocalMaternityItem[]): void {
    this.maternityById.clear();
    this.fatherToMothers.clear();
    this.motherToFathers.clear();
    this.normalizedToDisplay.clear();

    const fathers = new Set<string>();
    const mothers = new Set<string>();

    maternityItems.forEach((item) => {
      this.maternityById.set(item.id, item);

      if (item.fatherFullName) {
        fathers.add(item.fatherFullName);
      }
      if (item.motherFullName) {
        mothers.add(item.motherFullName);
      }

      this.linkParents(item.fatherFullName, item.motherFullName);
    });

    this.fatherOptions = Array.from(fathers)
      .sort((a, b) => a.localeCompare(b, 'ru'))
      .map((name) => ({ value: name, label: name }));

    this.motherOptions = Array.from(mothers)
      .sort((a, b) => a.localeCompare(b, 'ru'))
      .map((name) => ({ value: name, label: name }));

    this.filteredFatherOptions = [...this.fatherOptions];
    this.filteredMotherOptions = [...this.motherOptions];
    this.applyParentFilters();
  }

  private applyParentFilters(): void {
    const fatherNorm = this.normalizeName(this.formData.fatherFullName);
    const motherNorm = this.normalizeName(this.formData.motherFullName);

    if (fatherNorm && this.fatherToMothers.has(fatherNorm)) {
      const linkedMothers = this.fatherToMothers.get(fatherNorm) ?? new Set<string>();
      const motherNames = Array.from(linkedMothers).map((n) => this.normalizedToDisplay.get(n) || n);
      const motherSet = new Set(motherNames);
      this.filteredMotherOptions = this.motherOptions.filter((option) => motherSet.has(option.value as string));
      this.parentLinkHint = `Для выбранного отца найдено ${motherNames.length} связей с матерью(ями).`;
    } else {
      this.filteredMotherOptions = [...this.motherOptions];
      this.parentLinkHint = '';
    }

    if (motherNorm && this.motherToFathers.has(motherNorm)) {
      const linkedFathers = this.motherToFathers.get(motherNorm) ?? new Set<string>();
      const fatherNames = Array.from(linkedFathers).map((n) => this.normalizedToDisplay.get(n) || n);
      const fatherSet = new Set(fatherNames);
      this.filteredFatherOptions = this.fatherOptions.filter((option) => fatherSet.has(option.value as string));
      if (!this.parentLinkHint) {
        this.parentLinkHint = `Для выбранной матери найдено ${fatherNames.length} связей с отцом(ами).`;
      }
    } else {
      this.filteredFatherOptions = [...this.fatherOptions];
    }

    this.childOptions = Array.from(this.maternityById.values())
      .filter((item) => this.matchesParents(item, fatherNorm, motherNorm))
      .sort((a, b) => b.id - a.id)
      .map((item) => ({
        value: item.id.toString(),
        label: item.childFullName,
      }));

    if (this.formData.maternityRecordId) {
      const selectedExists = this.childOptions.some((opt) => opt.value === this.formData.maternityRecordId);
      if (!selectedExists) {
        this.formData.maternityRecordId = '';
        this.clearSelectedChildInfo();
      }
    }
  }

  private linkParents(fatherName: string, motherName: string): void {
    const fatherNorm = this.normalizeName(fatherName);
    const motherNorm = this.normalizeName(motherName);
    if (!fatherNorm || !motherNorm) {
      return;
    }

    this.normalizedToDisplay.set(fatherNorm, fatherName);
    this.normalizedToDisplay.set(motherNorm, motherName);

    const mothers = this.fatherToMothers.get(fatherNorm) ?? new Set<string>();
    mothers.add(motherNorm);
    this.fatherToMothers.set(fatherNorm, mothers);

    const fathers = this.motherToFathers.get(motherNorm) ?? new Set<string>();
    fathers.add(fatherNorm);
    this.motherToFathers.set(motherNorm, fathers);
  }

  private matchesParents(item: LocalMaternityItem, fatherNorm: string, motherNorm: string): boolean {
    const itemFather = this.normalizeName(item.fatherFullName);
    const itemMother = this.normalizeName(item.motherFullName);

    if (fatherNorm && itemFather !== fatherNorm) {
      return false;
    }
    if (motherNorm && itemMother !== motherNorm) {
      return false;
    }
    return true;
  }

  private loadLocalMaternitySeed(): LocalMaternityItem[] {
    const seeded: LocalMaternityItem[] = [
      { id: 8, fatherFullName: 'Юсуфов Рустам Шарипович', motherFullName: 'Юсуфова Парвина Насруллоевна', childFullName: 'Юсуфова Мехрона Рустамовна' },
      { id: 9, fatherFullName: 'Мирзоев Тимур Азизович', motherFullName: 'Мирзоева Сарвиноз Рустамовна', childFullName: 'Мирзоев Камрон Тимурович' },
      { id: 11, fatherFullName: 'Мирзоев Тимур Азизович', motherFullName: 'Мирзоева Сарвиноз Рустамовна', childFullName: 'Мирзоева Сабрина Тимуровна' },
      { id: 12, fatherFullName: 'Назаров Исмоил Хасанович', motherFullName: 'Назарова Фируза Мирзоевна', childFullName: 'Назаров Саид Исмоилович' },
      { id: 13, fatherFullName: 'Назаров Исмоил Хасанович', motherFullName: 'Назарова Фируза Мирзоевна', childFullName: 'Назарова Мадина Исмоиловна' },
      { id: 14, fatherFullName: 'Каримов Абдулло Файзуллоевич', motherFullName: 'Каримова Зарина Юсуфовна', childFullName: 'Каримов Фирдавс Абдуллоевич' },
      { id: 15, fatherFullName: 'Каримов Абдулло Файзуллоевич', motherFullName: 'Каримова Зарина Юсуфовна', childFullName: 'Каримова Нилуфар Абдуллоевна' },
      { id: 16, fatherFullName: 'Зоиров Джамшед Саидович', motherFullName: 'Зоирова Нилуфар Саидовна', childFullName: 'Зоиров Беҳруз Джамшедович' },
      { id: 17, fatherFullName: 'Зоиров Джамшед Саидович', motherFullName: 'Зоирова Нилуфар Саидовна', childFullName: 'Зоирова Шабнам Джамшедовна' },
      { id: 18, fatherFullName: 'Ахмедов Шерзод Рустамович', motherFullName: 'Ахмедова Малика Шарифовна', childFullName: 'Ахмедов Рустам Шерзодович' },
      { id: 19, fatherFullName: 'Ахмедов Шерзод Рустамович', motherFullName: 'Ахмедова Малика Шарифовна', childFullName: 'Ахмедова Мехриниссо Шерзодовна' },
      { id: 20, fatherFullName: 'Саидов Далер Бахтиёрович', motherFullName: 'Саидова Нигина Холовна', childFullName: 'Саидов Бахтиёр Далерович' },
      { id: 21, fatherFullName: 'Саидов Далер Бахтиёрович', motherFullName: 'Саидова Нигина Холовна', childFullName: 'Саидова Парвина Далеровна' },
      { id: 22, fatherFullName: 'Холов Фаррух Ибрагимович', motherFullName: 'Холова Дилрабо Файзуллоевна', childFullName: 'Холов Сомон Фаррухович' },
      { id: 23, fatherFullName: 'Холов Фаррух Ибрагимович', motherFullName: 'Холова Дилрабо Файзуллоевна', childFullName: 'Холова Мавзуна Фарруховна' },
      { id: 24, fatherFullName: 'Шарипов Бобур Комилович', motherFullName: 'Шарипова Мадина Каримовна', childFullName: 'Шарипов Комрон Бобурович' },
      { id: 25, fatherFullName: 'Шарипов Бобур Комилович', motherFullName: 'Шарипова Мадина Каримовна', childFullName: 'Шарипова Дилноза Бобуровна' },
      { id: 26, fatherFullName: 'Рахимов Фирдавс Амонович', motherFullName: 'Рахимова Гулнора Абдуллоевна', childFullName: 'Рахимов Алишер Фирдавсович' },
      { id: 27, fatherFullName: 'Рахимов Фирдавс Амонович', motherFullName: 'Рахимова Гулнора Абдуллоевна', childFullName: 'Рахимова Шукрона Фирдавсовна' },
      { id: 28, fatherFullName: 'Юсуфов Рустам Шарипович', motherFullName: 'Юсуфова Парвина Насруллоевна', childFullName: 'Юсуфов Бахром Рустамович' },
    ];

    const raw = localStorage.getItem(this.localMaternityKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LocalMaternityItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mergedById = new Map<number, LocalMaternityItem>();
          parsed.forEach((item) => mergedById.set(item.id, item));
          seeded.forEach((item) => {
            if (!mergedById.has(item.id)) {
              mergedById.set(item.id, item);
            }
          });
          const merged = Array.from(mergedById.values()).sort((a, b) => a.id - b.id);
          localStorage.setItem(this.localMaternityKey, JSON.stringify(merged));
          return merged;
        }
      } catch {
        // ignore broken local data
      }
    }

    localStorage.setItem(this.localMaternityKey, JSON.stringify(seeded));
    return seeded;
  }

  private loadLocalRecords(): SchoolRecordItem[] {
    const raw = localStorage.getItem(this.localRecordsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as SchoolRecordItem[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item) => ({
        ...item,
        status: item.status || (item.isStudying === 'Да' ? 'Учится' : 'Закончил'),
        comment: (item.comment || '')
          .replace(/^Локальная запись:\s*/i, '')
          .replace(/^Школьная запись:\s*/i, ''),
      }));
    } catch {
      return [];
    }
  }

  private persistLocalRecords(): void {
    localStorage.setItem(this.localRecordsKey, JSON.stringify(this.records));
  }

  private createDefaultForm(): SchoolRecordForm {
    return {
      fatherFullName: '',
      motherFullName: '',
      maternityRecordId: '',
      institutionId: this.institutionOptions[0]?.value?.toString() || '1',
      classNumber: '',
      status: 'Учится',
      admissionDate: '',
    };
  }

  private clearSelectedChildInfo(): void {
    this.selectedFatherFullName = '';
    this.selectedMotherFullName = '';
    this.selectedChildFullName = '';
  }

  private normalizeDateTimeInput(value: string | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private toIsoDateTime(value: string): string {
    return new Date(value).toISOString();
  }

  private formatDateTime(value: string | null): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('ru-RU');
  }

  private normalizeName(value: string | null): string {
    return (value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,]/g, '')
      .trim();
  }
}
