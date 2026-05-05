import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent, CardComponent } from '../../../shared/components';
import { AuthService } from '../../../services/auth.service';
import {
  ApiMilitaryRecord,
  SaveMilitaryServicePayload,
  VoenkomatCitizenDetail,
  VoenkomatDataService,
} from '../../../services/voenkomat-data.service';

@Component({
  selector: 'app-citizen-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent],
  templateUrl: './citizen-detail.component.html',
  styleUrl: './citizen-detail.component.css'
})
export class CitizenDetailComponent implements OnInit {
  readonly detail = signal<VoenkomatCitizenDetail | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly isServiceModalOpen = signal(false);
  readonly isSavingService = signal(false);
  readonly serviceErrorMessage = signal('');
  readonly serviceUnitOptions = signal<string[]>([]);
  readonly serviceCityOptions = signal<string[]>([]);
  readonly commanderOptions = signal<string[]>([]);

  readonly familyChildren = computed(() => this.detail()?.family?.children ?? []);
  readonly latestMilitaryRecord = computed(() => {
    const records = [...(this.detail()?.militaryRecords ?? [])];
    return records.sort((left, right) => right.id - left.id)[0] ?? null;
  });

  serviceDraft = {
    serviceUnit: '',
    serviceCity: '',
    commanderName: '',
    assignmentDate: '',
    orderNumber: '',
    notes: '',
  };

  private citizenId: number | null = null;

  constructor(
    private readonly voenkomatDataService: VoenkomatDataService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Не удалось определить карточку гражданина.');
      return;
    }

    this.citizenId = id;
    this.loadDetail(id);
  }

  goBack(): void {
    this.router.navigate(['/voenkomat/citizens']);
  }

  canSendToArmy(): boolean {
    const detail = this.detail();
    if (!detail) {
      return false;
    }

    return detail.citizen.voenkomatSection === 'Призывники'
      || detail.citizen.militaryStatus === 'Призывник'
      || detail.citizen.militaryStatus === 'Допризывник';
  }

  openServiceModal(): void {
    const current = this.latestMilitaryRecord();
    this.serviceDraft = {
      serviceUnit: current?.serviceUnit ?? '',
      serviceCity: current?.serviceCity ?? '',
      commanderName: current?.commanderName ?? '',
      assignmentDate: current?.assignmentDate ?? this.getToday(),
      orderNumber: current?.orderNumber ?? '',
      notes: current?.notes ?? '',
    };
    this.serviceErrorMessage.set('');
    this.isServiceModalOpen.set(true);

    this.voenkomatDataService.getMilitaryRecords().subscribe({
      next: (records) => {
        this.serviceUnitOptions.set(this.collectDistinct(records.map((item) => item.serviceUnit)));
        this.serviceCityOptions.set(this.collectDistinct(records.map((item) => item.serviceCity)));
        this.commanderOptions.set(this.collectDistinct(records.map((item) => item.commanderName)));
      },
      error: () => {
        this.serviceUnitOptions.set([]);
        this.serviceCityOptions.set([]);
        this.commanderOptions.set([]);
      },
    });
  }

  closeServiceModal(): void {
    this.isServiceModalOpen.set(false);
    this.isSavingService.set(false);
    this.serviceErrorMessage.set('');
  }

  saveServiceAssignment(): void {
    const detail = this.detail();
    const currentUser = this.authService.getCurrentUser();
    if (!detail || !currentUser?.id) {
      this.serviceErrorMessage.set('Не удалось определить пользователя военкомата.');
      return;
    }

    if (!this.serviceDraft.serviceUnit.trim() || !this.serviceDraft.serviceCity.trim() || !this.serviceDraft.commanderName.trim() || !this.serviceDraft.assignmentDate.trim()) {
      this.serviceErrorMessage.set('Заполните часть, город, командира и дату отправки.');
      return;
    }

    const latestRecord = this.latestMilitaryRecord();
    const payload: SaveMilitaryServicePayload = {
      peopleId: detail.citizen.id,
      userId: currentUser.id,
      office: latestRecord?.office?.trim() || currentUser.organizationName?.trim() || 'Военкомат',
      enlistDate: this.serviceDraft.assignmentDate.trim(),
      assignmentDate: this.serviceDraft.assignmentDate.trim(),
      serviceUnit: this.serviceDraft.serviceUnit.trim(),
      serviceCity: this.serviceDraft.serviceCity.trim(),
      commanderName: this.serviceDraft.commanderName.trim(),
      orderNumber: this.serviceDraft.orderNumber.trim() || null,
      notes: this.serviceDraft.notes.trim() || null,
    };

    this.isSavingService.set(true);
    this.serviceErrorMessage.set('');

    const request$ = latestRecord
      ? this.voenkomatDataService.updateMilitaryRecord(latestRecord.id, payload)
      : this.voenkomatDataService.createMilitaryRecord(payload);

    request$.subscribe({
      next: () => {
        this.isServiceModalOpen.set(false);
        this.isSavingService.set(false);
        if (this.citizenId) {
          this.loadDetail(this.citizenId);
        }
      },
      error: () => {
        this.serviceErrorMessage.set('Не удалось сохранить отправку в армию.');
        this.isSavingService.set(false);
      },
    });
  }

  formatDate(date?: string | null): string {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleDateString('ru-RU');
  }

  private loadDetail(id: number): void {
    this.isLoading.set(true);
    this.voenkomatDataService.getCitizenDetail(id).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.errorMessage.set(detail ? '' : 'Гражданин не найден.');
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить связанную карточку гражданина.');
        this.isLoading.set(false);
      },
    });
  }

  private collectDistinct(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => !!value))]
      .sort((left, right) => left.localeCompare(right, 'ru'));
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }
}
