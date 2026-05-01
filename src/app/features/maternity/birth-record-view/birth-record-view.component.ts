import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CardComponent, ButtonComponent } from '../../../shared/components';
import { CitizenMiniCardComponent, CitizenMiniCardData } from '../components/citizen-mini-card/citizen-mini-card.component';
import { ApiMaternityRecord, MaternityRecordsService } from '../../../services/maternity-records.service';

interface BirthRecordHistoryItem {
  date: string;
  action: string;
}

interface BirthRecordDetails {
  id: string;
  birthDateTime: string;
  place: string;
  sex: 'male' | 'female';
  motherFullName: string;
  fatherFullName: string;
  status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED' | 'VOID';
  citizen?: CitizenMiniCardData | null;
  history: BirthRecordHistoryItem[];
}

@Component({
  selector: 'app-birth-record-view',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, CitizenMiniCardComponent],
  templateUrl: './birth-record-view.component.html',
  styleUrl: './birth-record-view.component.css',
})
export class BirthRecordViewComponent implements OnInit {
  record = signal<BirthRecordDetails | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly maternityRecordsService: MaternityRecordsService,
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = rawId ? Number(rawId) : NaN;

    if (!Number.isInteger(id) || id <= 0) {
      this.record.set(null);
      return;
    }

    this.maternityRecordsService
      .getAll()
      .pipe(catchError(() => of([] as ApiMaternityRecord[])))
      .subscribe((records) => {
        const matched = records.find((item) => item.id === id) ?? null;
        this.record.set(matched ? this.mapRecord(matched) : null);
      });
  }

  goBack(): void {
    this.router.navigate(['/maternity/birth-records']);
  }

  getSexLabel(sex: BirthRecordDetails['sex']): string {
    return sex === 'male' ? 'Мальчик' : 'Девочка';
  }

  getStatusLabel(status: BirthRecordDetails['status']): string {
    const labels: Record<BirthRecordDetails['status'], string> = {
      DRAFT: 'Черновик',
      SUBMITTED: 'Отправлено',
      CANCELLED: 'Отменено',
      VOID: 'Аннулировано',
    };
    return labels[status];
  }

  private mapRecord(record: ApiMaternityRecord): BirthRecordDetails {
    return {
      id: String(record.id),
      birthDateTime: this.formatDateTime(record.birthDateTime),
      place: record.placeOfBirth?.trim() || '-',
      sex: this.normalizeSex(record.gender),
      motherFullName: record.motherFullName?.trim() || '-',
      fatherFullName: record.fatherFullName?.trim() || '-',
      status: this.normalizeStatus(record.status),
      citizen: record.childFullName
        ? {
            id: String(record.childCitizenId ?? record.id),
            fullName: record.childFullName.trim(),
            birthDate: this.formatDateTime(record.birthDateTime),
            status: 'DOPRIZYVNIK',
          }
        : null,
      history: this.buildHistory(record),
    };
  }

  private buildHistory(record: ApiMaternityRecord): BirthRecordHistoryItem[] {
    const history: BirthRecordHistoryItem[] = [];

    if (record.createdAt) {
      history.push({
        date: this.formatDateTime(record.createdAt),
        action: 'Запись создана',
      });
    }

    history.push({
      date: this.formatDateTime(record.birthDateTime),
      action: `Текущий статус: ${this.getStatusLabel(this.normalizeStatus(record.status))}`,
    });

    return history;
  }

  private normalizeStatus(status: string | null): BirthRecordDetails['status'] {
    if (!status) {
      return 'DRAFT';
    }

    if (status === 'DRAFT' || status === 'SUBMITTED' || status === 'CANCELLED' || status === 'VOID') {
      return status;
    }

    if (status === 'Pending' || status === 'Черновик') {
      return 'DRAFT';
    }

    if (status === 'Transferred' || status === 'Отправлен в ЗАГС' || status === 'Отправлено в ЗАГС') {
      return 'SUBMITTED';
    }

    if (status === 'Archived' || status === 'Архив' || status === 'Архивирован') {
      return 'VOID';
    }

    return 'DRAFT';
  }

  private normalizeSex(gender: string | null): BirthRecordDetails['sex'] {
    if (gender === 'F' || gender === 'Женский') {
      return 'female';
    }
    return 'male';
  }

  private formatDateTime(value: string | null): string {
    if (!value) {
      return '-';
    }

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
