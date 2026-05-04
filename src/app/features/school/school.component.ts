import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-school',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './school.component.html',
  styleUrl: './school.component.css',
})
export class SchoolComponent {
  readonly currentUser;
  readonly schoolName;
  readonly accountEmail;
  readonly avatarLetter;

  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Школьный учет',
      items: [
        {
          id: 'studies',
          path: '/school/studies',
          label: 'Ученики и классы',
          icon: '🏫',
          hint: 'Реестр школьников, классов и текущих статусов обучения',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/school/studies',
      label: 'Добавить ученика',
      icon: '➕',
      description: 'Открыть форму новой школьной записи',
      queryParams: { action: 'create' },
    },
    {
      path: '/school/studies',
      label: 'Выпускные классы',
      icon: '🎓',
      description: 'Показать старшие классы и выпускной поток',
      queryParams: { action: 'graduates' },
    },
    {
      path: '/school/studies',
      label: 'Подтвердить учебу',
      icon: '📘',
      description: 'Показать учащихся для дальнейшей связки с военкоматом',
      queryParams: { action: 'deferment' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    {
      label: 'Учреждение',
      value: 'Школа',
      hint: 'Школьный контур передает данные дальше в колледж, вуз и военкомат',
    },
    {
      label: 'Фокус',
      value: 'Ученики',
      hint: 'Здесь ведется реестр школьников, классов и статусов обучения',
    },
    {
      label: 'Связь',
      value: 'Военкомат',
      hint: 'Школьные записи используются для будущих учебных отсрочек и общего учета',
    },
  ];

  constructor(private readonly authService: AuthService) {
    this.currentUser = this.authService.getCurrentUser();
    this.schoolName = this.currentUser?.organizationName?.trim() || 'Школа';
    this.accountEmail = this.currentUser?.email?.trim() || 'school@example.com';
    this.avatarLetter = this.schoolName.charAt(0).toUpperCase() || 'Ш';
  }
}
