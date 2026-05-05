import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../../shared/components';
import { VoenkomatDashboardData, VoenkomatDataService } from '../../../services/voenkomat-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  readonly dashboard = signal<VoenkomatDashboardData | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  constructor(
    private readonly voenkomatDataService: VoenkomatDataService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.voenkomatDataService.getDashboardData().subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить реальные данные панели управления.');
        this.isLoading.set(false);
      },
    });
  }

  openSection(label: string): void {
    const queryParams: Record<string, string> = {};

    if (label === 'Не годен') {
      queryParams['fitness'] = 'Не годен';
    } else if (label === '2+ детей') {
      queryParams['section'] = 'Освобождение по семье';
    } else if (label === 'Учатся') {
      queryParams['section'] = 'Учебная отсрочка';
    } else {
      queryParams['section'] = label;
    }

    this.router.navigate(['/voenkomat/citizens'], { queryParams });
  }

  openQuickFilter(filterId: string): void {
    const queryParams: Record<string, string> = {};

    switch (filterId) {
      case 'conscripts':
        queryParams['section'] = 'Призывники';
        break;
      case 'family':
        queryParams['section'] = 'Освобождение по семье';
        break;
      case 'study':
        queryParams['section'] = 'Учебная отсрочка';
        break;
      case 'completed-service':
        queryParams['section'] = 'Отслужившие';
        break;
      case 'other-men':
        queryParams['section'] = 'Остальные мужчины';
        break;
      case 'abroad':
        queryParams['status'] = 'За границей';
        break;
      default:
        break;
    }

    this.router.navigate(['/voenkomat/citizens'], { queryParams });
  }
}
