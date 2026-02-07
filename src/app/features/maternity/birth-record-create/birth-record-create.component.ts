import { Component, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, InputComponent, SelectComponent, SelectOption, ButtonComponent } from '../../../shared/components';
import { CitizenMiniCardComponent, CitizenMiniCardData } from '../components/citizen-mini-card/citizen-mini-card.component';

type BirthRecordStatus = 'DRAFT' | 'SUBMITTED';
export interface BirthRecordPayload {
  birthDateTime: string;
  place: string;
  sex: 'male' | 'female';
  motherFullName: string;
  fatherFullName: string;
  status: BirthRecordStatus;
}

@Component({
  selector: 'app-birth-record-create',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, ButtonComponent, ],
  templateUrl: './birth-record-create.component.html',
  styleUrl: './birth-record-create.component.css'
})
export class BirthRecordCreateComponent {
  @Output() saved = new EventEmitter<BirthRecordPayload>();
  form = {
    birthDateTime: '',
    place: '',
    sex: 'male',
    motherFullName: '',
    fatherFullName: ''
  };

  status = signal<BirthRecordStatus | null>(null);
  citizen = signal<CitizenMiniCardData | null>(null);
  lastActionAt = signal<string | null>(null);

  sexOptions: SelectOption[] = [
    { value: 'male', label: 'Мальчик' },
    { value: 'female', label: 'Девочка' }
  ];

  saveDraft(): void {
    this.status.set('DRAFT');
    this.citizen.set(null);
    this.lastActionAt.set(this.getNowLabel());
    this.saved.emit({
      ...this.form,
      sex: this.form.sex as BirthRecordPayload['sex'],
      status: 'DRAFT'
    });
  }

  submit(): void {
    this.status.set('SUBMITTED');
    this.lastActionAt.set(this.getNowLabel());

    if (this.form.sex === 'male') {
      this.citizen.set({
        id: 'CIT-2026-0104',
        fullName: 'Новорожденный (ФИО не указано)',
        birthDate: this.form.birthDateTime ? this.form.birthDateTime.replace('T', ' ') : '—',
        status: 'DOPRIZYVNIK'
      });
    } else {
      this.citizen.set(null);
    }

    this.saved.emit({
      ...this.form,
      sex: this.form.sex as BirthRecordPayload['sex'],
      status: 'SUBMITTED'
    });
  }

  canEdit(): boolean {
    return this.status() !== 'SUBMITTED';
  }

  getStatusLabel(status: BirthRecordStatus): string {
    return status === 'DRAFT' ? 'Черновик' : 'Отправлено в центральную систему';
  }

  private getNowLabel(): string {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }
}


