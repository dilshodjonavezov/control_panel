import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, CardComponent, InputComponent, SelectComponent, SelectOption } from '../../../shared/components';
import { type CreateMaternityRecordRequest } from '../../../services/maternity-records.service';

export interface BirthRecordCreatePayload extends CreateMaternityRecordRequest {}

@Component({
  selector: 'app-birth-record-create',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './birth-record-create.component.html',
  styleUrl: './birth-record-create.component.css',
})
export class BirthRecordCreateComponent implements OnChanges {
  @Input() initialData: BirthRecordCreatePayload | null = null;
  @Input() submitLabel: string = 'Сохранить';
  @Output() saved = new EventEmitter<BirthRecordCreatePayload>();

  form = this.createDefaultForm();
  errorMessage = '';

  genderOptions: SelectOption[] = [
    { value: 'M', label: 'M' },
    { value: 'F', label: 'F' },
  ];

  statusOptions: SelectOption[] = [
    { value: 'Registered', label: 'Registered' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Transferred', label: 'Transferred' },
    { value: 'Archived', label: 'Archived' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData']) {
      this.applyInitialData();
    }
  }

  submit(): void {
    const userId = Number(this.form.userId);
    const birthWeight = Number(this.form.birthWeight);

    if (!Number.isInteger(userId) || userId <= 0) {
      this.errorMessage = 'Укажите корректный userId.';
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

    if (!Number.isFinite(birthWeight) || birthWeight <= 0) {
      this.errorMessage = 'Укажите корректный вес при рождении.';
      return;
    }

    this.errorMessage = '';

    this.saved.emit({
      userId,
      birthDateTime: new Date(this.form.birthDateTime).toISOString(),
      placeOfBirth: this.form.placeOfBirth.trim(),
      gender: this.form.gender as BirthRecordCreatePayload['gender'],
      fatherFullName: this.form.fatherFullName.trim(),
      motherFullName: this.form.motherFullName.trim(),
      birthWeight,
      status: this.form.status as BirthRecordCreatePayload['status'],
      comment: this.form.comment.trim(),
    });
  }

  private applyInitialData(): void {
    if (!this.initialData) {
      this.form = this.createDefaultForm();
      this.errorMessage = '';
      return;
    }

    this.form = {
      userId: this.initialData.userId.toString(),
      birthDateTime: this.toDateTimeLocal(this.initialData.birthDateTime),
      placeOfBirth: this.initialData.placeOfBirth || '',
      gender: this.initialData.gender,
      fatherFullName: this.initialData.fatherFullName || '',
      motherFullName: this.initialData.motherFullName || '',
      birthWeight: this.initialData.birthWeight.toString(),
      status: this.initialData.status,
      comment: this.initialData.comment || '',
    };
    this.errorMessage = '';
  }

  private createDefaultForm() {
    return {
      userId: '',
      birthDateTime: '',
      placeOfBirth: '',
      gender: 'M',
      fatherFullName: '',
      motherFullName: '',
      birthWeight: '',
      status: 'Registered',
      comment: '',
    };
  }

  private toDateTimeLocal(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
