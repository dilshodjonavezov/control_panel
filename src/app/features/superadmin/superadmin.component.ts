import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './superadmin.component.html',
  styleUrl: './superadmin.component.css',
})
export class SuperadminComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Контроль доступа',
      items: [
        {
          id: 'access',
          path: '/superadmin/access',
          label: 'Пользователи и доступы',
          icon: '🛡️',
          hint: 'Назначение ролей и доступ к модулям системы',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    { path: '/superadmin/access', label: 'Роли и права', icon: '🔐', description: 'Проверить, кому открыт каждый модуль системы' },
    { path: '/superadmin/access', label: 'Сеансы и доступ', icon: '🧭', description: 'Контроль учетных записей и служебных пользователей' },
    { path: '/superadmin/access', label: 'Матрица ролей', icon: '📚', description: 'Единая точка управления правами во всех службах' },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Роли', value: '11', hint: 'Военкомат, ЗАГС, ЖЭК, учеба, ВВК и другие службы' },
    { label: 'Контроль', value: 'Центральный', hint: 'Доступ управляется из одной административной зоны' },
    { label: 'Назначение', value: 'Гибкое', hint: 'Права можно быстро сверять и корректировать' },
  ];
}
