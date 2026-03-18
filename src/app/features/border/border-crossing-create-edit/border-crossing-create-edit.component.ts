import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { asyncScheduler, finalize, observeOn } from 'rxjs';
import {
  BorderCrossingService,
  CreateBorderCrossingRequest,
} from '../../../services/border-crossing.service';
import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  SelectComponent,
  SelectOption,
} from '../../../shared/components';
import { type CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';

interface BorderCrossingForm {
  peopleId: string;
  userId: string;
  departureDate: string;
  returnDate: string;
  outsideBorder: 'true' | 'false';
  country: string;
  description: string;
}

@Component({
  selector: 'app-border-crossing-create-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
  ],
  templateUrl: './border-crossing-create-edit.component.html',
  styleUrl: './border-crossing-create-edit.component.css',
})
export class BorderCrossingCreateEditComponent implements OnChanges, OnInit {
  @Input() citizen: CitizenReadCardData | null = null;
  @Input() recordId: string | null = null;
  @Input() embedded: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  status = signal<'SAVED' | null>(null);
  lastActionAt = signal<string | null>(null);
  isLoading = false;
  isReferenceLoading = false;
  isSubmitting = false;
  errorMessage = '';

  form: BorderCrossingForm = this.createDefaultForm();
  peopleOptions = signal<SelectOption[]>([]);
  userOptions = signal<SelectOption[]>([]);

  outsideBorderOptions: SelectOption[] = [
    { value: 'true', label: 'Да' },
    { value: 'false', label: 'Нет' },
  ];

  constructor(private readonly borderCrossingService: BorderCrossingService) {}

  ngOnInit(): void {
    this.loadReferenceData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['recordId'] && !changes['citizen']) {
      return;
    }
    this.loadRecord();
  }

  save(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;
    const recordId = Number(this.recordId);
    const isEdit = Number.isInteger(recordId) && recordId > 0;

    const request$ = isEdit
      ? this.borderCrossingService.update(recordId, payload)
      : this.borderCrossingService.create(payload);

    request$
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.status.set('SAVED');
          this.lastActionAt.set(this.getNowLabel());
          this.saved.emit();
          if (this.embedded) {
            this.closed.emit();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.resolveApiError(error);
        },
      });
  }

  close(): void {
    if (this.embedded) {
      this.closed.emit();
    }
  }

  private loadRecord(): void {
    this.errorMessage = '';
    this.status.set(null);

    if (!this.recordId) {
      this.form = this.createDefaultForm();
      if (this.citizen?.id) {
        const peopleId = this.extractPeopleId(this.citizen.id);
        if (peopleId) {
          this.form.peopleId = peopleId.toString();
        }
      }
      return;
    }

    const id = Number(this.recordId);
    if (!Number.isInteger(id)) {
      this.errorMessage = 'Некорректный ID записи.';
      return;
    }

    this.isLoading = true;
    this.borderCrossingService
      .getById(id)
      .pipe(
        observeOn(asyncScheduler),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (item) => {
          if (!item) {
            this.errorMessage = 'Запись не найдена.';
            return;
          }

          this.form = {
            peopleId: item.peopleId.toString(),
            userId: item.userId.toString(),
            departureDate: this.toDateTimeLocal(item.departureDate),
            returnDate: item.returnDate ? this.toDateTimeLocal(item.returnDate) : '',
            outsideBorder: item.outsideBorder ? 'true' : 'false',
            country: item.country ?? '',
            description: item.description ?? '',
          };
        },
        error: () => {
          this.errorMessage = 'Не удалось загрузить запись.';
        },
      });
  }

  private loadReferenceData(): void {
    this.isReferenceLoading = true;

    this.borderCrossingService.getPeople().subscribe({
      next: (people) => {
        this.peopleOptions.set(
          people.map((item) => ({
            value: item.id,
            label: item.fullName?.trim() ? item.fullName : `${item.id}`,
          })),
        );
      },
      error: () => {
        this.errorMessage = 'Не удалось загрузить список людей.';
      },
    });

    this.borderCrossingService
      .getUsers()
      .pipe(
        finalize(() => {
          this.isReferenceLoading = false;
        }),
      )
      .subscribe({
        next: (users) => {
          this.userOptions.set(
            users.map((item) => ({
              value: item.id,
              label: item.fullName?.trim() ? item.fullName : `${item.id}`,
            })),
          );
        },
        error: () => {
          this.errorMessage = this.errorMessage
            ? `${this.errorMessage} Не удалось загрузить список пользователей.`
            : 'Не удалось загрузить список пользователей.';
        },
      });
  }

  private buildPayload(): CreateBorderCrossingRequest | null {
    const peopleId = Number(this.form.peopleId);
    const userId = Number(this.form.userId);

    if (!Number.isInteger(peopleId) || peopleId <= 0) {
      this.errorMessage = 'Выберите гражданина.';
      return null;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      this.errorMessage = 'Выберите пользователя.';
      return null;
    }

    if (!this.form.departureDate) {
      this.errorMessage = 'Укажите дату выезда.';
      return null;
    }

    return {
      peopleId,
      userId,
      departureDate: new Date(this.form.departureDate).toISOString(),
      returnDate: this.form.returnDate ? new Date(this.form.returnDate).toISOString() : null,
      outsideBorder: this.form.outsideBorder === 'true',
      country: this.form.country.trim(),
      description: this.form.description.trim(),
    };
  }

  private createDefaultForm(): BorderCrossingForm {
    return {
      peopleId: '',
      userId: '',
      departureDate: '',
      returnDate: '',
      outsideBorder: 'true',
      country: '',
      description: '',
    };
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

  private extractPeopleId(citizenId: string): number | null {
    const numericPart = citizenId.replace(/[^\d]/g, '');
    if (!numericPart) {
      return null;
    }
    const peopleId = Number(numericPart);
    return Number.isInteger(peopleId) ? peopleId : null;
  }

  private getNowLabel(): string {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }

  private resolveApiError(error: HttpErrorResponse | undefined): string {
    const payload = error?.error;

    if (payload && typeof payload === 'object') {
      const message = (payload as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    return this.recordId ? 'Не удалось обновить запись.' : 'Не удалось создать запись.';
  }
}
