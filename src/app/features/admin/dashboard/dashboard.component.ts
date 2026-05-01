import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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

  constructor(private readonly voenkomatDataService: VoenkomatDataService) {}

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
}
