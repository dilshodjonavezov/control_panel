import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-school',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './school.component.html',
  styleUrl: './school.component.css',
})
export class SchoolComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Школьный учет',
      items: [
        {
          id: 'studies',
          path: '/school/studies',
          label: 'Реестр обучения',
          icon: '🏫',
          hint: 'Ученики, классы и текущий статус обучения',
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
      label: 'Проверить выпускников',
      icon: '🎓',
      description: 'Показать старшие классы и выпускной поток',
      queryParams: { action: 'graduates' },
    },
    {
      path: '/school/studies',
      label: 'Подготовить отсрочки',
      icon: '📘',
      description: 'Показать учащихся для подтверждения учебного статуса',
      queryParams: { action: 'deferment' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Учет', value: 'Школа', hint: 'Начальный образовательный контур для будущих призывников' },
    { label: 'Статус', value: 'Учеба', hint: 'Текущий процесс обучения синхронизирован с военкоматом' },
    { label: 'Переход', value: 'Далее', hint: 'После школы данные подхватывает колледж или вуз' },
  ];
}
