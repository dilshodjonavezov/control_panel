import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-maternity',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './maternity.component.html',
  styleUrl: './maternity.component.css',
})
export class MaternityComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Регистрация рождения',
      items: [
        {
          id: 'birth-records',
          path: '/maternity/birth-records',
          label: 'Реестр рождений',
          icon: '🍼',
          hint: 'Все записи роддома с родителями и ребенком',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/maternity/birth-records',
      label: 'Новая регистрация',
      icon: '➕',
      description: 'Завести рождение и передать данные в ЗАГС',
      queryParams: { action: 'create' },
    },
    {
      path: '/maternity/birth-records',
      label: 'Проверить отца ребенка',
      icon: '👨',
      description: 'Связать запись рождения с семейной моделью',
      queryParams: { action: 'father-check' },
    },
    {
      path: '/maternity/birth-records',
      label: 'Контроль сыновей',
      icon: '🧒',
      description: 'Проверить постановку мальчиков на первичный учет',
      queryParams: { action: 'sons-control' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Передача', value: 'Авто', hint: 'Запись рождения идет в ЗАГС и семейный реестр' },
    { label: 'Сын', value: 'Учет', hint: 'Мальчики сразу попадают в первичный список военкомата' },
    { label: 'Дочь', value: 'Семья', hint: 'Девочки учитываются в семье, но не ставятся на военный учет' },
  ];
}
