import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../../shared/components';
import { CitizenStatus } from '../../../models';
import { CitizenService } from '../../../services/citizen.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  totalCitizens = signal(0);
  statusDistribution = signal<Record<CitizenStatus, number>>({
    [CitizenStatus.PRE_CONSCRIPT]: 0,
    [CitizenStatus.CONSCRIPT]: 0,
    [CitizenStatus.STUDENT]: 0,
    [CitizenStatus.FAMILY_CIRCUMSTANCES]: 0,
    [CitizenStatus.UNFIT_HEALTH]: 0,
    [CitizenStatus.ABROAD]: 0,
    [CitizenStatus.IN_SERVICE]: 0,
    [CitizenStatus.DEMOBILIZED]: 0
  });

  activeEducationDeferments = signal(0);
  newRequests = signal(0);
  expulsionsPeriod = signal(0);

  quickFilters = [
    { id: 'pending', label: 'На проверке', count: 8 },
    { id: 'approved', label: 'Подтверждено', count: 24 },
    { id: 'expelled', label: 'Отчислен', count: 5 },
    { id: 'no_docs', label: 'Ошибка/нет документов', count: 3 }
  ];

  statusLabels: Record<CitizenStatus, string> = {
    [CitizenStatus.PRE_CONSCRIPT]: 'Допризывник',
    [CitizenStatus.CONSCRIPT]: 'Призывник',
    [CitizenStatus.STUDENT]: 'Студент',
    [CitizenStatus.FAMILY_CIRCUMSTANCES]: 'Семейные обстоятельства',
    [CitizenStatus.UNFIT_HEALTH]: 'Не годен по здоровью',
    [CitizenStatus.ABROAD]: 'За границей',
    [CitizenStatus.IN_SERVICE]: 'На службе',
    [CitizenStatus.DEMOBILIZED]: 'Дембель'
  };

  constructor(private citizenService: CitizenService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.totalCitizens.set(this.citizenService.getTotalCitizens());
    this.statusDistribution.set(this.citizenService.getStatusDistribution());
    this.activeEducationDeferments.set(42);
    this.newRequests.set(6);
    this.expulsionsPeriod.set(4);
  }

  getStatusEntries(): Array<{ status: CitizenStatus; label: string; count: number }> {
    const distribution = this.statusDistribution();
    return Object.entries(distribution).map(([status, count]) => ({
      status: status as CitizenStatus,
      label: this.statusLabels[status as CitizenStatus],
      count
    }));
  }
}
