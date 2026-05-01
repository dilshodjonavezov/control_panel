import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, CardComponent, InputComponent, ModalComponent, TableColumn, TableComponent } from '../../../shared/components';
import { AuthService } from '../../../services/auth.service';
import { VoenkomatDataService, VoenkomatDefermentRow } from '../../../services/voenkomat-data.service';

type ReviewStatus = 'На проверке' | 'Подтверждено' | 'Отказано' | 'Доработка';

type ReviewItem = VoenkomatDefermentRow & { reviewStatus: ReviewStatus };

@Component({
  selector: 'app-deferment-review',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, InputComponent, ModalComponent],
  templateUrl: './deferment-review.component.html',
  styleUrl: './deferment-review.component.css'
})
export class DefermentReviewComponent implements OnInit {
  readonly items = signal<ReviewItem[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly columns: TableColumn[] = [
    { key: 'fullName', label: 'Гражданин', sortable: true },
    { key: 'basis', label: 'Основание', sortable: true },
    { key: 'institution', label: 'Источник', sortable: true },
    { key: 'document', label: 'Документ', sortable: true },
    { key: 'submittedAt', label: 'Дата', sortable: true },
    { key: 'reviewStatus', label: 'Статус проверки', sortable: true }
  ];

  showModal = false;
  comment = '';
  selected: ReviewItem | null = null;
  action: ReviewStatus | null = null;

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

    this.voenkomatDataService.getDefermentReview().subscribe({
      next: (items) => {
        this.items.set(items.map((item) => ({ ...item, reviewStatus: item.status as ReviewStatus })));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить основания отсрочек.');
        this.isLoading.set(false);
      },
    });
  }

  openDecision(item: ReviewItem, action: ReviewStatus): void {
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

    const decisionMap: Record<Exclude<ReviewStatus, 'На проверке'>, 'APPROVED' | 'REJECTED' | 'NEEDS_WORK'> = {
      'Подтверждено': 'APPROVED',
      'Отказано': 'REJECTED',
      'Доработка': 'NEEDS_WORK',
    };

    if (this.action === 'На проверке') {
      return;
    }

    const request =
      this.selected.sourceType === 'education'
        ? this.voenkomatDataService.reviewEducationDeferment(this.selected.sourceId, {
            decision: decisionMap[this.action],
            userId,
            comment: this.comment || null,
          })
        : this.voenkomatDataService.reviewMilitaryDeferment(this.selected.sourceId, {
            decision: decisionMap[this.action],
            userId,
            comment: this.comment || null,
          });

    this.isSubmitting.set(true);
    request.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showModal = false;
        this.selected = null;
        this.action = null;
        this.loadItems();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Не удалось сохранить решение военкомата.');
      },
    });
  }
}
