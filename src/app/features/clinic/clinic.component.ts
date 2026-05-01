import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-clinic',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './clinic.component.html',
  styleUrl: './clinic.component.css',
})
export class ClinicComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Медицинские данные',
      items: [
        {
          id: 'records',
          path: '/clinic/records',
          label: 'Карта пациента',
          icon: '🩺',
          hint: 'Осмотры, диагнозы и история обращений',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/clinic/records',
      label: 'Медосмотр',
      icon: '📋',
      description: 'Открыть форму нового медосмотра',
      queryParams: { action: 'exam' },
    },
    {
      path: '/clinic/records',
      label: 'История визитов',
      icon: '🧾',
      description: 'Сбросить фильтры и показать историю обращений',
      queryParams: { action: 'history' },
    },
    {
      path: '/vvk/queue',
      label: 'Подготовка к ВВК',
      icon: '🩻',
      description: 'Перейти в очередь ВВК с медицинскими данными',
      queryParams: { action: 'queue' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Источник', value: 'Поликлиника', hint: 'Медицинские данные не дублируются вручную в ВВК' },
    { label: 'Решения', value: 'ВВК', hint: 'Комиссия использует уже собранную карту пациента' },
    { label: 'Статус', value: 'История', hint: 'Осмотры и посещения хранятся в едином реестре' },
  ];
}
