import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ButtonComponent, CardComponent } from '../../../shared/components';
import { CitizenReadCardComponent, CitizenReadCardData } from '../components/citizen-read-card/citizen-read-card.component';
import { ApiZagsActRecord, ZagsActsService, type ZagsActType } from '../../../services/zags-acts.service';

interface ZagsActHistoryItem {
  date: string;
  action: string;
}

interface ZagsActDetails {
  id: string;
  actNumber: string;
  actDate: string;
  type: ZagsActType;
  status: string;
  details: Record<string, string>;
  citizen: CitizenReadCardData | null;
  history: ZagsActHistoryItem[];
}

@Component({
  selector: 'app-zags-act-view',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, CitizenReadCardComponent],
  templateUrl: './zags-act-view.component.html',
  styleUrl: './zags-act-view.component.css',
})
export class ZagsActViewComponent implements OnInit {
  record = signal<ZagsActDetails | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly zagsActsService: ZagsActsService,
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = rawId ? Number(rawId) : NaN;

    if (!Number.isInteger(id) || id <= 0) {
      this.record.set(null);
      return;
    }

    this.zagsActsService
      .getOne(id)
      .pipe(catchError(() => of(null)))
      .subscribe((record) => {
        this.record.set(record ? this.mapRecord(record) : null);
      });
  }

  goBack(): void {
    this.router.navigate(['/zags/acts']);
  }

  getTypeLabel(type: ZagsActType): string {
    const labels: Record<ZagsActType, string> = {
      BIRTH: 'Рождение',
      MARRIAGE: 'Брак',
      DEATH: 'Смерть',
    };
    return labels[type];
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Черновик',
      REGISTERED: 'Зарегистрировано',
      UPDATED: 'Исправлено',
      CANCELLED: 'Отменено',
      ARCHIVED: 'Архив',
    };
    return labels[status] ?? status;
  }

  private mapRecord(record: ApiZagsActRecord): ZagsActDetails {
    const actDate = record.registrationDate ? this.formatDate(record.registrationDate) : '-';
    const type = record.actType;
    const details = this.buildDetails(record);
    const citizen = this.buildCitizen(record);

    return {
      id: String(record.id),
      actNumber: record.actNumber,
      actDate,
      type,
      status: record.status ?? 'DRAFT',
      details,
      citizen,
      history: this.buildHistory(record),
    };
  }

  private buildDetails(record: ApiZagsActRecord): Record<string, string> {
    if (record.actType === 'BIRTH') {
      const birth = record.birthDetails ?? null;
      return {
        'ФИО ребенка': birth?.childFullName?.trim() ?? '-',
        'Дата рождения': this.formatDate(birth?.birthDate ?? null),
        'Место рождения': birth?.birthPlace?.trim() ?? '-',
        'ФИО матери': birth?.motherFullName?.trim() ?? '-',
        'ФИО отца': birth?.fatherFullName?.trim() ?? '-',
        'Основание': birth?.birthCaseType?.trim() ?? '-',
      };
    }

    if (record.actType === 'MARRIAGE') {
      const marriage = record.marriageDetails ?? null;
      return {
        'Супруг(а) 1': marriage?.spouseOneFullName?.trim() ?? '-',
        'Супруг(а) 2': marriage?.spouseTwoFullName?.trim() ?? '-',
        'Дата брака': this.formatDate(marriage?.marriageDate ?? null),
        'Место брака': marriage?.marriagePlace?.trim() ?? '-',
      };
    }

    const death = record.deathDetails ?? null;
    return {
      'ФИО': death?.deceasedFullName?.trim() ?? '-',
      'Дата смерти': this.formatDate(death?.deathDate ?? null),
      'Место смерти': death?.deathPlace?.trim() ?? '-',
      'Причина': death?.deathReason?.trim() ?? '-',
    };
  }

  private buildCitizen(record: ApiZagsActRecord): CitizenReadCardData | null {
    if (record.actType !== 'BIRTH') {
      return null;
    }

    const fullName = record.birthDetails?.childFullName?.trim();
    if (!fullName) {
      return null;
    }

    return {
      id: String(record.birthDetails?.childCitizenId ?? record.citizenId ?? record.id),
      iin: String(record.birthDetails?.childCitizenId ?? record.citizenId ?? record.id),
      fullName,
      birthDate: record.birthDetails?.birthDate ? this.formatDate(record.birthDetails.birthDate) : '-',
      status: 'ACTIVE',
    };
  }

  private buildHistory(record: ApiZagsActRecord): ZagsActHistoryItem[] {
    const createdAt = record.createdAt ? this.formatDateTime(record.createdAt) : null;
    const registrationDate = record.registrationDate ? this.formatDate(record.registrationDate) : null;
    const history: ZagsActHistoryItem[] = [];

    if (createdAt) {
      history.push({
        date: createdAt,
        action: 'Черновик создан',
      });
    }

    if (registrationDate) {
      history.push({
        date: registrationDate,
        action: `Статус: ${this.getStatusLabel(record.status ?? 'DRAFT')}`,
      });
    }

    if (history.length === 0) {
      history.push({
        date: '-',
        action: 'Данные получены из API',
      });
    }

    return history;
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

  private formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
}
