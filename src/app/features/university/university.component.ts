import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-university',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './university.component.html',
  styleUrl: './university.component.css',
})
export class UniversityComponent {
  readonly currentUser;
  readonly institutionName;
  readonly accountEmail;
  readonly avatarLetter;

  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Учебный учет',
      items: [
        {
          id: 'studies',
          path: '/university/studies',
          label: 'Студенты и обучение',
          icon: '🎓',
          hint: 'Реестр студентов, факультетов, специальностей и статусов обучения',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/university/studies',
      label: 'Добавить студента',
      icon: '➕',
      description: 'Открыть форму новой записи об обучении',
      queryParams: { action: 'create' },
    },
    {
      path: '/university/studies',
      label: 'Риск отчисления',
      icon: '⚠️',
      description: 'Перейти к записям, которые влияют на отсрочку и статус учебы',
      queryParams: { action: 'expulsions' },
    },
    {
      path: '/university/studies',
      label: 'Учебная отсрочка',
      icon: '🛡️',
      description: 'Показать записи, связанные с активной учебной отсрочкой',
      queryParams: { action: 'deferment' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    {
      label: 'Учреждение',
      value: 'Колледж / ВУЗ',
      hint: 'Кабинет работает с конкретным учреждением, а не с реестром всех заведений',
    },
    {
      label: 'Фокус',
      value: 'Студенты',
      hint: 'Здесь ведутся зачисления, обучение, выпуск и отчисление студентов',
    },
    {
      label: 'Связь',
      value: 'Военкомат',
      hint: 'Статус учебы влияет на отсрочки и дальнейший военный учет',
    },
  ];

  constructor(private readonly authService: AuthService) {
    this.currentUser = this.authService.getCurrentUser();
    this.institutionName = this.currentUser?.organizationName?.trim() || 'Колледж / ВУЗ';
    this.accountEmail = this.currentUser?.email?.trim() || 'university@example.com';
    this.avatarLetter = this.institutionName.charAt(0).toUpperCase() || 'К';
  }
}
