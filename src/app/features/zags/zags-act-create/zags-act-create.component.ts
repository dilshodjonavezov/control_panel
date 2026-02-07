import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, InputComponent, SelectComponent, SelectOption, ButtonComponent } from '../../../shared/components';
import { type CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';
type ZagsActType = 'BirthCertificate' | 'Marriage' | 'Children' | 'Death';

type ZagsActStatus = 'DRAFT' | 'REGISTERED' | 'UPDATED';

@Component({
  selector: 'app-zags-act-create',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './zags-act-create.component.html',
  styleUrl: './zags-act-create.component.css'
})
export class ZagsActCreateComponent {
  actType: ZagsActType = 'BirthCertificate';
  status = signal<ZagsActStatus | null>(null);
  lastActionAt = signal<string | null>(null);

  citizenSearch = {
    citizenId: '',
    iin: '',
    fullName: '',
    birthDate: ''
  };

  citizen = signal<CitizenReadCardData | null>(null);

  typeOptions: SelectOption[] = [
    { value: 'BirthCertificate', label: 'Рождение' },
    { value: 'Marriage', label: 'Брак' },
    { value: 'Children', label: 'Дети' },
    { value: 'Death', label: 'Смерть' }
  ];

  birthCertificate = {
    birthDateTime: '',
    birthPlace: '',
    childFullName: '',
    motherFullName: '',
    fatherFullName: ''
  };

  marriage = {
    marriageDate: '',
    place: '',
    registryOffice: '',
    certificateNumber: '',
    spouseOneFullName: '',
    spouseOneIin: '',
    spouseOneBirthDate: '',
    spouseOneCitizenship: '',
    spouseTwoFullName: '',
    spouseTwoIin: '',
    spouseTwoBirthDate: '',
    spouseTwoCitizenship: ''
  };

  children = {
    childFullName: '',
    birthDate: '',
    parentOne: '',
    parentTwo: ''
  };

  death = {
    deathDate: '',
    place: '',
    fullName: '',
    reason: ''
  };

  findCitizen(): void {
    this.citizen.set({
      id: this.citizenSearch.citizenId || 'CIT-849233',
      iin: this.citizenSearch.iin || '800101300123',
      fullName: this.citizenSearch.fullName || 'Иванов Петр Павлович',
      birthDate: this.citizenSearch.birthDate || '01.01.1980',
      status: 'ACTIVE'
    });
  }

  registerAct(): void {
    this.status.set('REGISTERED');
    this.lastActionAt.set(this.getNowLabel());

    if (this.actType === 'Death' && this.citizen()) {
      this.citizen.set({
        ...this.citizen()!,
        status: 'DECEASED'
      });
    }
  }

  saveDraft(): void {
    this.status.set('DRAFT');
    this.lastActionAt.set(this.getNowLabel());
  }

  saveCorrection(): void {
    this.status.set('UPDATED');
    this.lastActionAt.set(this.getNowLabel());
  }

  getStatusLabel(status: ZagsActStatus): string {
    const labels: Record<ZagsActStatus, string> = {
      DRAFT: 'Черновик',
      REGISTERED: 'Зарегистрировано',
      UPDATED: 'Исправлено'
    };
    return labels[status];
  }

  private getNowLabel(): string {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }
}


