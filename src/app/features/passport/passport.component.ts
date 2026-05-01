import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-passport',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './passport.component.html',
  styleUrl: './passport.component.css',
})
export class PassportComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Документы',
      items: [
        {
          id: 'registry',
          path: '/passport/registry',
          label: 'Паспортный реестр',
          icon: '🪪',
          hint: 'Паспорта, даты выдачи и базовые данные граждан',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/passport/registry',
      label: 'Оформить паспорт',
      icon: '➕',
      description: 'Открыть форму оформления новой паспортной записи',
      queryParams: { action: 'create' },
    },
    {
      path: '/passport/registry',
      label: 'Проверить дату рождения',
      icon: '🗓️',
      description: 'Сверить дату рождения с карточкой гражданина',
      queryParams: { action: 'birth-check' },
    },
    {
      path: '/passport/registry',
      label: 'Синхронизация данных',
      icon: '🔄',
      description: 'Перезагрузить реестр из общего контура граждан',
      queryParams: { action: 'sync' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Основа', value: 'Личность', hint: 'Паспортные данные питают остальные государственные модули' },
    { label: 'Сверка', value: 'Общая', hint: 'Гражданин не выбирается вручную заново в каждом контуре' },
    { label: 'Связь', value: 'Единая', hint: 'Документы увязаны с рождением, адресом и военным учетом' },
  ];
}
