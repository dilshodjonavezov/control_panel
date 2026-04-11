import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.authService.clearToken();
    void this.router.navigate(['/login']);
  }

  menuItems = [
    { path: '/admin/dashboard', label: 'Панель управления', icon: '📊' },
    { path: '/admin/citizens', label: 'Призывники', icon: '🧑‍✈️' },
    { path: '/admin/education-registry', label: 'Реестр по образованию', icon: '🗂️' },
    { path: '/admin/deferment-review', label: 'Проверка отсрочек', icon: '✅' },
    { path: '/admin/expulsions', label: 'Отчисления', icon: '⚠️' },
    // { path: '/admin/school', label: 'Школа', icon: '🏫' },
    // { path: '/admin/university', label: 'ВУЗ / Колледж', icon: '🎓' },
    { path: '/admin/organizations', label: 'Организации', icon: '🏛️' },
    { path: '/admin/users', label: 'Пользователи', icon: '🔐' },
    { path: '/admin/audit', label: 'Аудит', icon: '🧾' },
    // { path: '/admin/reports', label: 'Отчеты', icon: '📄' },
    // { path: '/admin/settings', label: 'Настройки', icon: '⚙️' }
  ];
}
