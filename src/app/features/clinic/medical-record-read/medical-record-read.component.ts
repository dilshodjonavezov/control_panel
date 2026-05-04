import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, finalize, forkJoin, of, TimeoutError, timeout } from 'rxjs';
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
import { AuthService } from '../../../services/auth.service';
import { MedicalRecordsService, ApiMedicalRecord, CreateMedicalRecordRequest } from '../../../services/medical-records.service';
import { AddressesService, ApiAddress, ApiCitizen, ApiFamily } from '../../../services/addresses.service';
import { PassportRecordsService, ApiPassportRecord } from '../../../services/passport-records.service';

type Decision = 'FIT' | 'UNFIT';

interface MedicalVisitItem {
  id: number;
  peopleId: number;
  patientFullName: string;
  fatherFullName: string;
  motherFullName: string;
  addressLabel: string;
  clinic: string;
  date: string;
  decision: Decision;
  reason: string;
  defermentReason: string;
  notes: string;
}

interface ExamForm {
  peopleId: string;
  clinic: string;
  examDate: string;
  decision: Decision | '';
  reason: string;
  defermentReason: string;
  notes: string;
}

@Component({
  selector: 'app-medical-record-read',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, SelectComponent, ButtonComponent, ModalComponent],
  templateUrl: './medical-record-read.component.html',
  styleUrl: './medical-record-read.component.css',
})
export class MedicalRecordReadComponent implements OnInit {
  filters = {
    fullName: '',
    address: '',
    decision: 'all',
  };

  columns: TableColumn[] = [
    { key: 'patientFullName', label: 'ФИО', sortable: true },
    { key: 'fatherFullName', label: 'ФИО отца', sortable: true },
    { key: 'motherFullName', label: 'ФИО матери', sortable: true },
    { key: 'addressLabel', label: 'Адрес', sortable: true },
    { key: 'clinic', label: 'Поликлиника', sortable: true },
    { key: 'decision', label: 'Годность', sortable: true },
    { key: 'reason', label: 'Причина', sortable: true },
    { key: 'defermentReason', label: 'Отсрочка', sortable: true },
    { key: 'date', label: 'Дата', sortable: true },
  ];

  records: MedicalVisitItem[] = [];
  candidateOptions: SelectOption[] = [];
  decisionOptions: SelectOption[] = [
    { value: 'FIT', label: 'Годен' },
    { value: 'UNFIT', label: 'Не годен' },
  ];

  isLoading = false;
  errorMessage = '';

  showExamModal = false;
  isEditExamMode = false;
  editingVisitId: number | null = null;
  isFormSubmitting = false;
  examErrorMessage = '';
  examSuccessMessage = '';

  examForm: ExamForm = this.resetExamFormData();

  private citizens: ApiCitizen[] = [];
  private addresses: ApiAddress[] = [];
  private passports: ApiPassportRecord[] = [];
  private families: ApiFamily[] = [];
  private currentOrganizationId: number | null = null;
  private currentOrganizationName: string | null = null;

  constructor(
    private readonly medicalRecordsService: MedicalRecordsService,
    private readonly addressesService: AddressesService,
    private readonly passportRecordsService: PassportRecordsService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentOrganizationId = this.authService.getCurrentUser()?.organizationId ?? null;
    this.currentOrganizationName = this.authService.getCurrentUser()?.organizationName ?? null;
    this.loadData();
    this.route.queryParamMap.subscribe((params) => {
      const action = params.get('action');
      if (!action) {
        return;
      }

      if (action === 'exam') {
        this.openCreateExamModal();
        return;
      }

      this.filters = { fullName: '', address: '', decision: 'all' };
    });
  }

  get filteredVisits(): MedicalVisitItem[] {
    const byName = this.filters.fullName.trim().toLowerCase();
    const byAddress = this.filters.address.trim().toLowerCase();
    const byDecision = this.filters.decision;

    return this.records.filter((record) => {
      const matchesName = !byName || record.patientFullName.toLowerCase().includes(byName);
      const matchesAddress = !byAddress || record.addressLabel.toLowerCase().includes(byAddress);
      const matchesDecision = byDecision === 'all' || record.decision === byDecision;
      return matchesName && matchesAddress && matchesDecision;
    });
  }

  get currentSelectedPersonName(): string {
    return this.getSelectedCitizen()?.fullName?.trim() || '';
  }

  get currentSelectedBirthDate(): string {
    const citizen = this.getSelectedCitizen();
    return citizen?.birthDate ? this.formatDate(citizen.birthDate) : '';
  }

  get currentSelectedGender(): string {
    const citizen = this.getSelectedCitizen();
    return this.formatGender(citizen?.gender ?? '');
  }

  get currentSelectedCitizenship(): string {
    return this.getSelectedCitizen()?.citizenship?.trim() || '';
  }

  get currentSelectedFather(): string {
    return this.resolveFatherName(this.getSelectedCitizen()) || '';
  }

  get currentSelectedMother(): string {
    return this.resolveMotherName(this.getSelectedCitizen()) || '';
  }

  get currentSelectedFamily(): string {
    const family = this.findFamilyForCitizen(this.getSelectedCitizen());
    return family?.familyName?.trim() || (family ? `Семья #${family.id}` : '');
  }

  get currentSelectedAddress(): string {
    return this.findAddressForCitizen(this.getSelectedCitizen())?.fullAddress?.trim() || '';
  }

  get currentSelectedPassport(): string {
    return this.findPassportForCitizen(this.getSelectedCitizen())?.passportNumber?.trim() || '';
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      records: this.medicalRecordsService.getAll().pipe(catchError(() => of([]))),
      citizens: this.medicalRecordsService.getCitizens().pipe(catchError(() => of([]))),
      addresses: this.addressesService.getAll().pipe(catchError(() => of([]))),
      passports: this.passportRecordsService.getAll().pipe(catchError(() => of([]))),
      families: this.addressesService.getFamilies().pipe(catchError(() => of([]))),
    })
      .pipe(timeout(15000))
      .subscribe({
        next: ({ records, citizens, addresses, passports, families }) => {
          this.citizens = citizens;
          this.addresses = addresses;
          this.passports = passports;
          this.families = families;
          this.candidateOptions = this.buildCandidateOptions(citizens);
          const visibleRecords = this.currentOrganizationId
            ? records.filter((record) => record.organizationId === this.currentOrganizationId)
            : records;
          this.records = visibleRecords.map((record) => this.mapRecord(record));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.records = [];
          this.candidateOptions = [];
          this.citizens = [];
          this.addresses = [];
          this.passports = [];
          this.families = [];
          this.errorMessage = error instanceof TimeoutError
            ? 'Превышено время ожидания ответа API.'
            : 'Не удалось загрузить медицинские записи.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  openCreateExamModal(): void {
    this.isEditExamMode = false;
    this.editingVisitId = null;
    this.examForm = this.resetExamFormData();
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
    this.showExamModal = true;
  }

  openEditExamModal(visit: MedicalVisitItem): void {
    this.isEditExamMode = true;
    this.editingVisitId = visit.id;
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
    this.examForm = {
      peopleId: String(visit.peopleId),
      clinic: visit.clinic === '-' ? '' : visit.clinic,
      examDate: this.toInputDate(visit.date),
      decision: visit.decision,
      reason: visit.reason === '-' ? '' : visit.reason,
      defermentReason: visit.defermentReason === '-' ? '' : visit.defermentReason,
      notes: visit.notes === '-' ? '' : visit.notes,
    };
    this.showExamModal = true;
  }

  closeExamModal(): void {
    if (this.isFormSubmitting) {
      return;
    }
    this.showExamModal = false;
  }

  onCandidateChanged(value: string | number | null): void {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      return;
    }
    this.examForm.peopleId = id.toString();
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
  }

  onDecisionChanged(value: string | number | null): void {
    if (value !== 'FIT' && value !== 'UNFIT') {
      this.examForm.decision = '';
      return;
    }
    this.examForm.decision = value;
    this.examErrorMessage = '';
    this.examSuccessMessage = '';
  }

  saveFitnessDecision(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.isFormSubmitting = true;
    this.examErrorMessage = '';
    this.examSuccessMessage = '';

    const request$ =
      this.isEditExamMode && this.editingVisitId
        ? this.medicalRecordsService.update(this.editingVisitId, payload)
        : this.medicalRecordsService.create(payload);

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
            this.examErrorMessage = this.isEditExamMode ? 'Не удалось изменить запись.' : 'Не удалось создать запись.';
            return;
          }
          this.showExamModal = false;
          this.loadData();
        },
        error: () => {
          this.examErrorMessage = this.isEditExamMode ? 'Не удалось изменить запись.' : 'Не удалось создать запись.';
        },
      });
  }

  getStatusLabel(status: string): string {
    return status === 'UNFIT' ? 'Не годен' : 'Годен';
  }

  private mapRecord(record: ApiMedicalRecord): MedicalVisitItem {
    const citizen = this.findCitizenById(record.peopleId);

    return {
      id: record.id,
      peopleId: record.peopleId,
      patientFullName: citizen?.fullName?.trim() || record.peopleFullName?.trim() || `ID ${record.peopleId}`,
      fatherFullName: this.resolveFatherName(citizen) || record.fatherFullName?.trim() || '-',
      motherFullName: this.resolveMotherName(citizen) || record.motherFullName?.trim() || '-',
      addressLabel: this.findAddressForCitizen(citizen)?.fullAddress?.trim() || record.addressLabel?.trim() || '-',
      clinic: record.clinic?.trim() || '-',
      date: this.formatDate(record.createdAtRecord),
      decision: (record.decision as Decision) ?? 'FIT',
      reason: record.reason?.trim() || '-',
      defermentReason: record.defermentReason?.trim() || '-',
      notes: record.notes?.trim() || '-',
    };
  }

  private buildCandidateOptions(citizens: ApiCitizen[]): SelectOption[] {
    return citizens
      .slice()
      .sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? '', 'ru'))
      .map((citizen) => {
        const parentBits: string[] = [];
        const fatherName = this.resolveFatherName(citizen);
        const motherName = this.resolveMotherName(citizen);
        if (fatherName) {
          parentBits.push(`отец: ${fatherName}`);
        }
        if (motherName) {
          parentBits.push(`мать: ${motherName}`);
        }

        return {
          value: String(citizen.id),
          label: parentBits.length > 0 ? `${citizen.fullName} (${parentBits.join(', ')})` : citizen.fullName,
        };
      });
  }

  private buildPayload(): CreateMedicalRecordRequest | null {
    const peopleId = Number(this.examForm.peopleId);
    const userId = this.authService.resolveCurrentUserId();

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.examErrorMessage = 'Выберите гражданина.';
      return null;
    }
    if (!userId) {
      this.examErrorMessage = 'Не удалось определить текущего пользователя.';
      return null;
    }
    if (!this.examForm.clinic.trim()) {
      this.examErrorMessage = 'Укажите поликлинику.';
      return null;
    }
    if (!this.examForm.examDate.trim()) {
      this.examErrorMessage = 'Укажите дату осмотра.';
      return null;
    }
    if (!this.examForm.decision) {
      this.examErrorMessage = 'Выберите итог осмотра.';
      return null;
    }

    return {
      peopleId,
      userId,
      clinic: this.examForm.clinic.trim(),
      decision: this.examForm.decision,
      reason: this.examForm.reason.trim() || null,
      defermentReason: this.examForm.defermentReason.trim() || null,
      createdAtRecord: this.examForm.examDate ? this.toIsoDate(this.examForm.examDate) : null,
      notes: this.examForm.notes.trim() || null,
    };
  }

  private resetExamFormData(): ExamForm {
    return {
      peopleId: '',
      clinic: this.currentOrganizationName?.trim() || 'Поликлиника',
      examDate: new Date().toISOString().slice(0, 10),
      decision: '',
      reason: '',
      defermentReason: '',
      notes: '',
    };
  }

  private getSelectedCitizen(): ApiCitizen | null {
    const peopleId = Number(this.examForm.peopleId);
    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      return null;
    }
    return this.findCitizenById(peopleId);
  }

  private findCitizenById(id: number): ApiCitizen | null {
    return this.citizens.find((citizen) => citizen.id === id) ?? null;
  }

  private resolveFatherName(citizen: ApiCitizen | null): string {
    if (!citizen) {
      return '';
    }
    if (citizen.fatherFullName?.trim()) {
      return citizen.fatherFullName.trim();
    }
    if (citizen.fatherCitizenId) {
      return this.findCitizenById(citizen.fatherCitizenId)?.fullName?.trim() || '';
    }
    return this.findFamilyForCitizen(citizen)?.fatherFullName?.trim() || '';
  }

  private resolveMotherName(citizen: ApiCitizen | null): string {
    if (!citizen) {
      return '';
    }
    if (citizen.motherFullName?.trim()) {
      return citizen.motherFullName.trim();
    }
    if (citizen.motherCitizenId) {
      return this.findCitizenById(citizen.motherCitizenId)?.fullName?.trim() || '';
    }
    return this.findFamilyForCitizen(citizen)?.motherFullName?.trim() || '';
  }

  private findFamilyForCitizen(citizen: ApiCitizen | null): ApiFamily | null {
    if (!citizen) {
      return null;
    }

    return (
      this.families.find((item) => item.id === citizen.familyId) ??
      this.families.find(
        (item) => item.memberCitizenIds.includes(citizen.id) || item.childCitizenIds?.includes(citizen.id),
      ) ??
      null
    );
  }

  private findAddressForCitizen(citizen: ApiCitizen | null): ApiAddress | null {
    if (!citizen) {
      return null;
    }
    const family = this.findFamilyForCitizen(citizen);
    return (
      this.addresses.find((item) => item.citizenId === citizen.id && item.isActive) ??
      this.addresses.find((item) => item.familyId === family?.id && item.isActive) ??
      null
    );
  }

  private findPassportForCitizen(citizen: ApiCitizen | null): ApiPassportRecord | null {
    if (!citizen) {
      return null;
    }
    return this.passports.find((item) => item.peopleId === citizen.id || item.citizenId === citizen.id) ?? null;
  }

  private formatGender(value: string): string {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'MALE') {
      return 'Мужской';
    }
    if (normalized === 'FEMALE') {
      return 'Женский';
    }
    return value.trim();
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

  private toIsoDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toISOString().split('T')[0];
  }

  private toInputDate(value: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
