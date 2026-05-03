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
          path: '/admin/access',
          label: 'Организации и доступы',
          icon: '🛡️',
          hint: 'Создание служб, логинов и распределение кабинетов',
        },
        {
          id: 'users',
          path: '/admin/users',
          label: 'Пользователи',
          icon: '👤',
          hint: 'Отдельные учётные записи и проверка ролей',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    { path: '/admin/access', label: 'Создать службу', icon: '🏛️', description: 'Добавить военкомат, роддом, ЗАГС, ЖЭК, ВВК, школу и другие организации' },
    { path: '/admin/users', label: 'Проверить логины', icon: '🔐', description: 'Проверить, кому выдан доступ и какие роли назначены' },
    { path: '/admin/access', label: 'Матрица ролей', icon: '📚', description: 'Единая точка управления доступом во всех службах' },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Роли', value: '12', hint: 'Админ, военкомат, ЗАГС, ЖЭК, учеба, ВВК и другие службы' },
    { label: 'Контроль', value: 'Центральный', hint: 'Доступ управляется из одной административной зоны' },
    { label: 'Назначение', value: 'Гибкое', hint: 'Логины и организации можно быстро создавать и менять' },
  ];
}
