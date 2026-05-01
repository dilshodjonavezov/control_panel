import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, CardComponent, InputComponent, ModalComponent, TableColumn, TableComponent } from '../../../shared/components';
import { AuthService } from '../../../services/auth.service';
import { VoenkomatDataService, VoenkomatExpulsionRow } from '../../../services/voenkomat-data.service';

type ExpulsionStatus = 'Ожидает вызова' | 'Снято с отсрочки' | 'Ошибка данных';

type ExpulsionItem = VoenkomatExpulsionRow & { reviewStatus: ExpulsionStatus; comment?: string };

@Component({
  selector: 'app-expulsion-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent],
  templateUrl: './expulsion-notifications.component.html',
  styleUrl: './expulsion-notifications.component.css'
})
export class ExpulsionNotificationsComponent implements OnInit {
  readonly items = signal<ExpulsionItem[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly columns: TableColumn[] = [
    { key: 'fullName', label: 'Гражданин', sortable: true },
    { key: 'institution', label: 'Учреждение', sortable: true },
    { key: 'orderNumber', label: 'Основание', sortable: true },
    { key: 'date', label: 'Дата', sortable: true },
    { key: 'reviewStatus', label: 'Статус', sortable: true }
  ];

  showModal = false;
  selected: ExpulsionItem | null = null;
  comment = '';
  action: ExpulsionStatus | null = null;

  constructor(
    private readonly voenkomatDataService: VoenkomatDataService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.voenkomatDataService.getExpulsions().subscribe({
      next: (items) => {
        this.items.set(items.map((item) => ({ ...item, reviewStatus: item.status as ExpulsionStatus })));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить уведомления об отчислении.');
        this.isLoading.set(false);
      },
    });
  }

  openDecision(item: ExpulsionItem, action: ExpulsionStatus): void {
    this.selected = item;
    this.action = action;
    this.comment = '';
    this.showModal = true;
  }

  closeModal(): void {
    if (this.isSubmitting()) {
      return;
    }
    this.showModal = false;
    this.selected = null;
    this.action = null;
  }

  applyDecision(): void {
    if (!this.selected || !this.action) {
      return;
    }

    const userId = this.authService.getImpersonatedUserId() ?? this.authService.resolveCurrentUserId();
    if (!userId) {
      this.errorMessage.set('Не удалось определить сотрудника военкомата.');
      return;
    }

    const decisionMap: Record<Exclude<ExpulsionStatus, 'Ожидает вызова'>, 'DEFERMENT_REMOVED' | 'DATA_ERROR'> = {
      'Снято с отсрочки': 'DEFERMENT_REMOVED',
      'Ошибка данных': 'DATA_ERROR',
    };

    if (this.action === 'Ожидает вызова') {
      return;
    }

    this.isSubmitting.set(true);
    this.voenkomatDataService.processEducationExpulsion(this.selected.sourceId, {
      decision: decisionMap[this.action],
      userId,
      comment: this.comment || null,
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showModal = false;
        this.selected = null;
        this.action = null;
        this.loadItems();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Не удалось обработать уведомление об отчислении.');
      },
    });
  }
}
