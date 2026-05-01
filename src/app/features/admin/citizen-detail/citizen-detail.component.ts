import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent, CardComponent } from '../../../shared/components';
import { VoenkomatCitizenDetail, VoenkomatDataService } from '../../../services/voenkomat-data.service';

@Component({
  selector: 'app-citizen-detail',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  templateUrl: './citizen-detail.component.html',
  styleUrl: './citizen-detail.component.css'
})
export class CitizenDetailComponent implements OnInit {
  readonly detail = signal<VoenkomatCitizenDetail | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly familyChildren = computed(() => this.detail()?.family?.children ?? []);

  constructor(
    private readonly voenkomatDataService: VoenkomatDataService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Не удалось определить карточку гражданина.');
      return;
    }

    this.isLoading.set(true);
    this.voenkomatDataService.getCitizenDetail(id).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.errorMessage.set(detail ? '' : 'Гражданин не найден.');
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить связанную карточку гражданина.');
        this.isLoading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/citizens']);
  }

  formatDate(date?: string | null): string {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleDateString('ru-RU');
  }
}
