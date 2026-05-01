import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-university',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './university.component.html',
  styleUrl: './university.component.css',
})
export class UniversityComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Колледж и вуз',
      items: [
        {
          id: 'studies',
          path: '/university/studies',
          label: 'Реестр обучения',
          icon: '🎓',
          hint: 'Студенты, курсы, факультеты и текущий статус',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/university/studies',
      label: 'Зачисление',
      icon: '➕',
      description: 'Открыть форму новой записи об обучении',
      queryParams: { action: 'create' },
    },
    {
      path: '/university/studies',
      label: 'Проверить отчисления',
      icon: '⚠️',
      description: 'Показать записи с риском потери отсрочки',
      queryParams: { action: 'expulsions' },
    },
    {
      path: '/university/studies',
      label: 'Статус отсрочки',
      icon: '🛡️',
      description: 'Показать записи, связанные с учебной отсрочкой',
      queryParams: { action: 'deferment' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Колледж', value: 'Активен', hint: 'Учебные записи готовы для отсрочек и сверок' },
    { label: 'Риск', value: 'Отчисление', hint: 'Потеря статуса обучения влияет на вызов в военкомат' },
    { label: 'Связь', value: 'Военкомат', hint: 'Учебный модуль встроен в общую бизнес-логику проекта' },
  ];
}
