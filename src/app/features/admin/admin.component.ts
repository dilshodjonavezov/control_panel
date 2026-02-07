import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  menuItems = [
    { path: '/admin/dashboard', label: 'Панель управления', icon: '📊' },
    { path: '/admin/citizens', label: 'Призывники', icon: '🧑‍✈️' },
    { path: '/admin/education-registry', label: 'Реестр по образованию', icon: '🗂️' },
    { path: '/admin/deferment-review', label: 'Проверка отсрочек', icon: '✅' },
    { path: '/admin/expulsions', label: 'Отчисления', icon: '⚠️' },
    { path: '/admin/school', label: 'Школа', icon: '🏫' },
    { path: '/admin/university', label: 'ВУЗ / Колледж', icon: '🎓' },
    { path: '/admin/organizations', label: 'Организации', icon: '🏛️' },
    { path: '/admin/users', label: 'Пользователи', icon: '🔐' },
    { path: '/admin/audit', label: 'Аудит', icon: '🧾' },
    { path: '/admin/reports', label: 'Отчеты', icon: '📄' },
    { path: '/admin/settings', label: 'Настройки', icon: '⚙️' }
  ];
}
