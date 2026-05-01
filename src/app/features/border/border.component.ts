import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-border',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './border.component.html',
  styleUrl: './border.component.css',
})
export class BorderComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Пограничный контроль',
      items: [
        {
          id: 'crossings',
          path: '/border/crossings',
          label: 'Реестр пересечений',
          icon: '🛂',
          hint: 'Все выезды и возвращения граждан',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/border/crossings',
      label: 'Новая запись',
      icon: '➕',
      description: 'Открыть форму нового пересечения границы',
      queryParams: { action: 'create' },
    },
    {
      path: '/border/crossings',
      label: 'Проверить выезды',
      icon: '✈️',
      description: 'Показать записи с выездом за пределы страны',
      queryParams: { action: 'departures' },
    },
    {
      path: '/border/crossings',
      label: 'Возвраты',
      icon: '↩️',
      description: 'Показать записи по возвратам в страну',
      queryParams: { action: 'returns' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Контроль', value: 'Граница', hint: 'Перемещения граждан учитываются в общей системе' },
    { label: 'Риск', value: 'Выезд', hint: 'Информация может влиять на военный и административный учет' },
    { label: 'Источник', value: 'Реестр', hint: 'Погранслужба ведет единый журнал пересечений' },
  ];
}
