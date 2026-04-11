import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './student.component.html',
  styleUrl: './student.component.css'
})
export class StudentComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.authService.clearToken();
    void this.router.navigate(['/login']);
  }

  menuItems = [
    { path: '/student/dashboard', label: 'Панель студента', icon: '🧭' },
    { path: '/student/profile', label: 'Мой профиль', icon: '👤' },
    { path: '/student/education', label: 'Образование', icon: '🎓' },
    { path: '/student/documents', label: 'Документы', icon: '📄' },
    { path: '/student/requests', label: 'Заявки', icon: '📝' },
    { path: '/student/notifications', label: 'Уведомления', icon: '🔔' },
    { path: '/student/settings', label: 'Настройки', icon: '⚙️' }
  ];
}
