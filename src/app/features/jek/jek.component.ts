import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-jek',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './jek.component.html',
  styleUrl: './jek.component.css',
})
export class JekComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Жилищный учет',
      items: [
        {
          id: 'registry',
          path: '/jek/registry',
          label: 'Адресный реестр',
          icon: '🏠',
          hint: 'Прописка, адреса и состав домохозяйств',
        },
        {
          id: 'families',
          path: '/jek/families',
          label: 'Семейный реестр',
          icon: '👨‍👩‍👧‍👦',
          hint: 'Отец, мать, дети и льготы по семье',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/jek/registry',
      label: 'Проверить прописку',
      icon: '📍',
      description: 'Открыть адресный реестр и сбросить фильтры',
      queryParams: { action: 'registry-check' },
    },
    {
      path: '/jek/families',
      label: 'Открыть семьи',
      icon: '🧬',
      description: 'Перейти в семейный реестр',
      queryParams: { action: 'open-families' },
    },
    {
      path: '/jek/families',
      label: 'Проверить льготы отца',
      icon: '🛡️',
      description: 'Показать семьи с освобождением по двум и более детям',
      queryParams: { action: 'father-exemptions' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Связи', value: 'Семьи', hint: 'Домохозяйство и военкомат опираются на общий состав семьи' },
    { label: 'Источник', value: 'ЖЭК', hint: 'Адрес и семейный состав доступны в одном контуре' },
    { label: 'Результат', value: 'Автоучет', hint: 'Сыновья и льготы по отцу переходят в военкомат' },
  ];
}
